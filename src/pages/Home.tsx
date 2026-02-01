import { useSyncStats, useActivity } from '@/lib/hooks'
import { Key, MessageSquare, Sparkles, Bot, Terminal, FileText } from 'lucide-react'

const statItems = [
  { key: 'api', label: 'APIs', icon: Key },
  { key: 'prompt', label: 'Prompts', icon: MessageSquare },
  { key: 'skill', label: 'Skills', icon: Sparkles },
  { key: 'agent', label: 'Agents', icon: Bot },
  { key: 'command', label: 'Commands', icon: Terminal },
  { key: 'instruction', label: 'Instructions', icon: FileText },
] as const

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

export function Home() {
  const { stats, isLoading: statsLoading } = useSyncStats()
  const { activities, isLoading: activityLoading } = useActivity(10)

  if (statsLoading || activityLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Command Center
      </h1>

      {/* Stats Grid */}
      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statItems.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats?.byType[key] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Recent Activity
      </h2>
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {activities.filter(a => a.item_type !== 'bulk').slice(0, 6).map((activity) => (
          <div key={activity.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {activity.item_name}
              </span>
              <span className="ml-2 text-xs text-zinc-400">{activity.item_type}</span>
            </div>
            <span className="text-xs text-zinc-400">{formatTime(activity.created_at)}</span>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">
            No activity yet
          </div>
        )}
      </div>
    </div>
  )
}
