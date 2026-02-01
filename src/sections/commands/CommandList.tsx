import { useMemo } from 'react'
import { useRegistry } from '@/lib/hooks'
import { CommandList } from './components/CommandList'
import type { CommandCategory, CommandListItem } from '@/../product/sections/commands/types'
import type { RegistryItem } from '@/types/database'

// Transform RegistryItem to CommandListItem format
function toCommandListItem(item: RegistryItem): CommandListItem & { category: string } {
  const meta = item.metadata as {
    category?: string
    hasSubcommands?: boolean
    subcommandCount?: number
    subcommands?: string[]
  } | undefined

  const subcommands = meta?.subcommands || []
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    hasSubcommands: meta?.hasSubcommands || subcommands.length > 0,
    subcommandCount: meta?.subcommandCount || subcommands.length,
    category: meta?.category || 'general',
  }
}

// Group commands by category
function groupByCategory(commands: (CommandListItem & { category: string })[]): CommandCategory[] {
  const categoryMap = new Map<string, CommandListItem[]>()

  for (const cmd of commands) {
    const { category, ...listItem } = cmd
    const existing = categoryMap.get(category) || []
    existing.push(listItem)
    categoryMap.set(category, existing)
  }

  return Array.from(categoryMap.entries()).map(([name, cmds]) => ({
    name,
    commands: cmds,
    isExpanded: true,
  }))
}

export default function CommandListPreview() {
  const { items, isLoading, error, refresh } = useRegistry('command')

  const categories = useMemo(() => {
    const commands = items.map(toCommandListItem)
    return groupByCategory(commands)
  }, [items])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading commands...</div>
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

  if (categories.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">No commands registered yet</div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500">Commands will appear here when synced from Claude Code</div>
      </div>
    )
  }

  return (
    <CommandList
      categories={categories}
      onSelect={(id) => console.log('Select command:', id)}
      onCopy={(id) => console.log('Copy command:', id)}
      onToggleCategory={(name) => console.log('Toggle category:', name)}
    />
  )
}
