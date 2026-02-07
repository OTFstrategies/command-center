import { SkeletonList } from '@/components/ui/SkeletonCard'

export default function RegistryLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 mb-6" />
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
        <SkeletonList rows={10} />
      </div>
    </div>
  )
}
