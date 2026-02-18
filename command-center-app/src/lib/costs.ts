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

export interface ServiceCost {
  id: string
  service: string
  project: string | null
  plan: string | null
  monthly_cost: number
  usage_metric: string | null
  usage_value: number
  period: string
  detected_at: string
}

export interface CostSummary {
  totalMonthly: number
  byService: { service: string; total: number; projects: string[] }[]
  byProject: { project: string; total: number; services: string[] }[]
  trend: { period: string; total: number }[]
}

export async function getCosts(period?: string): Promise<ServiceCost[]> {
  const db = getClient()
  let query = db.from('service_costs').select('*').order('period', { ascending: false })
  if (period) query = query.eq('period', period)
  const { data } = await query
  return (data || []) as ServiceCost[]
}

export async function getCostSummary(): Promise<CostSummary> {
  const db = getClient()
  const { data: all } = await db
    .from('service_costs')
    .select('*')
    .order('period', { ascending: false })

  const costs = (all || []) as ServiceCost[]

  // Huidige maand
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonth = costs.filter((c) => c.period === currentPeriod)

  const totalMonthly = currentMonth.reduce((sum, c) => sum + Number(c.monthly_cost), 0)

  // Groepeer per service
  const serviceMap = new Map<string, { total: number; projects: Set<string> }>()
  for (const c of currentMonth) {
    const entry = serviceMap.get(c.service) || { total: 0, projects: new Set<string>() }
    entry.total += Number(c.monthly_cost)
    if (c.project) entry.projects.add(c.project)
    serviceMap.set(c.service, entry)
  }
  const byService = Array.from(serviceMap.entries())
    .map(([service, v]) => ({ service, total: v.total, projects: Array.from(v.projects) }))
    .sort((a, b) => b.total - a.total)

  // Groepeer per project
  const projectMap = new Map<string, { total: number; services: Set<string> }>()
  for (const c of currentMonth) {
    const proj = c.project || 'Globaal'
    const entry = projectMap.get(proj) || { total: 0, services: new Set<string>() }
    entry.total += Number(c.monthly_cost)
    entry.services.add(c.service)
    projectMap.set(proj, entry)
  }
  const byProject = Array.from(projectMap.entries())
    .map(([project, v]) => ({ project, total: v.total, services: Array.from(v.services) }))
    .sort((a, b) => b.total - a.total)

  // Trend: laatste 6 maanden
  const periodMap = new Map<string, number>()
  for (const c of costs) {
    periodMap.set(c.period, (periodMap.get(c.period) || 0) + Number(c.monthly_cost))
  }
  const trend = Array.from(periodMap.entries())
    .map(([period, total]) => ({ period, total }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-6)

  return { totalMonthly, byService, byProject, trend }
}

export async function upsertCost(cost: Omit<ServiceCost, 'id' | 'detected_at'>): Promise<void> {
  const db = getClient()
  await db.from('service_costs').upsert(
    { ...cost, detected_at: new Date().toISOString() },
    { onConflict: 'service,project,period' }
  )
}
