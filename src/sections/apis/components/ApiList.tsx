import { Copy, ChevronRight } from 'lucide-react'
import type { Api } from '@/../product/sections/apis/types'

export interface ApiListProps {
  items: Api[]
  onSelect?: (id: string) => void
  onCopy?: (id: string) => void
}

const authTypeLabels: Record<string, string> = {
  api_key: 'API Key',
  oauth: 'OAuth',
  basic: 'Basic',
  bearer: 'Bearer',
}

export function ApiList({ items, onSelect, onCopy }: ApiListProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => (
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
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {item.service}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {authTypeLabels[item.authType] || item.authType}
                </span>
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
