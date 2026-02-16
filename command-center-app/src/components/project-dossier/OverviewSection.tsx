import type { ProjectIdentity, ProjectInsight } from '@/lib/project-dossier'
import { IdentityCard } from './IdentityCard'
import { AttentionPoints } from './AttentionPoints'

interface OverviewSectionProps {
  identity: ProjectIdentity | null
  insights: ProjectInsight[]
}

export function OverviewSection({ identity, insights }: OverviewSectionProps) {
  const hasIdentity = identity && (
    identity.clusterName ||
    identity.services.length > 0 ||
    identity.projectPath ||
    identity.claudeMdSummary ||
    identity.health
  )

  if (!hasIdentity && insights.length === 0) return null

  return (
    <div className="space-y-4">
      {hasIdentity && identity && (
        <IdentityCard identity={identity} />
      )}
      <AttentionPoints insights={insights} />
    </div>
  )
}
