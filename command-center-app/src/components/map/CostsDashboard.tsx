'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, Server, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react'

interface ServiceCostRow {
  service: string
  total: number
  projects: string[]
}

interface ProjectCostRow {
  project: string
  total: number
  services: string[]
}

interface TrendPoint {
  period: string
  total: number
}

interface CostSummary {
  totalMonthly: number
  byService: ServiceCostRow[]
  byProject: ProjectCostRow[]
  trend: TrendPoint[]
}

interface CostsDashboardProps {
  summary: CostSummary
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function TrendBar({ trend }: { trend: TrendPoint[] }) {
  if (trend.length === 0) return null
  const max = Math.max(...trend.map((t) => t.total), 1)

  return (
    <div className="flex items-end gap-1 h-16">
      {trend.map((t) => (
        <div key={t.period} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-zinc-300 dark:bg-zinc-600 rounded-t"
            style={{ height: `${(t.total / max) * 100}%`, minHeight: t.total > 0 ? 4 : 0 }}
          />
          <span className="text-[9px] text-zinc-400">{t.period.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CostsDashboard({ summary }: CostsDashboardProps) {
  const [expandedSection, setExpandedSection] = useState<'service' | 'project' | null>(null)

  if (summary.totalMonthly === 0 && summary.byService.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Kosten</h3>
        </div>
        <p className="text-xs text-zinc-400">Nog geen kostendata beschikbaar. Voeg kosten toe via de API.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4 space-y-4">
      {/* Header met totaal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Kosten</h3>
        </div>
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {formatCurrency(summary.totalMonthly)}
          <span className="text-xs text-zinc-400 ml-1">/maand</span>
        </span>
      </div>

      {/* Trend */}
      {summary.trend.length > 1 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Trend</span>
          </div>
          <TrendBar trend={summary.trend} />
        </div>
      )}

      {/* Per service */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'service' ? null : 'service')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-1">
            <Server className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Per dienst</span>
          </div>
          {expandedSection === 'service' ? (
            <ChevronUp className="h-3 w-3 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          )}
        </button>
        {expandedSection === 'service' && (
          <div className="mt-2 space-y-1">
            {summary.byService.map((s) => (
              <div key={s.service} className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-300">{s.service}</span>
                <span className="text-zinc-900 dark:text-zinc-50 font-medium">
                  {formatCurrency(s.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per project */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'project' ? null : 'project')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Per project</span>
          </div>
          {expandedSection === 'project' ? (
            <ChevronUp className="h-3 w-3 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          )}
        </button>
        {expandedSection === 'project' && (
          <div className="mt-2 space-y-1">
            {summary.byProject.map((p) => (
              <div key={p.project} className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-300">{p.project}</span>
                <span className="text-zinc-900 dark:text-zinc-50 font-medium">
                  {formatCurrency(p.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
