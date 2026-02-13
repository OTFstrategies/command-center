import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind') || undefined
  const file = searchParams.get('file') || undefined
  const name = searchParams.get('name') || undefined
  const exportedOnly = searchParams.get('exported') === 'true'
  const limit = parseInt(searchParams.get('limit') || '100')

  const supabase = getSupabase()
  let query = supabase
    .from('project_symbols')
    .select('*')
    .eq('project', slug)
    .order('file_path')
    .order('line_start')
    .limit(limit)

  if (kind) query = query.eq('kind', kind)
  if (file) query = query.eq('file_path', file)
  if (name) query = query.ilike('name', `%${name}%`)
  if (exportedOnly) query = query.eq('exported', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ symbols: data, total: data?.length || 0 })
}
