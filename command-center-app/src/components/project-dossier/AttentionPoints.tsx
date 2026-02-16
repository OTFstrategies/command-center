import { AlertTriangle, Info } from 'lucide-react'
import type { ProjectInsight } from '@/lib/project-dossier'

interface AttentionPointsProps {
  insights: ProjectInsight[]
}

export function AttentionPoints({ insights }: AttentionPointsProps) {
  if (insights.length === 0) return null

  const sorted = [...insights].sort((a, b) => {
    const order: Record<string, number> = { warning: 0, attention: 1, info: 2 }
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
  })

  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Aandachtspunten ({insights.length})
      </h3>

      <ul className="space-y-2">
        {sorted.slice(0, 5).map((insight) => (
          <li key={insight.id} className="flex items-start gap-2">
            <InsightIcon severity={insight.severity} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {insight.title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {insight.description.length > 100
                  ? insight.description.substring(0, 98) + '...'
                  : insight.description}
              </p>
              {insight.actionLabel && (
                <span className="mt-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {insight.actionLabel}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {insights.length > 5 && (
        <p className="mt-3 text-xs text-zinc-400">
          + {insights.length - 5} meer
        </p>
      )}
    </div>
  )
}

function InsightIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'warning':
      return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300" />
    case 'attention':
      return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
    default:
      return <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
  }
}
