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

// GET /api/projects/[slug]/memories — List all memories for project
export async function GET(_request: NextRequest, { params }: Props) {
  const { slug } = await params
  const project = slug.replace(/-/g, ' ')

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('project_memories')
      .select('id, project, name, content, created_at, updated_at')
      .in('project', [project, slug])
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ memories: data || [] })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[slug]/memories — Create or update a memory
export async function POST(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.SYNC_API_KEY
  if (!expectedKey) {
    return NextResponse.json({ error: 'SYNC_API_KEY not configured on server' }, { status: 500 })
  }
  if (apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let body: { name?: string; content?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, content } = body
    if (!name || !content) {
      return NextResponse.json(
        { error: 'name and content required' },
        { status: 400 }
      )
    }

    const project = slug.replace(/-/g, ' ')
    const supabase = getSupabase()

    // Upsert: atomic create-or-update (no race condition)
    const { data, error } = await supabase
      .from('project_memories')
      .upsert(
        { project, name, content, updated_at: new Date().toISOString() },
        { onConflict: 'project,name' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity (best-effort, don't fail on logging errors)
    await supabase.from('activity_log').insert({
      item_type: 'memory',
      item_name: `${project}/${name}`,
      action: 'synced',
      details: { project, memory_name: name },
    }).then(() => {}, () => {})

    return NextResponse.json({
      success: true,
      memory: data,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
