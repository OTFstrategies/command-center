'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeAlert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  status: string
  created_at: string
}

export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?counts=true')
      const data = await res.json()
      setUnreadCount(data.new || 0)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchCounts()

    const supabase = createClient()
    let channel: RealtimeChannel

    channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const newAlert = payload.new as RealtimeAlert
          setAlerts((prev) => [newAlert, ...prev].slice(0, 10))
          setUnreadCount((prev) => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'alerts' },
        (payload) => {
          const updated = payload.new as RealtimeAlert
          setAlerts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          )
          fetchCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCounts])

  const markRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return { alerts, unreadCount, markRead, refetch: fetchCounts }
}
