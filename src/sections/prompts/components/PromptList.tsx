import { Copy } from 'lucide-react'
import type { Prompt, PromptType } from '@/../product/sections/prompts/types'

export interface PromptListProps {
  items: Prompt[]
  filterType?: PromptType | 'all'
  onSelect?: (id: string) => void
  onCopy?: (id: string) => void
  onFilterChange?: (type: PromptType | 'all') => void
}

export function PromptList({
  items,
  filterType = 'all',
  onSelect,
  onCopy,
  onFilterChange,
}: PromptListProps) {
  const filteredItems = filterType === 'all'
    ? items
    : items.filter(item => item.type === filterType)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Filter tabs */}
        <div className="mb-8 flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
          {(['all', 'system', 'project', 'template'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onFilterChange?.(type)}
              className={`pb-3 text-xs font-medium uppercase tracking-wide transition-colors ${
                filterType === type
                  ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-4 py-4"
            >
              <button
                onClick={() => onSelect?.(item.id)}
                className="flex flex-1 flex-col gap-2 text-left transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {item.name}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {item.type}
                  </span>
                </div>
                <p className="line-clamp-2 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                  {item.preview}
                </p>
              </button>
              <button
                onClick={() => onCopy?.(item.id)}
                className="mt-1 rounded p-2 text-zinc-400 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
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
