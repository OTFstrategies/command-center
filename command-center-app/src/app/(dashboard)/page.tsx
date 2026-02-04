import { Key, MessageSquare, Sparkles, Bot, Terminal, FileText, Plus, ArrowRight } from 'lucide-react'
import { getStats, getRecentActivity, getRecentChanges } from '@/lib/registry'
import { getProjectsFromRegistry } from '@/lib/projects'
import Link from 'next/link'
import type { AssetStats } from '@/types'
import { unstable_noStore as noStore } from 'next/cache'

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

const assetTypes = [
  { key: 'api', statsKey: 'apis', label: 'APIs', icon: Key },
  { key: 'prompt', statsKey: 'prompts', label: 'Prompts', icon: MessageSquare },
  { key: 'skill', statsKey: 'skills', label: 'Skills', icon: Sparkles },
  { key: 'agent', statsKey: 'agents', label: 'Agents', icon: Bot },
  { key: 'command', statsKey: 'commands', label: 'Commands', icon: Terminal },
  { key: 'instruction', statsKey: 'instructions', label: 'Instructions', icon: FileText },
] as const

interface HomePageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  noStore()
  const { project } = await searchParams
  const [stats, recentActivity, projects, recentChanges] = await Promise.all([
    getStats(project),
    getRecentActivity(project),
    getProjectsFromRegistry(),
    getRecentChanges(5),
  ])

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          {project ? project : 'Command Center'}
        </h1>
        {project && (
          <p className="mt-1 text-sm text-zinc-500">
            Gefilterd op project
          </p>
        )}

        {/* Recent Changes Section - only show when not filtering */}
        {!project && recentChanges.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Recent Changes
            </h2>
            <div className="mt-4 space-y-2">
              {recentChanges.map((change) => (
                <Link
                  key={change.id}
                  href={`/projects/${change.project.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/50 dark:hover:bg-zinc-800/30 glow-blue-hover"
                >
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                    change.change_type === 'added' ? 'bg-emerald-500' :
                    change.change_type === 'removed' ? 'bg-red-500' :
                    change.change_type === 'updated' ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--accent-blue)]">
                      {change.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-400">{change.project}</span>
                      <span className="text-zinc-300 dark:text-zinc-600">·</span>
                      <span className="text-xs text-zinc-400">{change.relativeTime}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Projects Section - only show when not filtering */}
        {!project && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Projects
            </h2>
            <div className="mt-4 space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-zinc-500">No projects yet</p>
              ) : (
                projects.map((proj) => (
                  <Link
                    key={proj.name}
                    href={`/projects/${proj.slug}`}
                    className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/50 dark:hover:bg-zinc-800/30 glow-blue-hover"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--accent-blue)]">
                        {proj.name}
                      </p>
                      {proj.description && (
                        <p className="text-sm text-zinc-500">{proj.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400">{proj.itemCount} items</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        )}

        {/* Assets Section - Compact */}
        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Assets
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {assetTypes.map((type) => {
              const count = stats[type.statsKey as keyof AssetStats]
              const href = project
                ? `/registry?type=${type.key}&project=${project}`
                : `/registry?type=${type.key}`
              return (
                <Link
                  key={type.key}
                  href={href}
                  className="group flex items-center gap-2 text-sm text-zinc-600 transition-all duration-300 hover:text-[var(--accent-blue)] text-glow-blue"
                >
                  <span className="font-medium">{type.label}</span>
                  <span className="text-zinc-400 group-hover:text-[var(--accent-blue)]">{count}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Recent Activity
          </h2>
          <div className="mt-4 space-y-1">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-zinc-500">No activity yet</p>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl px-4 py-2 transition-colors duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30"
                >
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.assetName}</span>
                  <span className="text-xs text-zinc-400">{item.project}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
