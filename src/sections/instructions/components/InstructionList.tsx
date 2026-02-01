import { Copy, ChevronRight } from 'lucide-react'
import type { Instruction, InstructionScope } from '@/../product/sections/instructions/types'

export interface InstructionListProps {
  items: Instruction[]
  filterScope?: InstructionScope | 'all'
  onSelect?: (id: string) => void
  onCopy?: (id: string) => void
  onFilterChange?: (scope: InstructionScope | 'all') => void
}

export function InstructionList({
  items,
  filterScope = 'all',
  onSelect,
  onCopy,
  onFilterChange,
}: InstructionListProps) {
  const filteredItems = filterScope === 'all'
    ? items
    : items.filter(item => item.scope === filterScope)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Filter tabs */}
        <div className="mb-8 flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
          {(['all', 'workflow', 'project'] as const).map((scope) => (
            <button
              key={scope}
              onClick={() => onFilterChange?.(scope)}
              className={`pb-3 text-xs font-medium uppercase tracking-wide transition-colors ${
                filterScope === scope
                  ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              {scope}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-4 py-4"
            >
              <button
                onClick={() => onSelect?.(item.id)}
                className="flex flex-1 items-center gap-4 text-left transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {item.scope}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
              </button>
              <button
                onClick={() => onCopy?.(item.id)}
                className="rounded p-2 text-zinc-400 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                aria-label="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
