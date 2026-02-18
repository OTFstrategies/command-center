import { createClient } from '@supabase/supabase-js'
import type { Alert, AlertCounts } from '@/types'

export type { Alert, AlertCounts }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getAlerts(options?: {
  status?: string
  severity?: string
  limit?: number
}): Promise<Alert[]> {
  const supabase = getSupabase()
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit || 50)

  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }

  const { data } = await query
  return (data || []) as Alert[]
}

export async function getAlertCounts(): Promise<AlertCounts> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('alerts')
    .select('severity, status')
    .in('status', ['new', 'acknowledged'])

  const alerts = data || []
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    new: alerts.filter(a => a.status === 'new').length,
  }
}

export async function updateAlertStatus(
  id: string,
  status: 'acknowledged' | 'resolved' | 'dismissed'
): Promise<void> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = { status }
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString()
  }
  await supabase.from('alerts').update(update).eq('id', id)
}

export async function bulkUpdateAlerts(
  ids: string[],
  status: 'acknowledged' | 'resolved' | 'dismissed'
): Promise<void> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = { status }
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString()
  }
  await supabase.from('alerts').update(update).in('id', ids)
}
