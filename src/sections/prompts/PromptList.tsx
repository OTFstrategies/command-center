import { useState } from 'react'
import { useRegistry } from '@/lib/hooks'
import { PromptList } from './components/PromptList'
import type { Prompt, PromptType } from '@/../product/sections/prompts/types'
import type { RegistryItem } from '@/types/database'

// Transform RegistryItem to Prompt format
function toPrompt(item: RegistryItem): Prompt {
  const meta = item.metadata as { promptType?: PromptType; preview?: string; content?: string } | undefined
  const content = meta?.content || item.description || ''
  return {
    id: item.id,
    name: item.name,
    type: meta?.promptType || 'template',
    content: content,
    preview: meta?.preview || content.slice(0, 100),
    path: item.path,
    description: item.description || '',
    created: item.created_at,
    project: item.project,
    tags: item.tags,
  }
}

export default function PromptListPreview() {
  const { items, isLoading, error, refresh } = useRegistry('prompt')
  const [filterType, setFilterType] = useState<PromptType | 'all'>('all')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading prompts...</div>
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

  const prompts = items.map(toPrompt)

  if (prompts.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">No prompts registered yet</div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500">Prompts will appear here when synced from Claude Code</div>
      </div>
    )
  }

  return (
    <PromptList
      items={prompts}
      filterType={filterType}
      onSelect={(id) => console.log('Select prompt:', id)}
      onCopy={(id) => console.log('Copy prompt:', id)}
      onFilterChange={setFilterType}
    />
  )
}
