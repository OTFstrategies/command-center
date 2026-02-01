import { Check, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import type { SettingsData } from '@/../product/sections/settings/types'

const statusIcons = {
  synced: Check,
  pending: Clock,
  error: AlertCircle,
  never: Clock,
}

const statusColors = {
  synced: 'text-emerald-500',
  pending: 'text-amber-500',
  error: 'text-red-500',
  never: 'text-zinc-400 dark:text-zinc-500',
}

export interface SettingsPageProps {
  data: SettingsData
  onSync?: () => void
  onToggleType?: (type: string, enabled: boolean) => void
}

function formatSyncTime(timestamp?: string): string {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function SettingsPage({ data, onSync, onToggleType }: SettingsPageProps) {
  const StatusIcon = statusIcons[data.syncStatus]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Sync Status */}
        <div className="mb-12">
          <h2 className="mb-6 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Supabase Sync
          </h2>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon className={`h-5 w-5 ${statusColors[data.syncStatus]}`} />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {data.syncStatus === 'synced' ? 'Synced' : data.syncStatus === 'pending' ? 'Syncing...' : data.syncStatus === 'error' ? 'Sync Error' : 'Not synced'}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Last sync: {formatSyncTime(data.lastSyncTime)}
                  </p>
                </div>
              </div>

              <button
                onClick={onSync}
                className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
              >
                <RefreshCw className="h-4 w-4" />
                Sync Now
              </button>
            </div>

            {data.supabase.isConnected && (
              <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
                Connected to {data.supabase.projectUrl}
              </p>
            )}
          </div>
        </div>

        {/* Sync Types */}
        <div>
          <h2 className="mb-6 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Sync Types
          </h2>

          <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {data.syncTypes.map((syncType) => (
              <div
                key={syncType.type}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={syncType.enabled}
                    onChange={(e) => onToggleType?.(syncType.type, e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {syncType.type}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {syncType.itemCount} items
                    </p>
                  </div>
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatSyncTime(syncType.lastSynced)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
