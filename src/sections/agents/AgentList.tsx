import { useRegistry } from '@/lib/hooks'
import { AgentList } from './components/AgentList'
import type { Agent } from '@/../product/sections/agents/types'
import type { RegistryItem } from '@/types/database'

// Transform RegistryItem to Agent format
function toAgent(item: RegistryItem): Agent {
  const meta = item.metadata as { parent?: string; toolCount?: number; tools?: string[] } | undefined
  const tools = meta?.tools || []
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    parent: meta?.parent,
    tools: tools,
    toolCount: meta?.toolCount || tools.length || 0,
    path: item.path,
    created: item.created_at,
    project: item.project,
    tags: item.tags,
  }
}

export default function AgentListPreview() {
  const { items, isLoading, error, refresh } = useRegistry('agent')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading agents...</div>
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

  const agents = items.map(toAgent)

  if (agents.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">No agents registered yet</div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500">Agents will appear here when synced from Claude Code</div>
      </div>
    )
  }

  return (
    <AgentList
      items={agents}
      onSelect={(id) => console.log('Select agent:', id)}
      onCopy={(id) => console.log('Copy agent:', id)}
    />
  )
}
