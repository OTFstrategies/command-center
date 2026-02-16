import {
  Server,
  Globe,
  FolderOpen,
  Shield,
  Heart,
} from 'lucide-react'
import type { ProjectIdentity } from '@/lib/project-dossier'

interface IdentityCardProps {
  identity: ProjectIdentity
}

const healthLabels: Record<string, string> = {
  healthy: 'Gezond',
  'needs-attention': 'Aandacht nodig',
  unhealthy: 'Ongezond',
  unknown: 'Onbekend',
}

export function IdentityCard({ identity }: IdentityCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
      <div className="space-y-3">
        {/* Ecosystem */}
        {identity.clusterName && (
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">Ecosysteem</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {identity.clusterName}
              </p>
            </div>
          </div>
        )}

        {/* Health */}
        {identity.health && (
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">Status</p>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  identity.health === 'healthy'
                    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
                }`}
              >
                {healthLabels[identity.health] || identity.health}
              </span>
            </div>
          </div>
        )}

        {/* Services */}
        {identity.services.length > 0 && (
          <div className="flex items-start gap-3">
            <Server className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">Diensten</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {identity.services.map((svc) => (
                  <span
                    key={svc}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Project Path */}
        {identity.projectPath && (
          <div className="flex items-center gap-3">
            <FolderOpen className="h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">Pad</p>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {identity.projectPath}
              </p>
            </div>
          </div>
        )}

        {/* CLAUDE.md Summary */}
        {identity.claudeMdSummary && (
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">CLAUDE.md samenvatting</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {identity.claudeMdSummary}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
