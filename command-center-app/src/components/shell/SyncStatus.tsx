'use client'

import { useState, useEffect } from 'react'

export function SyncStatus() {
  const [status, setStatus] = useState<{
    last_run_at: string | null
    status: string
  } | null>(null)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/jobs?view=status')
        const data = await res.json()
        const syncStatus = data.statuses?.find((s: { id: string }) => s.id === 'registry_sync')
        if (syncStatus) setStatus(syncStatus)
      } catch {
        // silently fail
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!status) return null

  const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'zojuist'
    if (minutes < 60) return `${minutes}m geleden`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}u geleden`
    const days = Math.floor(hours / 24)
    return `${days}d geleden`
  }

  const dotClass =
    status.status === 'running'
      ? 'bg-amber-400 animate-pulse'
      : status.status === 'success'
        ? 'bg-emerald-400'
        : status.status === 'failed'
          ? 'bg-red-400'
          : 'bg-zinc-400'

  const label = status.last_run_at
    ? getTimeAgo(status.last_run_at)
    : 'Nog niet gedraaid'

  return (
    <div className="flex items-center gap-1.5 px-2 py-1" title={`Sync status: ${status.status}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  )
}
