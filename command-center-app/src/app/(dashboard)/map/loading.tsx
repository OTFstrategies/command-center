export default function MapLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Cluster cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-zinc-200/50 bg-white/50 dark:border-zinc-800/50 dark:bg-zinc-900/50"
          />
        ))}
      </div>

      {/* Graph skeleton */}
      <div className="mt-6 h-[500px] animate-pulse rounded-2xl border border-zinc-200/50 bg-white/50 dark:border-zinc-800/50 dark:bg-zinc-900/50" />
    </div>
  )
}
