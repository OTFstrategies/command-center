import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

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

export interface SharedView {
  id: string
  type: 'map' | 'project' | 'comparison'
  token: string
  data_snapshot: unknown
  expires_at: string
  created_at: string
}

export async function createSharedView(
  type: SharedView['type'],
  dataSnapshot: unknown
): Promise<{ token: string; expiresAt: string } | null> {
  const db = getClient()
  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error } = await db.from('shared_views').insert({
    type,
    token,
    data_snapshot: dataSnapshot,
    expires_at: expiresAt,
  })

  if (error) return null
  return { token, expiresAt }
}

export async function getSharedView(token: string): Promise<SharedView | null> {
  const db = getClient()
  const { data } = await db
    .from('shared_views')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  return data as SharedView | null
}
