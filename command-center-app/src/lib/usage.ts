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

export interface UsageStat {
  id: string
  entity_type: string
  entity_id: string
  metric: string
  value: number
  period: string
  last_used: string | null
  created_at: string
}

export interface UsageRanking {
  entity_id: string
  entity_type: string
  name: string
  totalInvocations: number
  lastUsed: string | null
}

export interface UsageSummary {
  topUsed: UsageRanking[]
  neverUsed: { id: string; name: string; type: string }[]
  totalInvocations: number
  activeThisMonth: number
}

export async function getUsageStats(entityType?: string, period?: string): Promise<UsageStat[]> {
  const db = getClient()
  let query = db.from('usage_statistics').select('*').order('value', { ascending: false })
  if (entityType) query = query.eq('entity_type', entityType)
  if (period) query = query.eq('period', period)
  const { data } = await query
  return (data || []) as UsageStat[]
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const db = getClient()

  const [usageResult, registryResult] = await Promise.all([
    db.from('usage_statistics')
      .select('*')
      .eq('metric', 'invocations')
      .order('value', { ascending: false }),
    db.from('registry_items')
      .select('id, name, type'),
  ])

  const usageData = (usageResult.data || []) as UsageStat[]
  const registryData = (registryResult.data || []) as { id: string; name: string; type: string }[]

  // Aggregeer per entity
  const entityMap = new Map<string, { type: string; total: number; lastUsed: string | null }>()
  for (const u of usageData) {
    const key = `${u.entity_type}:${u.entity_id}`
    const entry = entityMap.get(key) || { type: u.entity_type, total: 0, lastUsed: null }
    entry.total += u.value
    if (u.last_used && (!entry.lastUsed || u.last_used > entry.lastUsed)) {
      entry.lastUsed = u.last_used
    }
    entityMap.set(key, entry)
  }

  // Match met registry namen
  const registryNameMap = new Map<string, string>()
  for (const r of registryData) {
    registryNameMap.set(r.id, r.name)
    registryNameMap.set(`${r.type}:${r.name}`, r.name)
  }

  const topUsed: UsageRanking[] = Array.from(entityMap.entries())
    .map(([key, v]) => ({
      entity_id: key.split(':').slice(1).join(':'),
      entity_type: v.type,
      name: registryNameMap.get(key) || key.split(':').slice(1).join(':'),
      totalInvocations: v.total,
      lastUsed: v.lastUsed,
    }))
    .sort((a, b) => b.totalInvocations - a.totalInvocations)
    .slice(0, 20)

  // Vind items zonder usage
  const usedIds = new Set(usageData.map((u) => u.entity_id))
  const neverUsed = registryData
    .filter((r) => !usedIds.has(r.name) && !usedIds.has(r.id))
    .map((r) => ({ id: r.id, name: r.name, type: r.type }))

  const totalInvocations = usageData.reduce((sum, u) => sum + u.value, 0)

  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const activeThisMonth = new Set(
    usageData.filter((u) => u.period === currentPeriod).map((u) => u.entity_id)
  ).size

  return { topUsed, neverUsed, totalInvocations, activeThisMonth }
}

export async function recordUsage(
  entityType: string,
  entityId: string,
  metric: string = 'invocations',
  value: number = 1
): Promise<void> {
  const db = getClient()
  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { data: existing } = await db
    .from('usage_statistics')
    .select('id, value')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('metric', metric)
    .eq('period', period)
    .single()

  if (existing) {
    await db
      .from('usage_statistics')
      .update({ value: existing.value + value, last_used: now.toISOString() })
      .eq('id', existing.id)
  } else {
    await db.from('usage_statistics').insert({
      entity_type: entityType,
      entity_id: entityId,
      metric,
      value,
      period,
      last_used: now.toISOString(),
    })
  }
}
