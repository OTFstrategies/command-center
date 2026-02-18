'use client'

import { useState } from 'react'
import { GitCompare, Heart, Code, DollarSign, BarChart3, Package } from 'lucide-react'

interface ProjectComparisonData {
  name: string
  slug: string
  description: string | null
  techStack: string[]
  assetCounts: Record<string, number>
  totalAssets: number
  health: string | null
  metrics: {
    files: number
    loc: number
    symbols: number
    errors: number
    warnings: number
    dependencies: number
  } | null
  monthlyCost: number
  totalUsage: number
}

interface ComparisonViewProps {
  projects: { slug: string; name: string }[]
}

const HEALTH_LABELS: Record<string, string> = {
  healthy: 'Gezond',
  'needs-attention': 'Aandacht nodig',
  unhealthy: 'Ongezond',
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '-'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function ComparisonRow({
  label,
  icon: Icon,
  valueA,
  valueB,
  highlight,
}: {
  label: string
  icon: typeof Heart
  valueA: string | number
  valueB: string | number
  highlight?: 'higher-better' | 'lower-better' | 'none'
}) {
  const numA = typeof valueA === 'number' ? valueA : 0
  const numB = typeof valueB === 'number' ? valueB : 0

  let classA = 'text-zinc-900 dark:text-zinc-50'
  let classB = 'text-zinc-900 dark:text-zinc-50'

  if (highlight === 'higher-better' && numA !== numB) {
    classA = numA > numB ? 'text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-400'
    classB = numB > numA ? 'text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-400'
  } else if (highlight === 'lower-better' && numA !== numB) {
    classA = numA < numB ? 'text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-400'
    classB = numB < numA ? 'text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-400'
  }

  return (
    <div className="grid grid-cols-[1fr_100px_100px] gap-2 items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-zinc-400" />
        <span className="text-xs text-zinc-600 dark:text-zinc-300">{label}</span>
      </div>
      <span className={`text-xs text-right ${classA}`}>{valueA}</span>
      <span className={`text-xs text-right ${classB}`}>{valueB}</span>
    </div>
  )
}

export default function ComparisonView({ projects }: ComparisonViewProps) {
  const [slugA, setSlugA] = useState(projects[0]?.slug || '')
  const [slugB, setSlugB] = useState(projects[1]?.slug || '')
  const [comparison, setComparison] = useState<{ a: ProjectComparisonData; b: ProjectComparisonData } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchComparison = async () => {
    if (!slugA || !slugB || slugA === slugB) return
    setLoading(true)
    try {
      const res = await fetch(`/api/comparison?a=${slugA}&b=${slugB}`)
      const data = await res.json()
      if (data.a && data.b) {
        setComparison(data)
      } else {
        setComparison(null)
      }
    } catch {
      setComparison(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Project selectors */}
      <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitCompare className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Projecten vergelijken
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={slugA}
            onChange={(e) => setSlugA(e.target.value)}
            className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-50"
          >
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
          <span className="text-zinc-400 text-xs">vs</span>
          <select
            value={slugB}
            onChange={(e) => setSlugB(e.target.value)}
            className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-50"
          >
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={fetchComparison}
            disabled={loading || slugA === slugB}
            className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : 'Vergelijk'}
          </button>
        </div>
      </div>

      {/* Comparison table */}
      {comparison && (
        <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_100px_100px] gap-2 items-center pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Metriek</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 text-right truncate">
              {comparison.a.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 text-right truncate">
              {comparison.b.name}
            </span>
          </div>

          {/* Rows */}
          <ComparisonRow
            label="Gezondheid"
            icon={Heart}
            valueA={HEALTH_LABELS[comparison.a.health || ''] || '-'}
            valueB={HEALTH_LABELS[comparison.b.health || ''] || '-'}
            highlight="none"
          />
          <ComparisonRow
            label="Assets"
            icon={Package}
            valueA={comparison.a.totalAssets}
            valueB={comparison.b.totalAssets}
            highlight="higher-better"
          />
          {comparison.a.metrics && comparison.b.metrics && (
            <>
              <ComparisonRow
                label="Bestanden"
                icon={Code}
                valueA={comparison.a.metrics.files}
                valueB={comparison.b.metrics.files}
                highlight="none"
              />
              <ComparisonRow
                label="Regels code"
                icon={Code}
                valueA={comparison.a.metrics.loc.toLocaleString('nl-NL')}
                valueB={comparison.b.metrics.loc.toLocaleString('nl-NL')}
                highlight="none"
              />
              <ComparisonRow
                label="Errors"
                icon={Code}
                valueA={comparison.a.metrics.errors}
                valueB={comparison.b.metrics.errors}
                highlight="lower-better"
              />
              <ComparisonRow
                label="Dependencies"
                icon={Package}
                valueA={comparison.a.metrics.dependencies}
                valueB={comparison.b.metrics.dependencies}
                highlight="none"
              />
            </>
          )}
          <ComparisonRow
            label="Maandkosten"
            icon={DollarSign}
            valueA={formatCurrency(comparison.a.monthlyCost)}
            valueB={formatCurrency(comparison.b.monthlyCost)}
            highlight="lower-better"
          />
          <ComparisonRow
            label="Gebruik"
            icon={BarChart3}
            valueA={comparison.a.totalUsage}
            valueB={comparison.b.totalUsage}
            highlight="higher-better"
          />

          {/* Tech stack comparison */}
          <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Tech Stack</span>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-wrap gap-1">
                {comparison.a.techStack.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {comparison.b.techStack.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
