import {
  Key,
  MessageSquare,
  Sparkles,
  Bot,
  Terminal,
  FileText,
} from 'lucide-react'
import type { AssetStats, ActivityItem } from '@/../product/sections/home/types'

const assetTypeIcons = {
  api: Key,
  prompt: MessageSquare,
  skill: Sparkles,
  agent: Bot,
  command: Terminal,
  instruction: FileText,
}

const assetTypeLabels = {
  apis: 'APIs',
  prompts: 'Prompts',
  skills: 'Skills',
  agents: 'Agents',
  commands: 'Commands',
  instructions: 'Instructions',
}

export interface HomeDashboardProps {
  stats: AssetStats
  recentActivity: ActivityItem[]
  onStatClick?: (type: keyof AssetStats) => void
  onActivityClick?: (assetId: string, assetType: string) => void
}

export function HomeDashboard({
  stats,
  recentActivity,
  onStatClick,
  onActivityClick,
}: HomeDashboardProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Stats Row */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-8 dark:border-zinc-800">
          {(Object.keys(stats) as Array<keyof AssetStats>).map((key) => (
            <button
              key={key}
              onClick={() => onStatClick?.(key)}
              className="group flex items-baseline gap-2 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 group-hover:text-blue-600 dark:text-zinc-500 dark:group-hover:text-blue-400">
                {assetTypeLabels[key]}
              </span>
              <span className="font-mono text-2xl font-light text-zinc-900 dark:text-zinc-50">
                {stats[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="mt-12">
          <h2 className="mb-6 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Recent
          </h2>
          <div className="space-y-1">
            {recentActivity.map((item) => {
              const Icon = assetTypeIcons[item.type]
              return (
                <button
                  key={item.id}
                  onClick={() => onActivityClick?.(item.assetId, item.type)}
                  className="group flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  <span className="flex-1 truncate text-sm text-zinc-900 dark:text-zinc-50">
                    {item.assetName}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {item.relativeTime}
                  </span>
                  <span className="hidden text-xs text-zinc-300 group-hover:inline dark:text-zinc-600">
                    {item.project}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
