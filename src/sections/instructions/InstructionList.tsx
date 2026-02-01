import { useState } from 'react'
import { useRegistry } from '@/lib/hooks'
import { InstructionList } from './components/InstructionList'
import type { Instruction, InstructionScope } from '@/../product/sections/instructions/types'
import type { RegistryItem } from '@/types/database'

// Transform RegistryItem to Instruction format
function toInstruction(item: RegistryItem): Instruction {
  const meta = item.metadata as { scope?: InstructionScope; content?: string } | undefined
  return {
    id: item.id,
    name: item.name,
    scope: meta?.scope || 'project',
    content: meta?.content || item.description || '',
    path: item.path,
    description: item.description || '',
    created: item.created_at,
    project: item.project,
    tags: item.tags,
  }
}

export default function InstructionListPreview() {
  const { items, isLoading, error, refresh } = useRegistry('instruction')
  const [filterScope, setFilterScope] = useState<InstructionScope | 'all'>('all')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading instructions...</div>
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

  const instructions = items.map(toInstruction)

  if (instructions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">No instructions registered yet</div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500">Instructions will appear here when synced from Claude Code</div>
      </div>
    )
  }

  return (
    <InstructionList
      items={instructions}
      filterScope={filterScope}
      onSelect={(id) => console.log('Select instruction:', id)}
      onCopy={(id) => console.log('Copy instruction:', id)}
      onFilterChange={setFilterScope}
    />
  )
}
