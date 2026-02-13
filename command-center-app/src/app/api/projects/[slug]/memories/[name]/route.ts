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
  params: Promise<{ slug: string; name: string }>
}

// GET /api/projects/[slug]/memories/[name] — Read a single memory
export async function GET(_request: NextRequest, { params }: Props) {
  const { slug, name } = await params
  const project = slug.replace(/-/g, ' ')

  let memoryName: string
  try {
    memoryName = decodeURIComponent(name)
  } catch {
    return NextResponse.json({ error: 'Invalid URL encoding in memory name' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('project_memories')
      .select('*')
      .in('project', [project, slug])
      .eq('name', memoryName)
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }

    return NextResponse.json({ memory: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[slug]/memories/[name] — Delete a memory
export async function DELETE(request: NextRequest, { params }: Props) {
  const { slug, name } = await params
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.SYNC_API_KEY
  if (!expectedKey) {
    return NextResponse.json({ error: 'SYNC_API_KEY not configured on server' }, { status: 500 })
  }
  if (apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = slug.replace(/-/g, ' ')

  let memoryName: string
  try {
    memoryName = decodeURIComponent(name)
  } catch {
    return NextResponse.json({ error: 'Invalid URL encoding in memory name' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('project_memories')
      .delete()
      .in('project', [project, slug])
      .eq('name', memoryName)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity (best-effort)
    await supabase.from('activity_log').insert({
      item_type: 'memory',
      item_name: `${project}/${memoryName}`,
      action: 'deleted',
      details: { project, memory_name: memoryName },
    }).then(() => {}, () => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
