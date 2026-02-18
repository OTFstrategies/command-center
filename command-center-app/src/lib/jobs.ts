import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface Job {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  error: string | null
}

export interface SyncStatus {
  id: string
  last_run_at: string | null
  status: string
  duration_ms: number | null
  items_processed: number
  next_run_at: string | null
}

export async function getSyncStatuses(): Promise<SyncStatus[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('sync_status')
    .select('*')
    .order('id')
  return (data || []) as SyncStatus[]
}

export async function getRecentJobs(limit = 10): Promise<Job[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('job_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data || []) as Job[]
}

export async function createJob(
  type: string,
  payload: Record<string, unknown> = {}
): Promise<Job> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('job_queue')
    .insert({ type, status: 'pending', payload })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Job
}

export async function updateJob(
  id: string,
  updates: Partial<Pick<Job, 'status' | 'result' | 'error' | 'started_at' | 'completed_at'>>
): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('job_queue').update(updates).eq('id', id)
}

export async function updateSyncStatus(
  id: string,
  updates: Partial<Omit<SyncStatus, 'id'>>
): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('sync_status').update(updates).eq('id', id)
}
