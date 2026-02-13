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

export async function GET(_request: NextRequest, { params }: Props) {
  const { slug } = await params
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('project_metrics')
    .select('*')
    .eq('project', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ metrics: null, message: 'No analysis data. Run /analyze first.' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ metrics: data })
}
