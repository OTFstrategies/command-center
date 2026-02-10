import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProjectColor } from '@/lib/colors'

interface ProjectCardProps {
  name: string
  slug: string
  description?: string | null
  itemCount: number
}

export function ProjectCard({ name, slug, description, itemCount }: ProjectCardProps) {
  const color = getProjectColor(name)

  return (
    <Link
      href={`/projects/${slug}`}
      className="group flex items-center gap-3 rounded-xl border-l-[3px] bg-white/50 px-4 py-3 transition-all duration-300 hover:bg-white/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 glow-hover"
      style={{ borderLeftColor: color }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
          {name}
        </p>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">{itemCount} items</span>
        <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
