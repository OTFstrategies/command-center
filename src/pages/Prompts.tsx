import { useState } from 'react'
import { useRegistry } from '@/lib/hooks'

type PromptType = 'system' | 'project' | 'template'

export function Prompts() {
  const { items, isLoading, error } = useRegistry('prompt')
  const [filter, setFilter] = useState<PromptType | 'all'>('all')

  const filtered = filter === 'all'
    ? items
    : items.filter(i => (i.metadata as { promptType?: string }).promptType === filter)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-400">Loading prompts...</div>
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
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Prompts</h1>

      {/* Filter tabs */}
      <div className="mb-8 flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
        {(['all', 'system', 'project', 'template'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`pb-3 text-xs font-medium uppercase tracking-wide transition-colors ${
              filter === type
                ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">No prompts found</div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filtered.map((item) => {
            const meta = item.metadata as { promptType?: string; preview?: string }
            return (
              <div key={item.id} className="py-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {item.name}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {meta.promptType || 'template'}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 font-mono text-xs text-zinc-400">
                  {meta.preview || item.description}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
