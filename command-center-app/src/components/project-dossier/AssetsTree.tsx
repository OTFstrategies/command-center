'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Terminal,
  Bot,
  Sparkles,
  MessageSquare,
  Key,
  FileText,
  Puzzle,
  Palette,
  Zap,
} from 'lucide-react'
import type { ProjectHierarchyItem } from '@/lib/project-dossier'

interface AssetsTreeProps {
  items: ProjectHierarchyItem[]
}

const typeIcons: Record<string, React.ElementType> = {
  command: Terminal,
  agent: Bot,
  skill: Sparkles,
  prompt: MessageSquare,
  api: Key,
  instruction: FileText,
  plugin: Puzzle,
  'design-system': Palette,
  service: Zap,
}

const typeLabels: Record<string, string> = {
  command: 'Command',
  agent: 'Agent',
  skill: 'Skill',
  prompt: 'Prompt',
  api: 'API',
  instruction: 'Instructie',
  plugin: 'Plugin',
  'design-system': 'Design System',
  service: 'Dienst',
}

interface TreeNode {
  name: string
  type: string
  depth: number
  path: string
  children: TreeNode[]
}

function buildTree(items: ProjectHierarchyItem[]): TreeNode[] {
  // Group by root, then build tree
  const nodeMap = new Map<string, TreeNode>()

  // Create nodes
  for (const item of items) {
    nodeMap.set(item.assetName, {
      name: item.assetName,
      type: item.assetType,
      depth: item.depth,
      path: item.path,
      children: [],
    })
  }

  // Build parent-child relationships
  const roots: TreeNode[] = []
  for (const item of items) {
    const node = nodeMap.get(item.assetName)!
    if (item.parentName && nodeMap.has(item.parentName)) {
      nodeMap.get(item.parentName)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function AssetsTree({ items }: AssetsTreeProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Geen boomstructuur gevonden voor dit project.
      </p>
    )
  }

  const tree = buildTree(items)

  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-4 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
      <div className="space-y-0.5">
        {tree.map((node) => (
          <TreeNodeComponent key={node.name} node={node} />
        ))}
      </div>
    </div>
  )
}

function TreeNodeComponent({ node }: { node: TreeNode }) {
  const [expanded, setExpanded] = useState(node.depth < 2)
  const hasChildren = node.children.length > 0
  const Icon = typeIcons[node.type] || FileText

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
          hasChildren
            ? 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
            : ''
        }`}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          )
        ) : (
          <span className="w-3.5" />
        )}

        {/* Type icon */}
        <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />

        {/* Name */}
        <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
          {node.name}
        </span>

        {/* Type badge */}
        <span className="ml-auto shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {typeLabels[node.type] || node.type}
        </span>

        {/* Children count */}
        {hasChildren && (
          <span className="shrink-0 text-[10px] text-zinc-400">
            {node.children.length}
          </span>
        )}
      </button>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent key={child.name} node={child} />
          ))}
        </div>
      )}
    </div>
  )
}
