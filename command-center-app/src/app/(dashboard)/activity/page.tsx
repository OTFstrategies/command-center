import { getActivityLog } from '@/lib/registry'
import { ActivityList } from '@/components/activity/ActivityList'

export default async function ActivityPage() {
  const { entries, total } = await getActivityLog({ limit: 50 })

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Activity</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Activiteiten log
          </p>
        </div>

        <ActivityList initialEntries={entries} initialTotal={total} />
      </div>
    </div>
  )
}
