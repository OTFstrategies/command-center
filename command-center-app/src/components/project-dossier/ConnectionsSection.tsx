import {
  ArrowRight,
  ArrowLeft,
  Share2,
  Server,
} from 'lucide-react'
import type { ProjectConnection } from '@/lib/project-dossier'

const relationshipLabels: Record<string, string> = {
  belongs_to: 'Hoort bij',
  parent_of: 'Bevat',
  part_of: 'Onderdeel van',
  depends_on: 'Gebruikt',
  deployed_on: 'Draait op',
  applies: 'Gebruikt stijl van',
  invokes: 'Roept aan',
  references: 'Verwijst naar',
  shares_service: 'Deelt dienst',
  related_to: 'Gerelateerd aan',
}

const typeLabels: Record<string, string> = {
  project: 'Project',
  agent: 'Agent',
  command: 'Command',
  skill: 'Skill',
  plugin: 'Plugin',
  api: 'API',
  instruction: 'Instructie',
  prompt: 'Prompt',
  'design-system': 'Design System',
  service: 'Dienst',
  cluster: 'Groep',
}

interface ConnectionsSectionProps {
  connections: ProjectConnection[]
  sharedServices: { service: string; projects: string[] }[]
}

export function ConnectionsSection({ connections, sharedServices }: ConnectionsSectionProps) {
  if (connections.length === 0 && sharedServices.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Geen verbindingen gevonden voor dit project.
      </p>
    )
  }

  // Group connections by relationship type
  const groups = new Map<string, ProjectConnection[]>()
  for (const conn of connections) {
    const group = groups.get(conn.relationship) || []
    group.push(conn)
    groups.set(conn.relationship, group)
  }

  return (
    <div className="space-y-6">
      {/* Connections grouped by relationship */}
      {groups.size > 0 && (
        <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
          <div className="mb-3 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Verbindingen ({connections.length})
            </h3>
          </div>

          <div className="space-y-4">
            {[...groups.entries()].map(([rel, items]) => (
              <div key={rel}>
                <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {relationshipLabels[rel] || rel}
                </p>
                <ul className="space-y-1">
                  {items.slice(0, 10).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                    >
                      {item.direction === 'outgoing' ? (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      ) : (
                        <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      )}
                      <span className="truncate text-zinc-700 dark:text-zinc-300">
                        {item.name}
                      </span>
                      <span className="ml-auto shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {typeLabels[item.type] || item.type}
                      </span>
                    </li>
                  ))}
                  {items.length > 10 && (
                    <li className="px-2 text-xs text-zinc-400">
                      + {items.length - 10} meer
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Services */}
      {sharedServices.length > 0 && (
        <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
          <div className="mb-3 flex items-center gap-2">
            <Server className="h-4 w-4 text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Gedeelde diensten ({sharedServices.length})
            </h3>
          </div>

          <ul className="space-y-3">
            {sharedServices.map((svc) => (
              <li key={svc.service}>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {svc.service}
                </p>
                {svc.projects.length > 0 ? (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Gedeeld met: {svc.projects.join(', ')}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Alleen dit project
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
