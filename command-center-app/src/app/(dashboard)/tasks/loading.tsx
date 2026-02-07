import { Skeleton } from '@/components/ui/Skeleton'

export default function TasksLoading() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800 min-h-[500px] p-3">
            <Skeleton className="h-5 w-20 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
