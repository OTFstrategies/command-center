import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or SERVICE_ROLE_KEY not configured')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/sync/inbox - Stage inbox data
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.SYNC_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const body = await request.json()
    const { project, slug, manifest, project_meta, registry_data } = body

    if (!project || !slug || !manifest || !registry_data) {
      return NextResponse.json(
        { error: 'Missing required fields: project, slug, manifest, registry_data' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Upsert: replace existing pending entry for same project
    const { error: deleteError } = await supabase
      .from('inbox_pending')
      .delete()
      .eq('slug', slug)
      .eq('status', 'pending')

    if (deleteError) {
      console.error('Delete existing pending error:', deleteError)
    }

    const { data, error } = await supabase
      .from('inbox_pending')
      .insert({
        project,
        slug,
        manifest,
        project_meta: project_meta || {},
        registry_data,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Insert inbox error:', error)
      return NextResponse.json(
        { error: `Failed to stage inbox: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      message: `Project "${project}" staged for sync`,
    })
  } catch (error) {
    console.error('Inbox error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/sync/inbox - Get pending items
export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('inbox_pending')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch inbox error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ pending: data || [] })
  } catch (error) {
    console.error('Inbox GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
