import { BookOpen, Clock } from 'lucide-react'
import type { ProjectMemory } from '@/lib/projects'

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface Props {
  memories: ProjectMemory[]
}

export function MemoryList({ memories }: Props) {
  if (memories.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
        Memories
      </h2>
      <div className="mt-4 space-y-3">
        {memories.map((memory) => (
          <div
            key={memory.id}
            className="rounded-xl px-4 py-4 bg-white/30 dark:bg-zinc-800/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {memory.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(memory.updated_at)}
              </div>
            </div>
            <pre className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
              {memory.content}
            </pre>
          </div>
        ))}
      </div>
    </section>
  )
}
