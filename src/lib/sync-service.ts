import { supabase, SUPABASE_PROJECT_URL } from './supabase'
import type { RegistryItem, RegistryItemType, ActivityLogEntry, RegistryItemInsert, ActivityLogInsert } from '@/types/database'

export interface SyncResult {
  success: boolean
  itemsSynced: number
  errors: string[]
}

export interface SyncStats {
  totalItems: number
  byType: Record<RegistryItemType, number>
  lastSyncTime: string | null
}

// Fetch all registry items from Supabase
export async function fetchRegistryItems(type?: RegistryItemType): Promise<RegistryItem[]> {
  let query = supabase
    .from('registry_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching registry items:', error)
    throw error
  }

  return (data as RegistryItem[]) || []
}

// Fetch activity log
export async function fetchActivityLog(limit = 50): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching activity log:', error)
    throw error
  }

  return (data as ActivityLogEntry[]) || []
}

// Upsert registry items (sync from local to Supabase)
export async function syncItemsToSupabase(items: RegistryItemInsert[]): Promise<SyncResult> {
  const errors: string[] = []
  let itemsSynced = 0

  for (const item of items) {
    const insertData: RegistryItemInsert = {
      ...item,
      synced_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('registry_items')
      .upsert(insertData, { onConflict: 'type,path' })

    if (error) {
      errors.push(`Failed to sync ${item.name}: ${error.message}`)
    } else {
      itemsSynced++
    }
  }

  // Log the sync action
  if (itemsSynced > 0) {
    await logActivity('synced', 'bulk', null, `${itemsSynced} items`, { itemsSynced })
  }

  return {
    success: errors.length === 0,
    itemsSynced,
    errors,
  }
}

// Log an activity
export async function logActivity(
  action: 'created' | 'updated' | 'deleted' | 'synced',
  itemType: string,
  itemId: string | null,
  itemName: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const insertData: ActivityLogInsert = {
    action,
    item_type: itemType,
    item_id: itemId,
    item_name: itemName,
    details,
  }

  const { error } = await supabase
    .from('activity_log')
    .insert(insertData)

  if (error) {
    console.error('Error logging activity:', error)
  }
}

// Get sync statistics
export async function getSyncStats(): Promise<SyncStats> {
  const { data, error } = await supabase
    .from('registry_items')
    .select('type, synced_at')

  if (error) {
    console.error('Error fetching sync stats:', error)
    return {
      totalItems: 0,
      byType: { api: 0, prompt: 0, skill: 0, agent: 0, command: 0, instruction: 0 },
      lastSyncTime: null,
    }
  }

  const byType: Record<RegistryItemType, number> = {
    api: 0,
    prompt: 0,
    skill: 0,
    agent: 0,
    command: 0,
    instruction: 0,
  }

  let lastSyncTime: string | null = null

  const items = (data || []) as { type: string; synced_at: string }[]
  for (const item of items) {
    if (item.type in byType) {
      byType[item.type as RegistryItemType]++
    }
    if (!lastSyncTime || item.synced_at > lastSyncTime) {
      lastSyncTime = item.synced_at
    }
  }

  return {
    totalItems: items.length,
    byType,
    lastSyncTime,
  }
}

// Check connection status
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('registry_items').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Get project URL for display
export function getProjectUrl(): string {
  return SUPABASE_PROJECT_URL
}

// Delete an item
export async function deleteRegistryItem(id: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('registry_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting registry item:', error)
    return false
  }

  await logActivity('deleted', 'registry_item', id, name)
  return true
}

// Create or update a single item
export async function upsertRegistryItem(item: RegistryItemInsert): Promise<RegistryItem | null> {
  const insertData: RegistryItemInsert = {
    ...item,
    synced_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('registry_items')
    .upsert(insertData, { onConflict: 'type,path' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting registry item:', error)
    return null
  }

  const result = data as RegistryItem
  await logActivity('created', item.type, result.id, item.name)
  return result
}
