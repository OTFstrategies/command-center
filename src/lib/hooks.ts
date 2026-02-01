import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import type { RegistryItem, RegistryItemType, ActivityLogEntry } from '@/types/database'

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
      let query = supabase
        .from('registry_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error: err } = await query

      if (err) throw err
      setItems((data as RegistryItem[]) || [])
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
      const { data, error: err } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (err) throw err
      setActivities((data as ActivityLogEntry[]) || [])
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

export interface UseSyncStats {
  totalItems: number
  byType: Record<RegistryItemType, number>
}

export function useSyncStats() {
  const [stats, setStats] = useState<UseSyncStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await supabase
          .from('registry_items')
          .select('type')

        if (data) {
          const byType: Record<RegistryItemType, number> = {
            api: 0, prompt: 0, skill: 0, agent: 0, command: 0, instruction: 0
          }
          for (const item of data) {
            if (item.type in byType) {
              byType[item.type as RegistryItemType]++
            }
          }
          setStats({ totalItems: data.length, byType })
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  return { stats, isLoading }
}
