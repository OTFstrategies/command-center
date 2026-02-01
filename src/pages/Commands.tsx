import { useState, useMemo } from 'react'
import { useRegistry } from '@/lib/hooks'
import { ChevronRight, ChevronDown } from 'lucide-react'

export function Commands() {
  const { items, isLoading, error } = useRegistry('command')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Group commands by category
  const categories = useMemo(() => {
    const map = new Map<string, typeof items>()
    for (const item of items) {
      const cat = (item.metadata as { category?: string }).category || 'general'
      const existing = map.get(cat) || []
      existing.push(item)
      map.set(cat, existing)
    }
    return Array.from(map.entries())
  }, [items])

  const toggle = (cat: string) => {
    const next = new Set(expanded)
    if (next.has(cat)) next.delete(cat)
    else next.add(cat)
    setExpanded(next)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-400">Loading commands...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Commands</h1>

      {categories.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">No commands registered yet</div>
      ) : (
        <div className="space-y-6">
          {categories.map(([category, cmds]) => {
            const isExpanded = expanded.has(category) || expanded.size === 0
            return (
              <div key={category}>
                <button
                  onClick={() => toggle(category)}
                  className="flex w-full items-center gap-2 py-2 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {category}
                  </span>
                  <span className="text-xs text-zinc-300 dark:text-zinc-600">{cmds.length}</span>
                </button>

                {isExpanded && (
                  <div className="ml-6 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {cmds.map((cmd) => {
                      const meta = cmd.metadata as { hasSubcommands?: boolean; subcommandCount?: number }
                      return (
                        <div key={cmd.id} className="flex items-center gap-4 py-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-zinc-900 dark:text-zinc-50">
                                /{cmd.name}
                              </span>
                              {meta.hasSubcommands && (
                                <span className="text-xs text-zinc-400">+{meta.subcommandCount}</span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-zinc-400">{cmd.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
