import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

interface Props {
  params: Promise<{ slug: string }>
}

// GET /api/projects/[slug] — Get project with metadata
export async function GET(_request: NextRequest, { params }: Props) {
  const { slug } = await params

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[slug] — Update project metadata
export async function PATCH(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const allowed = ['description', 'tech_stack', 'build_command', 'test_command', 'dev_command', 'languages', 'live_url', 'repo_url']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('slug', slug)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      item_type: 'project',
      item_name: slug,
      action: 'updated',
      details: { updated_fields: Object.keys(updates) },
    })

    return NextResponse.json({ project: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
