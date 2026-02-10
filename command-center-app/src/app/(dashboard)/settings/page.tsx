'use client'

import { useState, useEffect, useCallback } from 'react'
import { Cloud, RefreshCw, Check, AlertCircle, Clock, Loader2 } from 'lucide-react'
import type { SyncStatus } from '@/types'
import { InboxPanel } from '@/components/sync/InboxPanel'
import { useToast } from '@/components/ui/ToastProvider'

interface SyncTypeData {
  type: string
  count: number
  lastSynced: string | null
}

interface SyncStatusResponse {
  connected: boolean
  stats: Record<string, number>
  lastSynced: Record<string, string>
  error?: string
}

const statusIcons: Record<SyncStatus, typeof Check> = {
  synced: Check,
  pending: Clock,
  error: AlertCircle,
  never: Cloud,
}

const statusColors: Record<SyncStatus, string> = {
  synced: 'text-green-500',
  pending: 'text-amber-500',
  error: 'text-red-500',
  never: 'text-zinc-400',
}

const typeOrder = ['api', 'prompt', 'skill', 'agent', 'command', 'instruction']

export default function SettingsPage() {
  const [syncTypes, setSyncTypes] = useState<SyncTypeData[]>([])
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync')
      const data: SyncStatusResponse = await response.json()

      setIsConnected(data.connected)

      if (data.connected) {
        // Transform stats to sync types
        const types: SyncTypeData[] = typeOrder.map(type => ({
          type,
          count: data.stats[type] || 0,
          lastSynced: data.lastSynced[type] || null,
        }))

        setSyncTypes(types)

        // Determine overall sync status
        const hasData = Object.values(data.stats).some(count => count > 0)
        const hasRecentSync = Object.keys(data.lastSynced).length > 0

        if (hasRecentSync) {
          setSyncStatus('synced')
        } else if (hasData) {
          setSyncStatus('synced')
        } else {
          setSyncStatus('never')
        }

        setError(null)
      } else {
        setSyncStatus('error')
        setError(data.error || 'Connection failed')
      }
    } catch (err) {
      setIsConnected(false)
      setSyncStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleRefresh = async () => {
    setIsSyncing(true)
    await fetchStatus()
    setIsSyncing(false)
    addToast({ type: 'success', title: 'Status vernieuwd' })
  }

  const formatLastSynced = (timestamp: string | null): string => {
    if (!timestamp) return 'Nooit'

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Zojuist'
    if (diffMins < 60) return `${diffMins}m geleden`
    if (diffHours < 24) return `${diffHours}u geleden`
    if (diffDays < 7) return `${diffDays}d geleden`

    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    })
  }

  const StatusIcon = statusIcons[syncStatus]
  const totalItems = syncTypes.reduce((sum, t) => sum + t.count, 0)

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Supabase sync configuratie
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <Cloud className={`h-5 w-5 ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">Supabase</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isConnected ? 'Verbonden' : 'Niet verbonden'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 ${statusColors[syncStatus]}`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm">
                  {syncStatus === 'synced' && `${totalItems} items`}
                  {syncStatus === 'pending' && 'Laden...'}
                  {syncStatus === 'error' && 'Fout'}
                  {syncStatus === 'never' && 'Geen data'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isSyncing}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Laden...' : 'Ververs'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Inbox Panel */}
        <div className="mb-6">
          <InboxPanel />
        </div>

        {/* Sync Types */}
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Registry per Type</h2>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {syncTypes.map((syncType) => (
              <div
                key={syncType.type}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium capitalize text-zinc-900 dark:text-zinc-50">
                    {syncType.type}s
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {syncType.count} items
                    {syncType.lastSynced && ` · Laatste sync: ${formatLastSynced(syncType.lastSynced)}`}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 text-sm ${syncType.count > 0 ? 'text-green-500' : 'text-zinc-400'}`}>
                  {syncType.count > 0 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Instructions */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Sync vanaf lokale machine</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gebruik de sync CLI om je lokale registry te synchroniseren:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-sm text-zinc-100 dark:bg-zinc-950">
            <code>{`cd sync-cli
npm install
export COMMAND_CENTER_SYNC_KEY=your-key
npm run sync`}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
