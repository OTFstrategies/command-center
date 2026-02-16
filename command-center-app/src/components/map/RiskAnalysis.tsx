import { AlertTriangle, Shield, Zap } from 'lucide-react'
import type { MapEdge, MapNode } from '@/types'

interface RiskAnalysisProps {
  nodes: MapNode[]
  edges: MapEdge[]
}

interface RiskItem {
  name: string
  type: string
  level: 'high' | 'medium' | 'low'
  reason: string
  impactCount: number
  affectedProjects: string[]
}

function analyzeRisks(nodes: MapNode[], edges: MapEdge[]): RiskItem[] {
  const risks: RiskItem[] = []

  // Count connections per node
  const connectionCounts = new Map<string, number>()
  const dependents = new Map<string, Set<string>>()

  for (const edge of edges) {
    connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1)
    connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1)

    // Track which projects depend on each target
    if (edge.relationship === 'depends_on' || edge.relationship === 'deployed_on') {
      const deps = dependents.get(edge.target) || new Set()
      deps.add(edge.source)
      dependents.set(edge.target, deps)
    }
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Find critical dependencies (services/items used by many projects)
  for (const [nodeId, deps] of dependents) {
    if (deps.size >= 3) {
      const node = nodeMap.get(nodeId)
      const projectNames = [...deps]
        .map((id) => nodeMap.get(id)?.name || id.replace(/^project:/, ''))
      risks.push({
        name: node?.name || nodeId.replace(/^[^:]+:/, ''),
        type: node?.type || 'service',
        level: deps.size >= 5 ? 'high' : 'medium',
        reason: `Gebruikt door ${deps.size} projecten. Als dit uitvalt worden ${deps.size} projecten getroffen.`,
        impactCount: deps.size,
        affectedProjects: projectNames,
      })
    }
  }

  // Find single points of failure (nodes with many connections but no redundancy)
  for (const [nodeId, count] of connectionCounts) {
    if (count >= 8) {
      const node = nodeMap.get(nodeId)
      if (node && !risks.some((r) => r.name === node.name)) {
        risks.push({
          name: node.name,
          type: node.type,
          level: count >= 12 ? 'high' : 'medium',
          reason: `Hub met ${count} koppelingen. Veel onderdelen zijn afhankelijk van dit item.`,
          impactCount: count,
          affectedProjects: [],
        })
      }
    }
  }

  // Sort by level and impact
  const levelOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return risks.sort(
    (a, b) => (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3) || b.impactCount - a.impactCount
  )
}

export function RiskAnalysis({ nodes, edges }: RiskAnalysisProps) {
  const risks = analyzeRisks(nodes, edges)

  if (risks.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Geen risicovolle afhankelijkheden gedetecteerd.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Risicoanalyse
        </h3>
        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
          {risks.length}
        </span>
      </div>

      <ul className="space-y-3">
        {risks.map((risk, i) => (
          <li
            key={i}
            className="rounded-xl border border-zinc-200/30 px-4 py-3 dark:border-zinc-800/30"
          >
            <div className="flex items-start gap-3">
              <RiskLevelIcon level={risk.level} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {risk.name}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {risk.type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {risk.reason}
                </p>
                {risk.affectedProjects.length > 0 && (
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Getroffen: {risk.affectedProjects.slice(0, 5).join(', ')}
                    {risk.affectedProjects.length > 5 && ` + ${risk.affectedProjects.length - 5} meer`}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RiskLevelIcon({ level }: { level: string }) {
  switch (level) {
    case 'high':
      return <Zap className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-200" />
    case 'medium':
      return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
    default:
      return <Shield className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
  }
}
