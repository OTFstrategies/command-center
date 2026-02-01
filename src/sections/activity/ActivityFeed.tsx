import { useState, useMemo } from 'react'
import { useActivity } from '@/lib/hooks/use-sync'
import { ActivityFeed } from './components/ActivityFeed'
import type { ActivityEntry, AssetType, PeriodFilter } from '@/../product/sections/activity/types'

// Convert Supabase activity log to ActivityEntry format
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function isWithinPeriod(timestamp: string, period: PeriodFilter): boolean {
  if (period === 'all') return true

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  switch (period) {
    case 'today':
      return diffDays < 1
    case 'week':
      return diffDays < 7
    case 'month':
      return diffDays < 30
    default:
      return true
  }
}

export default function ActivityFeedPreview() {
  const { activities, isLoading, error, refresh } = useActivity(100)
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all')
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('all')
  const [filterProject, setFilterProject] = useState<string | 'all'>('all')

  // Transform Supabase data to ActivityEntry format
  const entries: ActivityEntry[] = useMemo(() => {
    return activities
      .filter(activity => {
        // Filter by type
        if (filterType !== 'all' && activity.item_type !== filterType) {
          return false
        }
        // Filter by period
        if (!isWithinPeriod(activity.created_at, filterPeriod)) {
          return false
        }
        return true
      })
      .map(activity => ({
        id: activity.id,
        type: (activity.item_type === 'bulk' ? 'api' : activity.item_type) as AssetType,
        assetId: activity.item_id || activity.id,
        assetName: activity.item_name,
        event: activity.action === 'synced' ? 'used' : 'created',
        timestamp: activity.created_at,
        relativeTime: formatRelativeTime(activity.created_at),
        project: (activity.details as { project?: string })?.project || 'global',
      }))
  }, [activities, filterType, filterPeriod])

  // Extract unique projects
  const projects = useMemo(() => {
    const projectSet = new Set(entries.map(e => e.project))
    return Array.from(projectSet)
  }, [entries])

  // Filter by project
  const filteredEntries = useMemo(() => {
    if (filterProject === 'all') return entries
    return entries.filter(e => e.project === filterProject)
  }, [entries, filterProject])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading activity...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-red-500">Error: {error}</div>
        <button
          onClick={refresh}
          className="text-xs text-zinc-400 hover:text-zinc-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ActivityFeed
      entries={filteredEntries}
      hasMore={false}
      filterType={filterType}
      filterPeriod={filterPeriod}
      filterProject={filterProject}
      projects={projects}
      onItemClick={(assetId, type) => console.log('View activity:', assetId, type)}
      onLoadMore={() => console.log('Load more')}
      onFilterTypeChange={setFilterType}
      onFilterPeriodChange={setFilterPeriod}
      onFilterProjectChange={setFilterProject}
    />
  )
}
