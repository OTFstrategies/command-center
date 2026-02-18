'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface UsageRanking {
  entity_id: string
  entity_type: string
  name: string
  totalInvocations: number
  lastUsed: string | null
}

interface UsageSummary {
  topUsed: UsageRanking[]
  neverUsed: { id: string; name: string; type: string }[]
  totalInvocations: number
  activeThisMonth: number
}

interface UsagePanelProps {
  summary: UsageSummary
}

const TYPE_LABELS: Record<string, string> = {
  agent: 'Agent',
  command: 'Command',
  skill: 'Skill',
  prompt: 'Prompt',
  api: 'API',
  instruction: 'Instructie',
}

export default function UsagePanel({ summary }: UsagePanelProps) {
  const [showUnused, setShowUnused] = useState(false)

  if (summary.totalInvocations === 0 && summary.neverUsed.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Gebruik</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Nog geen gebruiksdata beschikbaar. Data wordt verzameld via de usage API.
        </p>
      </div>
    )
  }

  const maxInvocations = Math.max(...summary.topUsed.map((u) => u.totalInvocations), 1)

  return (
    <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Gebruik</h3>
        </div>
        <div className="flex gap-3 text-xs text-zinc-400">
          <span>{summary.totalInvocations} totaal</span>
          <span>{summary.activeThisMonth} actief</span>
        </div>
      </div>

      {/* Top Used */}
      {summary.topUsed.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Meest gebruikt
            </span>
          </div>
          <div className="space-y-1.5">
            {summary.topUsed.slice(0, 10).map((item) => (
              <div key={`${item.entity_type}:${item.entity_id}`} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-700 dark:text-zinc-200 truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                      {TYPE_LABELS[item.entity_type] || item.entity_type}
                    </span>
                  </div>
                </div>
                <div className="w-20 flex items-center gap-1.5 shrink-0">
                  <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full"
                      style={{ width: `${(item.totalInvocations / maxInvocations) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 w-6 text-right">
                    {item.totalInvocations}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Never Used */}
      {summary.neverUsed.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnused(!showUnused)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                Ongebruikt ({summary.neverUsed.length})
              </span>
            </div>
            {showUnused ? (
              <ChevronUp className="h-3 w-3 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            )}
          </button>
          {showUnused && (
            <div className="mt-2 space-y-1">
              {summary.neverUsed.slice(0, 15).map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 truncate">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 shrink-0">
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                </div>
              ))}
              {summary.neverUsed.length > 15 && (
                <p className="text-[10px] text-zinc-400">
                  +{summary.neverUsed.length - 15} meer
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
