import { createClient, SupabaseClient } from '@supabase/supabase-js'

type Supabase = SupabaseClient<any, any, any>

let supabase: Supabase

function getClient(): Supabase {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (url: string | URL | Request, init?: RequestInit) =>
            fetch(url, { ...init, cache: 'no-store' }),
        },
      }
    )
  }
  return supabase
}

export interface ProjectComparisonData {
  name: string
  slug: string
  description: string | null
  techStack: string[]
  assetCounts: Record<string, number>
  totalAssets: number
  health: string | null
  metrics: {
    files: number
    loc: number
    symbols: number
    errors: number
    warnings: number
    dependencies: number
  } | null
  monthlyCost: number
  totalUsage: number
}

export async function getProjectComparison(
  slugA: string,
  slugB: string
): Promise<{ a: ProjectComparisonData; b: ProjectComparisonData } | null> {
  const db = getClient()

  const { data: projects } = await db
    .from('projecten')
    .select('*')
    .in('slug', [slugA, slugB])

  if (!projects || projects.length < 2) return null

  async function buildProjectData(slug: string): Promise<ProjectComparisonData> {
    const proj = projects!.find((p: any) => p.slug === slug) as any

    const [registryResult, metricsResult, costsResult, usageResult] = await Promise.all([
      db.from('registry_items').select('type').eq('project', proj.name),
      db.from('project_metrics').select('*').eq('project', slug).single(),
      db.from('service_costs')
        .select('monthly_cost')
        .eq('project', proj.name)
        .eq('period', `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`),
      db.from('usage_statistics')
        .select('value')
        .eq('entity_type', 'project')
        .eq('entity_id', slug),
    ])

    const assetCounts: Record<string, number> = {}
    for (const item of registryResult.data || []) {
      const t = (item as any).type
      assetCounts[t] = (assetCounts[t] || 0) + 1
    }
    const totalAssets = Object.values(assetCounts).reduce((a, b) => a + b, 0)

    const metrics = metricsResult.data
      ? {
          files: (metricsResult.data as any).total_files,
          loc: (metricsResult.data as any).total_loc,
          symbols: (metricsResult.data as any).total_symbols,
          errors: (metricsResult.data as any).total_diagnostics_error,
          warnings: (metricsResult.data as any).total_diagnostics_warning,
          dependencies: (metricsResult.data as any).total_dependencies,
        }
      : null

    const monthlyCost = (costsResult.data || []).reduce(
      (sum: number, c: any) => sum + Number(c.monthly_cost),
      0
    )

    const totalUsage = (usageResult.data || []).reduce(
      (sum: number, u: any) => sum + Number(u.value),
      0
    )

    return {
      name: proj.name,
      slug: proj.slug,
      description: proj.description,
      techStack: proj.tech_stack || [],
      assetCounts,
      totalAssets,
      health: proj.health || null,
      metrics,
      monthlyCost,
      totalUsage,
    }
  }

  const [a, b] = await Promise.all([buildProjectData(slugA), buildProjectData(slugB)])

  return { a, b }
}

export async function getProjectSlugs(): Promise<{ slug: string; name: string }[]> {
  const db = getClient()
  const { data } = await db
    .from('projecten')
    .select('slug, name')
    .order('name')

  return (data || []) as { slug: string; name: string }[]
}
