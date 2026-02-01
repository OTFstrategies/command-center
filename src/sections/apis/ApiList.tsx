import { useRegistry } from '@/lib/hooks'
import { ApiList } from './components/ApiList'
import type { Api } from '@/../product/sections/apis/types'
import type { RegistryItem } from '@/types/database'

// Transform RegistryItem to Api format
function toApi(item: RegistryItem): Api {
  const meta = item.metadata as { service?: string; authType?: string } | undefined
  const authType = meta?.authType as Api['authType'] | undefined
  return {
    id: item.id,
    name: item.name,
    service: meta?.service || item.project || 'unknown',
    authType: authType && ['api_key', 'oauth', 'basic', 'bearer'].includes(authType)
      ? authType
      : 'api_key',
    path: item.path,
    description: item.description || '',
    created: item.created_at,
    project: item.project,
    tags: item.tags,
  }
}

export default function ApiListPreview() {
  const { items, isLoading, error, refresh } = useRegistry('api')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">Loading APIs...</div>
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

  const apis = items.map(toApi)

  if (apis.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">No APIs registered yet</div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500">APIs will appear here when synced from Claude Code</div>
      </div>
    )
  }

  return (
    <ApiList
      items={apis}
      onSelect={(id) => console.log('Select API:', id)}
      onCopy={(id) => console.log('Copy API:', id)}
    />
  )
}
