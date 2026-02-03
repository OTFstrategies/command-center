'use client'

import { useState } from 'react'
import { Cloud, RefreshCw, Check, AlertCircle, Clock } from 'lucide-react'
import type { SyncStatus, SyncTypeConfig } from '@/types'

// Mock data
const mockSyncTypes: SyncTypeConfig[] = [
  { type: 'apis', enabled: true, lastSynced: '2026-02-01T10:00:00Z', itemCount: 3 },
  { type: 'prompts', enabled: true, lastSynced: '2026-02-01T10:00:00Z', itemCount: 12 },
  { type: 'skills', enabled: false, itemCount: 5 },
  { type: 'agents', enabled: true, lastSynced: '2026-02-01T09:30:00Z', itemCount: 4 },
  { type: 'commands', enabled: false, itemCount: 8 },
  { type: 'instructions', enabled: true, lastSynced: '2026-02-01T10:00:00Z', itemCount: 6 },
]

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

export default function SettingsPage() {
  const [syncTypes, setSyncTypes] = useState(mockSyncTypes)
  const [isConnected] = useState(true)
  const [syncStatus] = useState<SyncStatus>('synced')
  const [isSyncing, setIsSyncing] = useState(false)

  const toggleType = (type: string) => {
    setSyncTypes(types =>
      types.map(t => t.type === type ? { ...t, enabled: !t.enabled } : t)
    )
  }

  const handleSync = async () => {
    setIsSyncing(true)
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSyncing(false)
  }

  const StatusIcon = statusIcons[syncStatus]

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
              <div className={`rounded-full p-2 ${isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                <Cloud className={`h-5 w-5 ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'}`} />
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
                <span className="text-sm capitalize">{syncStatus}</span>
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing || !isConnected}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Nu'}
              </button>
            </div>
          </div>
        </div>

        {/* Sync Types */}
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Sync per Type</h2>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {syncTypes.map((syncType) => (
              <div
                key={syncType.type}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium capitalize text-zinc-900 dark:text-zinc-50">
                    {syncType.type}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {syncType.itemCount} items
                    {syncType.lastSynced && ` · Laatste sync: ${new Date(syncType.lastSynced).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
                <button
                  onClick={() => toggleType(syncType.type)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    syncType.enabled ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      syncType.enabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
