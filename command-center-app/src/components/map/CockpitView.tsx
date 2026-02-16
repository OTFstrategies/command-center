'use client'

import {
  Shield,
  Bot,
  LayoutDashboard,
  Building,
  FileCheck,
  Wrench,
  Palette,
  Cloud,
  Folder,
  FolderOpen,
  Puzzle,
  Zap,
  Code,
} from 'lucide-react'
import type { MapCluster, MapInsight } from '@/types'

const iconMap: Record<string, React.ReactNode> = {
  shield: <Shield className="h-5 w-5" />,
  bot: <Bot className="h-5 w-5" />,
  'layout-dashboard': <LayoutDashboard className="h-5 w-5" />,
  building: <Building className="h-5 w-5" />,
  'file-check': <FileCheck className="h-5 w-5" />,
  wrench: <Wrench className="h-5 w-5" />,
  palette: <Palette className="h-5 w-5" />,
  cloud: <Cloud className="h-5 w-5" />,
  folder: <Folder className="h-5 w-5" />,
  'folder-open': <FolderOpen className="h-5 w-5" />,
  puzzle: <Puzzle className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  code: <Code className="h-5 w-5" />,
}

interface CockpitViewProps {
  clusters: MapCluster[]
  insights: MapInsight[]
  nodeCount: number
  edgeCount: number
  onClusterClick: (slug: string) => void
}

export function CockpitView({
  clusters,
  insights,
  nodeCount,
  edgeCount,
  onClusterClick,
}: CockpitViewProps) {
  const warningInsights = insights.filter((i) => i.severity === 'warning')
  const attentionInsights = insights.filter((i) => i.severity === 'attention')

  return (
    <div className="space-y-6">
      {/* System stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatMini label="Onderdelen" value={nodeCount} />
        <StatMini label="Koppelingen" value={edgeCount} />
        <StatMini label="Groepen" value={clusters.length} />
        <StatMini
          label="Aandachtspunten"
          value={warningInsights.length + attentionInsights.length}
          alert={warningInsights.length > 0}
        />
      </div>

      {/* Cluster cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clusters.map((cluster) => (
          <button
            key={cluster.slug}
            onClick={() => onClusterClick(cluster.slug)}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/60 p-4 text-left backdrop-blur-sm transition-all hover:border-zinc-300/60 hover:shadow-lg hover:shadow-zinc-200/20 dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:hover:border-zinc-700/60 dark:hover:shadow-zinc-900/30"
          >
            {/* Glow on hover */}
            <div className="absolute inset-0 rounded-2xl bg-zinc-400/5 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-400/5" />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {iconMap[cluster.icon] || <Folder className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {cluster.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {cluster.memberCount} onderdelen
                  </p>
                </div>
                <HealthBadge health={cluster.health} />
              </div>

              {/* Description */}
              <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {cluster.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StatMini({
  label,
  value,
  alert,
}: {
  label: string
  value: number
  alert?: boolean
}) {
  return (
    <div className="rounded-xl border border-zinc-200/50 bg-white/60 p-3 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${
          alert
            ? 'text-zinc-900 dark:text-zinc-50'
            : 'text-zinc-900 dark:text-zinc-50'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function HealthBadge({ health }: { health: string }) {
  const styles: Record<string, string> = {
    healthy: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    'needs-attention': 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    unhealthy: 'bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-100',
    unknown: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500',
  }

  const labels: Record<string, string> = {
    healthy: 'Gezond',
    'needs-attention': 'Aandacht',
    unhealthy: 'Ongezond',
    unknown: 'Onbekend',
  }

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        styles[health] || styles.unknown
      }`}
    >
      {labels[health] || health}
    </span>
  )
}
