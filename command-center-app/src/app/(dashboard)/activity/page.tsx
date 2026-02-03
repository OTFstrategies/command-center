'use client'

import { useState } from 'react'
import { Activity, Key, MessageSquare, Sparkles, Bot, Terminal, FileText } from 'lucide-react'
import type { ActivityEntry, AssetType, PeriodFilter } from '@/types'

// Mock data
const mockActivity: ActivityEntry[] = [
  { id: '1', type: 'prompt', assetId: 'p1', assetName: 'System Prompt v2', event: 'used', timestamp: '2026-02-01T10:30:00Z', relativeTime: '2 uur geleden', project: 'global' },
  { id: '2', type: 'api', assetId: 'a1', assetName: 'OpenAI API', event: 'used', timestamp: '2026-02-01T09:15:00Z', relativeTime: '3 uur geleden', project: 'command-center' },
  { id: '3', type: 'skill', assetId: 's1', assetName: 'Miro Integration', event: 'created', timestamp: '2026-01-31T16:00:00Z', relativeTime: 'gisteren', project: 'global' },
  { id: '4', type: 'agent', assetId: 'ag1', assetName: 'Code Reviewer', event: 'used', timestamp: '2026-01-31T14:00:00Z', relativeTime: 'gisteren', project: 'global' },
  { id: '5', type: 'command', assetId: 'c1', assetName: '/commit', event: 'used', timestamp: '2026-01-31T12:00:00Z', relativeTime: 'gisteren', project: 'command-center' },
]

const typeIcons: Record<AssetType, typeof Key> = {
  api: Key,
  prompt: MessageSquare,
  skill: Sparkles,
  agent: Bot,
  command: Terminal,
  instruction: FileText,
}

const typeFilters: { label: string; value: AssetType | 'all' }[] = [
  { label: 'Alle', value: 'all' },
  { label: 'APIs', value: 'api' },
  { label: 'Prompts', value: 'prompt' },
  { label: 'Skills', value: 'skill' },
  { label: 'Agents', value: 'agent' },
]

const periodFilters: { label: string; value: PeriodFilter }[] = [
  { label: 'Vandaag', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Maand', value: 'month' },
  { label: 'Alles', value: 'all' },
]

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')

  const filtered = typeFilter === 'all'
    ? mockActivity
    : mockActivity.filter(a => a.type === typeFilter)

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

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === f.value
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {periodFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setPeriodFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  periodFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              <p className="mt-2 text-sm text-zinc-500">Geen activiteit gevonden</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((item) => {
                const Icon = typeIcons[item.type]
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div className="rounded-lg bg-zinc-100 p-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {item.assetName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.event === 'created' ? 'Aangemaakt' : 'Gebruikt'} · {item.project}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {item.relativeTime}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
