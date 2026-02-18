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

export interface Bookmark {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  label: string | null
  sort_order: number
  created_at: string
}

export async function getBookmarks(userId: string = 'default'): Promise<Bookmark[]> {
  const db = getClient()
  const { data } = await db
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')

  return (data || []) as Bookmark[]
}

export async function addBookmark(
  entityType: string,
  entityId: string,
  label?: string,
  userId: string = 'default'
): Promise<Bookmark | null> {
  const db = getClient()

  const { data: last } = await db
    .from('user_bookmarks')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = last ? (last as any).sort_order + 1 : 0

  const { data, error } = await db
    .from('user_bookmarks')
    .insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      label: label || null,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return null
  return data as Bookmark
}

export async function removeBookmark(bookmarkId: string): Promise<boolean> {
  const db = getClient()
  const { error } = await db.from('user_bookmarks').delete().eq('id', bookmarkId)
  return !error
}

export async function isBookmarked(
  entityType: string,
  entityId: string,
  userId: string = 'default'
): Promise<boolean> {
  const db = getClient()
  const { data } = await db
    .from('user_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single()

  return !!data
}
