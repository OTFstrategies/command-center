'use client'

import { Package } from 'lucide-react'
import type { CodeDependency } from '@/types'

interface DependenciesTabProps {
  dependencies: CodeDependency[]
}

const typeLabels: Record<string, string> = {
  production: 'Production',
  dev: 'Development',
  peer: 'Peer',
  optional: 'Optional',
}

export function DependenciesTab({ dependencies }: DependenciesTabProps) {
  if (dependencies.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <Package className="h-8 w-8 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
        <p>No dependency data yet.</p>
        <p className="text-sm mt-1">Run <code className="font-mono text-zinc-500">analyze_project</code> via MCP to populate.</p>
      </div>
    )
  }

  // Group by dep_type
  const groups = new Map<string, CodeDependency[]>()
  for (const dep of dependencies) {
    const existing = groups.get(dep.dep_type) || []
    existing.push(dep)
    groups.set(dep.dep_type, existing)
  }

  return (
    <div className="space-y-6">
      {['production', 'dev', 'peer', 'optional'].map((type) => {
        const deps = groups.get(type)
        if (!deps || deps.length === 0) return null

        return (
          <div key={type}>
            <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-3">
              {typeLabels[type]} ({deps.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {deps.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/30 dark:bg-zinc-800/20"
                >
                  <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate">
                    {dep.name}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0 ml-2">
                    {dep.version}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
