import { useRegistry } from '@/lib/hooks'
import { ChevronRight } from 'lucide-react'

const authLabels: Record<string, string> = {
  api_key: 'API Key',
  oauth: 'OAuth',
  basic: 'Basic',
  bearer: 'Bearer',
}

export function APIs() {
  const { items, isLoading, error } = useRegistry('api')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-400">Loading APIs...</div>
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
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">APIs</h1>

      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">No APIs registered yet</div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => {
            const meta = item.metadata as { service?: string; authType?: string }
            return (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </span>
                    <span className="text-xs text-zinc-400">{meta.service || item.project}</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-400">
                  {authLabels[meta.authType || ''] || meta.authType}
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
