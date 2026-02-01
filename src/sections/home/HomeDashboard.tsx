import { useMemo } from 'react'
import { useSync, useActivity } from '@/lib/hooks/use-sync'
import { HomeDashboard } from './components/HomeDashboard'
import type { AssetStats, ActivityItem } from '@/../product/sections/home/types'

// Format relative time
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

export default function HomeDashboardPreview() {
  const { stats, isLoading: statsLoading } = useSync()
  const { activities, isLoading: activityLoading } = useActivity(10)

  // Transform stats to AssetStats format
  const assetStats: AssetStats = useMemo(() => {
    if (!stats) {
      return { apis: 0, prompts: 0, skills: 0, agents: 0, commands: 0, instructions: 0 }
    }
    return {
      apis: stats.byType.api,
      prompts: stats.byType.prompt,
      skills: stats.byType.skill,
      agents: stats.byType.agent,
      commands: stats.byType.command,
      instructions: stats.byType.instruction,
    }
  }, [stats])

  // Transform activities to ActivityItem format
  const recentActivity: ActivityItem[] = useMemo(() => {
    return activities
      .filter(a => a.item_type !== 'bulk') // Skip bulk sync entries
      .slice(0, 6) // Limit to 6 items
      .map(activity => ({
        id: activity.id,
        type: activity.item_type as ActivityItem['type'],
        assetId: activity.item_id || activity.id,
        assetName: activity.item_name,
        event: activity.action === 'created' ? 'created' : 'used',
        timestamp: activity.created_at,
        relativeTime: formatRelativeTime(activity.created_at),
        project: (activity.details as { project?: string })?.project || 'global',
      }))
  }, [activities])

  const isLoading = statsLoading || activityLoading

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <HomeDashboard
      stats={assetStats}
      recentActivity={recentActivity}
      onStatClick={(type) => console.log('Navigate to:', type)}
      onActivityClick={(assetId, type) => console.log('View asset:', assetId, type)}
    />
  )
}
