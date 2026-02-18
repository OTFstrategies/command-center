import { Key, MessageSquare, Sparkles, Bot, Terminal, FileText, ArrowRight } from 'lucide-react'
import { getStats, getRecentActivity, getRecentChanges } from '@/lib/registry'
import { getProjectsFromRegistry } from '@/lib/projects'
import Link from 'next/link'
import type { AssetStats } from '@/types'
import { unstable_noStore as noStore } from 'next/cache'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { QuickActionBar } from '@/components/dashboard/QuickActionBar'
import { StaggerGrid, StaggerItem } from '@/components/dashboard/StaggerGrid'
import { getAlerts } from '@/lib/alerts'
import { AttentionSection } from '@/components/dashboard/AttentionSection'

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

const assetTypes = [
  { key: 'api', statsKey: 'apis', label: 'APIs', icon: Key, href: '/registry?type=api' },
  { key: 'prompt', statsKey: 'prompts', label: 'Prompts', icon: MessageSquare, href: '/registry?type=prompt' },
  { key: 'skill', statsKey: 'skills', label: 'Skills', icon: Sparkles, href: '/registry?type=skill' },
  { key: 'agent', statsKey: 'agents', label: 'Agents', icon: Bot, href: '/registry?type=agent' },
  { key: 'command', statsKey: 'commands', label: 'Commands', icon: Terminal, href: '/registry?type=command' },
  { key: 'instruction', statsKey: 'instructions', label: 'Instructions', icon: FileText, href: '/registry?type=instruction' },
] as const

interface HomePageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  noStore()
  const { project } = await searchParams
  const [stats, recentActivity, projects, recentChanges, openAlerts] = await Promise.all([
    getStats(project),
    getRecentActivity(project),
    getProjectsFromRegistry(),
    getRecentChanges(5),
    getAlerts({ status: 'new', limit: 10 }),
  ])

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            {project ? project : 'Command Center'}
          </h1>
          {project && (
            <p className="mt-1 text-sm text-zinc-500">
              Gefilterd op project
            </p>
          )}
        </div>

        {/* Attention Section - alerts */}
        {!project && <AttentionSection alerts={openAlerts} />}

        {/* Quick Action Bar */}
        {!project && (
          <div className="mb-8">
            <QuickActionBar />
          </div>
        )}

        {/* Stats Grid */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-400">
            Assets
          </h2>
          <StaggerGrid className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {assetTypes.map((type) => {
              const count = stats[type.statsKey as keyof AssetStats]
              const Icon = type.icon
              const href = project
                ? `/registry?type=${type.key}&project=${project}`
                : type.href
              return (
                <StaggerItem key={type.key}>
                  <StatCard
                    label={type.label}
                    count={count}
                    icon={<Icon />}
                    href={href}
                  />
                </StaggerItem>
              )
            })}
          </StaggerGrid>
        </section>

        {/* Two Column Layout: Recent Changes + Projects */}
        {!project && (
          <div className="mb-10 grid gap-8 lg:grid-cols-2">
            {/* Recent Changes */}
            <section>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-400">
                Recent Changes
              </h2>
              <div className="space-y-2">
                {recentChanges.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nog geen wijzigingen</p>
                ) : (
                  recentChanges.map((change) => (
                    <Link
                      key={change.id}
                      href={`/projects/${change.project.toLowerCase().replace(/\s+/g, '-')}`}
                      className="group flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/50 dark:hover:bg-zinc-800/30 glow-hover"
                    >
                      <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        change.change_type === 'added' ? 'bg-zinc-600 dark:bg-zinc-400' :
                        change.change_type === 'removed' ? 'bg-red-500' :
                        change.change_type === 'updated' ? 'bg-zinc-400 dark:bg-zinc-500' :
                        'bg-zinc-300 dark:bg-zinc-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                          {change.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-400">{change.project}</span>
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <span className="text-xs text-zinc-400">{change.relativeTime}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </Link>
                  ))
                )}
              </div>
            </section>

            {/* Projects */}
            <section>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-400">
                Projects
              </h2>
              <StaggerGrid className="space-y-2">
                {projects.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nog geen projecten</p>
                ) : (
                  projects.map((proj) => (
                    <StaggerItem key={proj.slug}>
                      <ProjectCard
                        name={proj.name}
                        slug={proj.slug}
                        description={proj.description}
                        itemCount={proj.itemCount}
                      />
                    </StaggerItem>
                  ))
                )}
              </StaggerGrid>
            </section>
          </div>
        )}

        {/* Recent Activity */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-400">
            Recent Activity
          </h2>
          <div className="space-y-1">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-zinc-500">Nog geen activiteit</p>
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
