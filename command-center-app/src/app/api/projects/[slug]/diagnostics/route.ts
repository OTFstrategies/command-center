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
  const severity = searchParams.get('severity') || undefined

  const supabase = getSupabase()
  let query = supabase
    .from('project_diagnostics')
    .select('*')
    .eq('project', slug)
    .order('severity')
    .order('file_path')

  if (severity) query = query.eq('severity', severity)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const summary = {
    error: data?.filter((d: { severity: string }) => d.severity === 'error').length || 0,
    warning: data?.filter((d: { severity: string }) => d.severity === 'warning').length || 0,
    suggestion: data?.filter((d: { severity: string }) => d.severity === 'suggestion').length || 0,
  }

  return NextResponse.json({ diagnostics: data, summary })
}
