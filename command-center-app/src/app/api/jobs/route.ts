import { NextRequest, NextResponse } from 'next/server'
import { getSyncStatuses, getRecentJobs, createJob } from '@/lib/jobs'

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
