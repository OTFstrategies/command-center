'use client'

import { useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import type { MapNode, MapEdge } from '@/types'

const typeLabels: Record<string, string> = {
  project: 'Project',
  agent: 'Agent',
  command: 'Command',
  skill: 'Skill',
  plugin: 'Plugin',
  api: 'API',
  instruction: 'Instructie',
  prompt: 'Prompt',
  'design-system': 'Design System',
  service: 'Dienst',
  cluster: 'Groep',
}

const relationshipLabels: Record<string, string> = {
  belongs_to: 'Hoort bij',
  parent_of: 'Bevat',
  part_of: 'Onderdeel van',
  depends_on: 'Gebruikt',
  deployed_on: 'Draait op',
  applies: 'Past toe',
  invokes: 'Roept aan',
  references: 'Verwijst naar',
  shares_service: 'Deelt dienst',
  related_to: 'Gerelateerd aan',
}

interface DetailPanelProps {
  node: MapNode
  edges: MapEdge[]
  nodes: MapNode[]
  onClose: () => void
}

export function DetailPanel({ node, edges, nodes, onClose }: DetailPanelProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Find related edges
  const relatedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  )

  // Group edges by relationship type
  const edgeGroups = new Map<string, { nodeId: string; direction: 'from' | 'to' }[]>()
  for (const edge of relatedEdges) {
    const rel = edge.relationship
    const group = edgeGroups.get(rel) || []
    if (edge.source === node.id) {
      group.push({ nodeId: edge.target, direction: 'to' })
    } else {
      group.push({ nodeId: edge.source, direction: 'from' })
    }
    edgeGroups.set(rel, group)
  }

  // Find node name by ID
  const nodeNameById = new Map(nodes.map((n) => [n.id, n.name]))

  // Check if this is a project (for link to project dossier)
  const isProject = node.type === 'project'
  const projectSlug = isProject ? node.id.replace('project:', '') : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-zinc-950/10 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-zinc-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="mb-2 inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {typeLabels[node.type] || node.type}
          </span>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {node.name}
          </h2>
          {node.cluster && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Groep: {node.cluster}
            </p>
          )}
        </div>

        {/* Description */}
        {node.description && (
          <div className="mb-6">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Beschrijving
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {node.description}
            </p>
          </div>
        )}

        {/* Health */}
        {node.health && (
          <div className="mb-6">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Status
            </h3>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                node.health === 'healthy'
                  ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
              }`}
            >
              {node.health === 'healthy' ? 'Gezond' : node.health === 'needs-attention' ? 'Aandacht nodig' : node.health}
            </span>
          </div>
        )}

        {/* Relationships */}
        {edgeGroups.size > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Koppelingen ({relatedEdges.length})
            </h3>
            <div className="space-y-4">
              {[...edgeGroups.entries()].map(([rel, items]) => (
                <div key={rel}>
                  <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {relationshipLabels[rel] || rel}
                  </p>
                  <ul className="space-y-1">
                    {items.slice(0, 10).map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="text-zinc-400">{item.direction === 'to' ? '→' : '←'}</span>
                        <span className="truncate">{nodeNameById.get(item.nodeId) || item.nodeId}</span>
                      </li>
                    ))}
                    {items.length > 10 && (
                      <li className="px-2 text-xs text-zinc-400">
                        + {items.length - 10} meer
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project dossier link */}
        {isProject && projectSlug && (
          <a
            href={`/projects/${projectSlug}`}
            className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200/50 bg-zinc-50/80 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100/80 dark:border-zinc-800/50 dark:bg-zinc-800/50 dark:text-zinc-50 dark:hover:bg-zinc-800/80"
          >
            <ExternalLink className="h-4 w-4" />
            Open project dossier
          </a>
        )}
      </motion.div>
    </>
  )
}
