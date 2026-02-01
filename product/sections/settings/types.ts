export type SyncStatus = 'synced' | 'pending' | 'error' | 'never';

export interface SyncTypeConfig {
  type: string;
  enabled: boolean;
  lastSynced?: string;
  itemCount: number;
}

export interface SupabaseConfig {
  projectUrl: string;
  isConnected: boolean;
}

export interface SettingsData {
  supabase: SupabaseConfig;
  syncStatus: SyncStatus;
  lastSyncTime?: string;
  syncTypes: SyncTypeConfig[];
}
