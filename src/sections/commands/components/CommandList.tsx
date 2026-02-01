import { useState } from 'react'
import { Copy, ChevronRight, ChevronDown } from 'lucide-react'
import type { CommandCategory } from '@/../product/sections/commands/types'

export interface CommandListProps {
  categories: CommandCategory[]
  onSelect?: (id: string) => void
  onCopy?: (id: string) => void
  onToggleCategory?: (name: string) => void
}

export function CommandList({
  categories,
  onSelect,
  onCopy,
  onToggleCategory,
}: CommandListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.filter(c => c.isExpanded).map(c => c.name))
  )

  const toggleCategory = (name: string) => {
    const next = new Set(expandedCategories)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
    }
    setExpandedCategories(next)
    onToggleCategory?.(name)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-6">
          {categories.map((category) => {
            const isExpanded = expandedCategories.has(category.name)
            return (
              <div key={category.name}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="flex w-full items-center gap-2 py-2 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {category.name}
                  </span>
                  <span className="text-xs text-zinc-300 dark:text-zinc-600">
                    {category.commands.length}
                  </span>
                </button>

                {/* Commands */}
                {isExpanded && (
                  <div className="ml-6 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {category.commands.map((command) => (
                      <div
                        key={command.id}
                        className="group flex items-center gap-4 py-3"
                      >
                        <button
                          onClick={() => onSelect?.(command.id)}
                          className="flex flex-1 items-center gap-4 text-left transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-zinc-900 dark:text-zinc-50">
                                /{command.name}
                              </span>
                              {command.hasSubcommands && (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                  +{command.subcommandCount}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                              {command.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                        </button>
                        <button
                          onClick={() => onCopy?.(command.id)}
                          className="rounded p-2 text-zinc-400 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          aria-label="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
