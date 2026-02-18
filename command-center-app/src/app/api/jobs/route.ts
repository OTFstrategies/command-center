import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSyncStatuses, getRecentJobs, createJob } from '@/lib/jobs'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')

    if (view === 'status') {
      const statuses = await getSyncStatuses()
      return NextResponse.json({ statuses })
    }

    const jobs = await getRecentJobs()
    return NextResponse.json({ jobs })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, payload } = body as { type: string; payload?: Record<string, unknown> }

    if (!type) {
      return NextResponse.json({ error: 'type required' }, { status: 400 })
    }

    const validTypes = ['registry_sync', 'deep_scan', 'health_check', 'code_analysis']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Valid: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const job = await createJob(type, payload || {})
    return NextResponse.json({ success: true, job })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/jobs - Update job status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, result, duration_ms, error: jobError } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    const updateData: Record<string, unknown> = { status }
    if (result) updateData.result = result
    if (jobError) updateData.error = jobError
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }
    if (status === 'running') {
      updateData.started_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('job_queue')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Update sync_status when job completes
    if (status === 'completed' || status === 'failed') {
      const jobType = body.type || 'registry_sync'
      const syncStatusId = jobType === 'deep_scan' ? 'deep_scan' :
                           jobType === 'health_check' ? 'health_check' : 'registry_sync'
      await supabase.from('sync_status').update({
        status: status === 'completed' ? 'success' : 'failed',
        last_run_at: new Date().toISOString(),
        duration_ms: duration_ms || null,
        items_processed: result?.total_items || 0,
        next_run_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      }).eq('id', syncStatusId)
    }

    return NextResponse.json({ success: true, id, status })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
