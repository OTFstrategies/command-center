import { Key, MessageSquare, Sparkles, Bot, Terminal, FileText } from 'lucide-react'
import { getStats, getRecentActivity } from '@/lib/registry'
import { getProjects } from '@/lib/projects'
import Link from 'next/link'
import type { AssetStats } from '@/types'

const assetTypes = [
  { key: 'apis', label: 'APIs', icon: Key },
  { key: 'prompts', label: 'Prompts', icon: MessageSquare },
  { key: 'skills', label: 'Skills', icon: Sparkles },
  { key: 'agents', label: 'Agents', icon: Bot },
  { key: 'commands', label: 'Commands', icon: Terminal },
  { key: 'instructions', label: 'Instructions', icon: FileText },
] as const

interface HomePageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { project } = await searchParams
  const [stats, recentActivity, projects] = await Promise.all([
    getStats(project),
    getRecentActivity(project),
    getProjects(),
  ])

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Command Center
        </h1>

        {/* Projects Section */}
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
                  key={proj.id}
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
                  <span className="text-xs text-zinc-400">
                    {new Date(proj.updated_at).toLocaleDateString('nl-NL')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Assets Section - Compact */}
        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Assets
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {assetTypes.map((type) => {
              const count = stats[type.key as keyof AssetStats]
              return (
                <Link
                  key={type.key}
                  href={`/registry?type=${type.key}`}
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
