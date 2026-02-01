import { useState, useEffect, useCallback } from 'react'
import {
  fetchRegistryItems,
  fetchActivityLog,
  getSyncStats,
  checkConnection,
  getProjectUrl,
  type SyncStats,
  type SyncResult,
} from '../sync-service'
import type { RegistryItem, RegistryItemType, ActivityLogEntry } from '@/types/database'

export type SyncStatus = 'synced' | 'pending' | 'error' | 'never'

export interface UseSyncResult {
  // Connection
  isConnected: boolean
  projectUrl: string

  // Status
  syncStatus: SyncStatus
  lastSyncTime: string | null
  isLoading: boolean
  error: string | null

  // Stats
  stats: SyncStats | null

  // Actions
  sync: () => Promise<SyncResult>
  refresh: () => Promise<void>
}

export function useSync(): UseSyncResult {
  const [isConnected, setIsConnected] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('never')
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SyncStats | null>(null)

  const projectUrl = getProjectUrl()

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const connected = await checkConnection()
      setIsConnected(connected)

      if (connected) {
        const syncStats = await getSyncStats()
        setStats(syncStats)
        setLastSyncTime(syncStats.lastSyncTime)
        setSyncStatus(syncStats.totalItems > 0 ? 'synced' : 'never')
      } else {
        setSyncStatus('error')
        setError('Could not connect to Supabase')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSyncStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sync = useCallback(async (): Promise<SyncResult> => {
    setSyncStatus('pending')
    setError(null)

    try {
      // For now, just refresh stats - actual sync from local files would need file system access
      // In a real implementation, this would read from ~/.claude/registry/*.json
      await refresh()

      return {
        success: true,
        itemsSynced: 0,
        errors: [],
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed'
      setError(errorMsg)
      setSyncStatus('error')
      return {
        success: false,
        itemsSynced: 0,
        errors: [errorMsg],
      }
    }
  }, [refresh])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    isConnected,
    projectUrl,
    syncStatus,
    lastSyncTime,
    isLoading,
    error,
    stats,
    sync,
    refresh,
  }
}

export interface UseRegistryResult {
  items: RegistryItem[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRegistry(type?: RegistryItemType): UseRegistryResult {
  const [items, setItems] = useState<RegistryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchRegistryItems(type)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items')
    } finally {
      setIsLoading(false)
    }
  }, [type])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { items, isLoading, error, refresh }
}

export interface UseActivityResult {
  activities: ActivityLogEntry[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useActivity(limit = 50): UseActivityResult {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchActivityLog(limit)
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { activities, isLoading, error, refresh }
}
