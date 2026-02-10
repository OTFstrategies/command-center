'use client'

import { useState } from 'react'
import { Activity, Key, MessageSquare, Sparkles, Bot, Terminal, FileText } from 'lucide-react'
import type { ActivityEntry, AssetType, PeriodFilter } from '@/types'

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
  { label: 'Commands', value: 'command' },
  { label: 'Instructions', value: 'instruction' },
]

const periodFilters: { label: string; value: PeriodFilter }[] = [
  { label: 'Vandaag', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Maand', value: 'month' },
  { label: 'Alles', value: 'all' },
]

interface ActivityListProps {
  initialEntries: ActivityEntry[]
  initialTotal: number
}

export function ActivityList({ initialEntries, initialTotal }: ActivityListProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [total, setTotal] = useState(initialTotal)
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [isLoading, setIsLoading] = useState(false)

  const fetchFiltered = async (type: AssetType | 'all', period: PeriodFilter) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (type !== 'all') params.set('type', type)
      if (period !== 'all') params.set('period', period)
      const res = await fetch(`/api/activity?${params}`)
      const data = await res.json()
      setEntries(data.entries || [])
      setTotal(data.total || 0)
    } catch {
      // Keep current state on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleTypeFilter = (value: AssetType | 'all') => {
    setTypeFilter(value)
    fetchFiltered(value, periodFilter)
  }

  const handlePeriodFilter = (value: PeriodFilter) => {
    setPeriodFilter(value)
    fetchFiltered(typeFilter, value)
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => handleTypeFilter(f.value)}
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
        <div className="flex flex-wrap gap-2">
          {periodFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => handlePeriodFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                periodFilter === f.value
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {total > 0 && (
          <span className="self-center text-xs text-zinc-400">
            {total} {total === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Activity List */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <div className="space-y-0 divide-y divide-zinc-200 dark:divide-zinc-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-2 text-sm text-zinc-500">Geen activiteit gevonden</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {entries.map((item) => {
              const Icon = typeIcons[item.type] || Activity
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="rounded-lg bg-zinc-100 p-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.assetName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.event === 'created' ? 'Aangemaakt' : item.event === 'used' ? 'Gebruikt' : item.event} · {item.project}
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
    </>
  )
}
