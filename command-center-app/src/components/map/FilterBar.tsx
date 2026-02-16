'use client'

import { Search, X } from 'lucide-react'

const typeLabels: Record<string, string> = {
  project: 'Projecten',
  agent: 'Agents',
  command: 'Commands',
  skill: 'Skills',
  plugin: 'Plugins',
  api: "API's",
  instruction: 'Instructies',
  prompt: 'Prompts',
  'design-system': 'Design System',
  service: 'Diensten',
  cluster: 'Groepen',
}

interface FilterBarProps {
  filters: {
    search: string
    type: string
    cluster: string
  }
  onFiltersChange: (filters: { search: string; type: string; cluster: string }) => void
  types: string[]
  clusters: { slug: string; name: string }[]
}

export function FilterBar({ filters, onFiltersChange, types, clusters }: FilterBarProps) {
  const hasActiveFilters =
    filters.search !== '' || filters.type !== 'all' || filters.cluster !== 'all'

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Zoek op naam..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full rounded-xl border border-zinc-200/50 bg-white/60 py-2 pl-9 pr-3 text-sm backdrop-blur-sm transition-colors placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700"
        />
      </div>

      {/* Type filter */}
      <select
        value={filters.type}
        onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
        className="rounded-xl border border-zinc-200/50 bg-white/60 px-3 py-2 text-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:text-zinc-50"
      >
        <option value="all">Alle types</option>
        {types.map((type) => (
          <option key={type} value={type}>
            {typeLabels[type] || type}
          </option>
        ))}
      </select>

      {/* Cluster filter */}
      <select
        value={filters.cluster}
        onChange={(e) => onFiltersChange({ ...filters, cluster: e.target.value })}
        className="rounded-xl border border-zinc-200/50 bg-white/60 px-3 py-2 text-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:text-zinc-50"
      >
        <option value="all">Alle groepen</option>
        {clusters.map((cluster) => (
          <option key={cluster.slug} value={cluster.slug}>
            {cluster.name}
          </option>
        ))}
      </select>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={() => onFiltersChange({ search: '', type: 'all', cluster: 'all' })}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <X className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  )
}
