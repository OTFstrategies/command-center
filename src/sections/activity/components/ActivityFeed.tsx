import {
  Key,
  MessageSquare,
  Sparkles,
  Bot,
  Terminal,
  FileText,
} from 'lucide-react'
import type { ActivityEntry, AssetType, PeriodFilter } from '@/../product/sections/activity/types'

const assetTypeIcons = {
  api: Key,
  prompt: MessageSquare,
  skill: Sparkles,
  agent: Bot,
  command: Terminal,
  instruction: FileText,
}

export interface ActivityFeedProps {
  entries: ActivityEntry[]
  hasMore: boolean
  filterType?: AssetType | 'all'
  filterPeriod?: PeriodFilter
  filterProject?: string | 'all'
  projects?: string[]
  onItemClick?: (assetId: string, assetType: AssetType) => void
  onLoadMore?: () => void
  onFilterTypeChange?: (type: AssetType | 'all') => void
  onFilterPeriodChange?: (period: PeriodFilter) => void
  onFilterProjectChange?: (project: string | 'all') => void
}

export function ActivityFeed({
  entries,
  hasMore,
  filterType = 'all',
  filterPeriod = 'all',
  filterProject = 'all',
  projects = [],
  onItemClick,
  onLoadMore,
  onFilterTypeChange,
  onFilterPeriodChange,
  onFilterProjectChange,
}: ActivityFeedProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange?.(e.target.value as AssetType | 'all')}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="all">All types</option>
            <option value="api">APIs</option>
            <option value="prompt">Prompts</option>
            <option value="skill">Skills</option>
            <option value="agent">Agents</option>
            <option value="command">Commands</option>
            <option value="instruction">Instructions</option>
          </select>

          {/* Period filter */}
          <select
            value={filterPeriod}
            onChange={(e) => onFilterPeriodChange?.(e.target.value as PeriodFilter)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>

          {/* Project filter */}
          <select
            value={filterProject}
            onChange={(e) => onFilterProjectChange?.(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="all">All projects</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>

        {/* Feed */}
        <div className="space-y-1">
          {entries.map((entry) => {
            const Icon = assetTypeIcons[entry.type]
            return (
              <button
                key={entry.id}
                onClick={() => onItemClick?.(entry.assetId, entry.type)}
                className="group flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <Icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                <span className="flex-1 truncate text-sm text-zinc-900 dark:text-zinc-50">
                  {entry.assetName}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {entry.relativeTime}
                </span>
                <span className="hidden text-xs text-zinc-300 group-hover:inline dark:text-zinc-600">
                  {entry.project}
                </span>
              </button>
            )
          })}
        </div>

        {/* Load more trigger */}
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onLoadMore}
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
