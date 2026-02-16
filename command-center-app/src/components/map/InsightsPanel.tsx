'use client'

import { useState } from 'react'
import { AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import type { MapInsight } from '@/types'

interface InsightsPanelProps {
  insights: MapInsight[]
  onInsightClick: (affectedItems: string[]) => void
}

export function InsightsPanel({ insights, onInsightClick }: InsightsPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  const warningCount = insights.filter((i) => i.severity === 'warning').length
  const attentionCount = insights.filter((i) => i.severity === 'attention').length

  // Sort: warnings first, then attention, then info
  const sorted = [...insights].sort((a, b) => {
    const order: Record<string, number> = { warning: 0, attention: 1, info: 2 }
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
  })

  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Inzichten
          </h3>
          {(warningCount > 0 || attentionCount > 0) && (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
              {warningCount + attentionCount}
            </span>
          )}
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="max-h-[400px] overflow-y-auto border-t border-zinc-200/50 dark:border-zinc-800/50">
          {sorted.length === 0 ? (
            <p className="p-4 text-sm text-zinc-400">Geen inzichten gevonden.</p>
          ) : (
            <ul className="divide-y divide-zinc-200/30 dark:divide-zinc-800/30">
              {sorted.map((insight) => (
                <li key={insight.id}>
                  <button
                    onClick={() => onInsightClick(insight.affectedItems)}
                    className="w-full p-3 text-left transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                  >
                    <div className="flex items-start gap-2">
                      <InsightIcon severity={insight.severity} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                          {insight.title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {insight.description.length > 120
                            ? insight.description.substring(0, 118) + '...'
                            : insight.description}
                        </p>
                        {insight.actionLabel && (
                          <span className="mt-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {insight.actionLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function InsightIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'warning':
      return <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 dark:text-zinc-300" />
    case 'attention':
      return <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
    default:
      return <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
  }
}
