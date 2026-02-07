import { Skeleton } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <Skeleton className="h-5 w-32" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
