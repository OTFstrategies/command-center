import { useRegistry } from '@/lib/hooks'
import { SkillList } from './components/SkillList'
import type { Skill } from '@/../product/sections/skills/types'
import type { RegistryItem } from '@/types/database'

// Transform RegistryItem to Skill format
function toSkill(item: RegistryItem): Skill {
  const meta = item.metadata as { fileCount?: number; files?: string[] } | undefined
  const files = meta?.files || []
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    files: files,
    fileCount: meta?.fileCount || files.length || 1,
    path: item.path,
    created: item.created_at,
    project: item.project,
    tags: item.tags,
  }
}

export default function SkillListPreview() {
  const { items, isLoading, error, refresh } = useRegistry('skill')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading skills...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-red-500">Error: {error}</div>
        <button
          onClick={refresh}
          className="text-xs text-zinc-400 hover:text-zinc-600"
        >
          Retry
        </button>
      </div>
    )
  }

  const skills = items.map(toSkill)

  if (skills.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">No skills registered yet</div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500">Skills will appear here when synced from Claude Code</div>
      </div>
    )
  }

  return (
    <SkillList
      items={skills}
      onSelect={(id) => console.log('Select skill:', id)}
      onCopy={(id) => console.log('Copy skill:', id)}
    />
  )
}
