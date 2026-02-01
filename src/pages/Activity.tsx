import { useActivity } from '@/lib/hooks'

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

export function Activity() {
  const { activities, isLoading, error } = useActivity(100)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-400">Loading activity...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Activity</h1>

      {activities.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">No activity yet</div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-4">
              <div>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {activity.item_name}
                </span>
                <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {activity.action}
                </span>
                <span className="ml-2 text-xs text-zinc-400">{activity.item_type}</span>
              </div>
              <span className="text-xs text-zinc-400">{formatTime(activity.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
