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
  const depType = searchParams.get('type') || undefined

  const supabase = getSupabase()
  let query = supabase
    .from('project_dependencies')
    .select('*')
    .eq('project', slug)
    .order('dep_type')
    .order('name')

  if (depType) query = query.eq('dep_type', depType)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ dependencies: data, total: data?.length || 0 })
}
