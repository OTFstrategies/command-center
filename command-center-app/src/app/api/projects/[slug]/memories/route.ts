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
      .or(`project.eq.${project},project.eq.${slug}`)
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
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, content } = await request.json()
    if (!name || !content) {
      return NextResponse.json(
        { error: 'name and content required' },
        { status: 400 }
      )
    }

    const project = slug.replace(/-/g, ' ')
    const supabase = getSupabase()

    // Upsert: update if exists, insert if not
    const { data: existing } = await supabase
      .from('project_memories')
      .select('id')
      .eq('project', project)
      .eq('name', name)
      .limit(1)
      .single()

    let result
    if (existing) {
      result = await supabase
        .from('project_memories')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('project_memories')
        .insert({ project, name, content })
        .select()
        .single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      item_type: 'memory',
      item_name: `${project}/${name}`,
      action: existing ? 'updated' : 'created',
      details: { project, memory_name: name },
    })

    return NextResponse.json({
      success: true,
      memory: result.data,
      action: existing ? 'updated' : 'created',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
