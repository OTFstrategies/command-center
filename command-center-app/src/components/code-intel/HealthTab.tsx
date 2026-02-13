'use client'

import { Activity, FileCode, Code, AlertTriangle, AlertCircle, Package, Clock } from 'lucide-react'
import type { CodeMetrics } from '@/types'

interface HealthTabProps {
  metrics: CodeMetrics | null
}

export function HealthTab({ metrics }: HealthTabProps) {
  if (!metrics) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <Activity className="h-8 w-8 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
        <p>No analysis data yet.</p>
        <p className="text-sm mt-1">Run <code className="font-mono text-zinc-500">analyze_project</code> via MCP to populate.</p>
      </div>
    )
  }

  // Calculate health score
  const score = metrics.total_diagnostics_error === 0
    ? (metrics.total_diagnostics_warning < 10 ? 'healthy' : 'needs-attention')
    : 'unhealthy'

  const scoreConfig = {
    healthy: { label: 'Healthy', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300', dot: 'bg-zinc-500' },
    'needs-attention': { label: 'Needs Attention', bg: 'bg-zinc-200 dark:bg-zinc-700', text: 'text-zinc-700 dark:text-zinc-200', dot: 'bg-zinc-400' },
    unhealthy: { label: 'Unhealthy', bg: 'bg-zinc-300 dark:bg-zinc-600', text: 'text-zinc-900 dark:text-zinc-100', dot: 'bg-zinc-700 dark:bg-zinc-300' },
  }

  const config = scoreConfig[score]

  // Format analyzed_at
  const analyzedAt = metrics.analyzed_at
    ? new Date(metrics.analyzed_at).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown'

  // Language breakdown
  const languages = Object.entries(metrics.languages || {}).sort((a, b) => b[1] - a[1])
  const totalLangFiles = languages.reduce((sum, [, count]) => sum + count, 0)

  return (
    <div className="space-y-6">
      {/* Health badge */}
      <div className="flex items-center gap-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
          <span className={`h-2 w-2 rounded-full ${config.dot}`} />
          <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
          {analyzedAt}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<FileCode className="h-4 w-4" strokeWidth={1.5} />}
          label="Files"
          value={metrics.total_files}
        />
        <MetricCard
          icon={<Code className="h-4 w-4" strokeWidth={1.5} />}
          label="Lines of Code"
          value={metrics.total_loc.toLocaleString()}
        />
        <MetricCard
          icon={<Activity className="h-4 w-4" strokeWidth={1.5} />}
          label="Symbols"
          value={metrics.total_symbols}
        />
        <MetricCard
          icon={<Package className="h-4 w-4" strokeWidth={1.5} />}
          label="Dependencies"
          value={metrics.total_dependencies}
        />
      </div>

      {/* Diagnostics summary */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-3">
          Diagnostics
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {metrics.total_diagnostics_error} errors
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
            <span className="text-sm text-zinc-500">
              {metrics.total_diagnostics_warning} warnings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">
              {metrics.total_exports} exports
            </span>
          </div>
        </div>
      </div>

      {/* Language breakdown */}
      {languages.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-3">
            Languages
          </h3>
          <div className="space-y-2">
            {languages.map(([lang, count]) => {
              const percentage = totalLangFiles > 0 ? Math.round((count / totalLangFiles) * 100) : 0
              return (
                <div key={lang} className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600 dark:text-zinc-300 w-24 shrink-0">{lang}</span>
                  <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 tabular-nums w-12 text-right shrink-0">
                    {count} files
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl px-4 py-3 bg-white/30 dark:bg-zinc-800/20">
      <div className="flex items-center gap-2 text-zinc-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  )
}
