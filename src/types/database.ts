export type RegistryItemType = 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction'

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
  action: 'created' | 'updated' | 'deleted' | 'synced'
  item_type: string
  item_id: string | null
  item_name: string
  details: Record<string, unknown>
  created_at: string
}
