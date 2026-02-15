import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { CodeSymbol, CodeDiagnostic, CodeDependency, CodeMetrics } from '@/types'

let supabase: SupabaseClient | null = null

// Normalize project name to slug format (lowercase, dashes) to match MCP analyzer storage
function toSlug(project: string): string {
  return project.toLowerCase().replace(/\s+/g, '-')
}

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase environment variables not configured')
    }

    supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return supabase
}

export async function getProjectMetrics(project: string): Promise<CodeMetrics | null> {
  try {
    const { data, error } = await getSupabase()
      .from('project_metrics')
      .select('*')
      .eq('project', toSlug(project))
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

export async function getProjectSymbols(
  project: string,
  options?: { kind?: string; exported?: boolean; limit?: number }
): Promise<CodeSymbol[]> {
  try {
    let query = getSupabase()
      .from('project_symbols')
      .select('*')
      .eq('project', toSlug(project))
      .order('file_path')
      .order('line_start')
      .limit(options?.limit || 100)

    if (options?.kind) query = query.eq('kind', options.kind)
    if (options?.exported) query = query.eq('exported', true)

    const { data, error } = await query
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function getProjectDiagnostics(project: string): Promise<CodeDiagnostic[]> {
  try {
    const { data, error } = await getSupabase()
      .from('project_diagnostics')
      .select('*')
      .eq('project', toSlug(project))
      .order('severity')
      .order('file_path')

    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function getProjectDependencies(project: string): Promise<CodeDependency[]> {
  try {
    const { data, error } = await getSupabase()
      .from('project_dependencies')
      .select('*')
      .eq('project', toSlug(project))
      .order('dep_type')
      .order('name')

    if (error) return []
    return data || []
  } catch {
    return []
  }
}
