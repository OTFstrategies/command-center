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

export interface EntityVersion {
  id: string
  entity_type: string
  entity_id: string
  version: string
  change_type: 'added' | 'modified' | 'removed'
  title: string
  description: string | null
  items_changed: unknown[]
  detected_at: string
  detected_by: string
}

export interface TimelineDay {
  date: string
  label: string
  events: EntityVersion[]
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Vandaag'
  if (diffDays === 1) return 'Gisteren'
  if (diffDays < 7) return `${diffDays} dagen geleden`

  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function getTimeline(limit: number = 100): Promise<TimelineDay[]> {
  const db = getClient()
  const { data } = await db
    .from('entity_versions')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(limit)

  const versions = (data || []) as EntityVersion[]

  // Groepeer per dag
  const dayMap = new Map<string, EntityVersion[]>()
  for (const v of versions) {
    const day = v.detected_at.slice(0, 10)
    const existing = dayMap.get(day) || []
    existing.push(v)
    dayMap.set(day, existing)
  }

  return Array.from(dayMap.entries())
    .map(([date, events]) => ({
      date,
      label: formatDateLabel(date),
      events,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getEntityHistory(
  entityType: string,
  entityId: string
): Promise<EntityVersion[]> {
  const db = getClient()
  const { data } = await db
    .from('entity_versions')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('detected_at', { ascending: false })

  return (data || []) as EntityVersion[]
}
