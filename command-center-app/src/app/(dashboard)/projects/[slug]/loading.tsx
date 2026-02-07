import { SkeletonList } from '@/components/ui/SkeletonCard'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProjectDetailLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-4 w-16 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-8" />
        <SkeletonList rows={6} />
      </div>
    </div>
  )
}
