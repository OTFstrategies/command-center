import { useState } from 'react'
import { useRegistry } from '@/lib/hooks'
import type { RegistryItemType } from '@/types/database'
import {
  Key,
  MessageSquare,
  Sparkles,
  Bot,
  Terminal,
  FileText,
  ChevronRight,
  FileCode,
  Wrench,
} from 'lucide-react'

const tabs: { type: RegistryItemType; label: string; icon: typeof Key }[] = [
  { type: 'api', label: 'APIs', icon: Key },
  { type: 'prompt', label: 'Prompts', icon: MessageSquare },
  { type: 'skill', label: 'Skills', icon: Sparkles },
  { type: 'agent', label: 'Agents', icon: Bot },
  { type: 'command', label: 'Commands', icon: Terminal },
  { type: 'instruction', label: 'Instructions', icon: FileText },
]

const authLabels: Record<string, string> = {
  api_key: 'API Key',
  oauth: 'OAuth',
  basic: 'Basic',
  bearer: 'Bearer',
}

const promptTypeLabels: Record<string, string> = {
  system: 'System',
  project: 'Project',
  template: 'Template',
}

export function Registry() {
  const [activeTab, setActiveTab] = useState<RegistryItemType>('api')
  const { items, isLoading, error } = useRegistry(activeTab)

  const renderItem = (item: (typeof items)[0]) => {
    const meta = item.metadata as Record<string, unknown>

    switch (activeTab) {
      case 'api':
        return (
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.name}
                </span>
                <span className="text-xs text-zinc-400">
                  {(meta.service as string) || item.project}
                </span>
              </div>
            </div>
            <span className="text-xs text-zinc-400">
              {authLabels[(meta.authType as string) || ''] || (meta.authType as string)}
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
          </div>
        )

      case 'prompt':
        return (
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {item.name}
              </span>
              <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {promptTypeLabels[(meta.promptType as string) || ''] || (meta.promptType as string)}
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
          </div>
        )

      case 'skill':
        const fileCount =
          (meta.fileCount as number) || (meta.files as string[])?.length || 1
        return (
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {item.name}
              </span>
              <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <FileCode className="h-3.5 w-3.5" />
              <span className="text-xs">{fileCount}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
          </div>
        )

      case 'agent':
        const toolCount = (meta.tools as string[])?.length || 0
        return (
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {item.name}
              </span>
              <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Wrench className="h-3.5 w-3.5" />
              <span className="text-xs">{toolCount}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
          </div>
        )

      case 'command':
        const subcommandCount = (meta.subcommands as string[])?.length || 0
        return (
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <code className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  /{item.name}
                </code>
                {(meta.category as string) && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {meta.category as string}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
            </div>
            {subcommandCount > 0 && (
              <span className="text-xs text-zinc-400">+{subcommandCount} subs</span>
            )}
            <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
          </div>
        )

      case 'instruction':
        return (
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {item.name}
              </span>
              <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {(meta.scope as string) || 'global'}
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
          </div>
        )

      default:
        return null
    }
  }

  const activeTabConfig = tabs.find((t) => t.type === activeTab)

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Asset Registry
      </h1>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 overflow-x-auto rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {tabs.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === type
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-zinc-400">
            Loading {activeTabConfig?.label.toLowerCase()}...
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-red-500">Error: {error}</div>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">
          No {activeTabConfig?.label.toLowerCase()} registered yet
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => (
            <div key={item.id}>{renderItem(item)}</div>
          ))}
        </div>
      )}
    </div>
  )
}
