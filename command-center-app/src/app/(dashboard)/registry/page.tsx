import { Key, MessageSquare, Sparkles, Bot, Terminal, FileText } from 'lucide-react'
import { getAgents, getApis, getCommands, getInstructions, getPrompts, getSkills } from '@/lib/registry'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

const typeConfig = {
  api: { icon: Key, label: 'API' },
  prompt: { icon: MessageSquare, label: 'Prompt' },
  skill: { icon: Sparkles, label: 'Skill' },
  agent: { icon: Bot, label: 'Agent' },
  command: { icon: Terminal, label: 'Command' },
  instruction: { icon: FileText, label: 'Instruction' },
}

interface Props {
  searchParams: Promise<{ type?: string; project?: string }>
}

function buildUrl(type: string | null, project: string | undefined) {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (project) params.set('project', project)
  const query = params.toString()
  return query ? `/registry?${query}` : '/registry'
}

export default async function RegistryPage({ searchParams }: Props) {
  noStore()
  const { type, project } = await searchParams

  const [apis, prompts, skills, agents, commands, instructions] = await Promise.all([
    getApis(project),
    getPrompts(project),
    getSkills(project),
    getAgents(project),
    getCommands(project),
    getInstructions(project),
  ])

  // Flatten commands categories
  const flatCommands = commands.flatMap(cat => cat.commands.map(cmd => ({
    id: cmd.id,
    name: cmd.name,
    type: 'command' as const,
    project: 'global',
  })))

  // Combine all items
  const allItems = [
    ...apis.map(i => ({ ...i, type: 'api' as const })),
    ...prompts.map(i => ({ ...i, type: 'prompt' as const })),
    ...skills.map(i => ({ ...i, type: 'skill' as const })),
    ...agents.map(i => ({ ...i, type: 'agent' as const })),
    ...flatCommands,
    ...instructions.map(i => ({ ...i, type: 'instruction' as const })),
  ]

  // Filter by type if specified
  const filteredItems = type ? allItems.filter(i => i.type === type) : allItems

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Registry
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {filteredItems.length} items {type && `(${type})`}
        </p>

        {/* Type filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href={buildUrl(null, project)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
              !type
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 glow'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            All
          </Link>
          {Object.entries(typeConfig).map(([key, config]) => (
            <Link
              key={key}
              href={buildUrl(key, project)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
                type === key
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 glow'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {config.label}s
            </Link>
          ))}
        </div>

        {/* Items list */}
        <div className="mt-8 space-y-1">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No items found</p>
          ) : (
            filteredItems.map((item) => {
              const config = typeConfig[item.type]
              const Icon = config.icon
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/50 dark:hover:bg-zinc-800/30 glow-hover"
                >
                  <Icon className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" strokeWidth={1.5} />
                  <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {item.name}
                  </span>
                  <span className="text-xs text-zinc-400">{item.project}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
