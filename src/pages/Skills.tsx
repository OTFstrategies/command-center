import { useRegistry } from '@/lib/hooks'
import { FileCode, ChevronRight } from 'lucide-react'

export function Skills() {
  const { items, isLoading, error } = useRegistry('skill')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-400">Loading skills...</div>
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
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Skills</h1>

      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">No skills registered yet</div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => {
            const meta = item.metadata as { fileCount?: number; files?: string[] }
            const fileCount = meta.fileCount || meta.files?.length || 1
            return (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {item.name}
                  </span>
                  <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <FileCode className="h-3.5 w-3.5" />
                  <span className="text-xs">{fileCount}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
