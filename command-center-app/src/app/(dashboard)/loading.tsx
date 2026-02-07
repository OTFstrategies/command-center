import { SkeletonList, SkeletonStats } from '@/components/ui/SkeletonCard'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-12">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
          <SkeletonList rows={5} />
        </div>
        <div className="mt-12">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
          <SkeletonList rows={4} />
        </div>
        <div className="mt-12">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
          <SkeletonStats />
        </div>
      </div>
    </div>
  )
}
