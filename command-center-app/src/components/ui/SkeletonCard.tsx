import { Skeleton } from './Skeleton'

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="h-4 w-2/3 mb-3" />
      <Skeleton className="h-3 w-1/2 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-20" />
      ))}
    </div>
  )
}
