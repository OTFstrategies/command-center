export type RegistryItemType = 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction'
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'synced'

export interface RegistryItem {
  id: string
  type: RegistryItemType
  name: string
  path: string
  description: string | null
  project: string
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  synced_at: string
}

export interface ActivityLogEntry {
  id: string
  action: ActivityAction
  item_type: string
  item_id: string | null
  item_name: string
  details: Record<string, unknown>
  created_at: string
}

export type RegistryItemInsert = {
  type: RegistryItemType
  name: string
  path: string
  description?: string | null
  project?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  synced_at?: string
}

export type ActivityLogInsert = {
  action: ActivityAction
  item_type: string
  item_id?: string | null
  item_name: string
  details?: Record<string, unknown>
}

export interface Database {
  public: {
    Tables: {
      registry_items: {
        Row: RegistryItem
        Insert: RegistryItemInsert
        Update: Partial<RegistryItemInsert>
      }
      activity_log: {
        Row: ActivityLogEntry
        Insert: ActivityLogInsert
        Update: Partial<ActivityLogInsert>
      }
    }
  }
}
