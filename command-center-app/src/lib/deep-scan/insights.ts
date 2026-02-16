import type {
  ScannedItem,
  DetectedRelationship,
  DetectedHierarchy,
  DetectedCluster,
  DetectedInsight,
} from './types'

/**
 * Phase 5: Insight Generation
 * Analyzes all scan results to produce human-readable insights
 *
 * Rules:
 * 1. Orphan: items with 0 relationships → "attention", action "Koppel aan project"
 * 2. Hub: items with >5 relationships → "info"
 * 3. Gap: cluster without expected item types → "attention", action "Maak aan"
 * 4. Scale: item with >3x average children → "info"
 * 5. Isolated cluster: cluster with no external relationships → "attention"
 * 6. Single point: service used by >3 projects → "warning"
 * 7. Health: projects without code intelligence → "info"
 * 8. Pattern: interesting patterns detected → "info"
 */

export function generateInsights(
  items: ScannedItem[],
  relationships: DetectedRelationship[],
  hierarchies: DetectedHierarchy[],
  clusters: DetectedCluster[]
): DetectedInsight[] {
  const insights: DetectedInsight[] = []

  // Build relationship count per item
  const relCount = new Map<string, number>()
  for (const rel of relationships) {
    relCount.set(rel.sourceId, (relCount.get(rel.sourceId) || 0) + 1)
    relCount.set(rel.targetId, (relCount.get(rel.targetId) || 0) + 1)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Orphan detection: items with 0 relationships
  // ─────────────────────────────────────────────────────────────────────────
  const orphans = items.filter(
    (i) =>
      !relCount.has(i.name) &&
      i.type !== 'service' &&
      i.type !== 'design-system'
  )

  if (orphans.length > 0) {
    // Group orphans by type for cleaner reporting
    const orphansByType = new Map<string, ScannedItem[]>()
    for (const orphan of orphans) {
      const group = orphansByType.get(orphan.type) || []
      group.push(orphan)
      orphansByType.set(orphan.type, group)
    }

    for (const [type, typeOrphans] of orphansByType) {
      const typeLabel = typeLabels[type] || type
      insights.push({
        type: 'orphan',
        severity: 'attention',
        title: `${typeOrphans.length} losse ${typeLabel}`,
        description: `Er ${typeOrphans.length === 1 ? 'is' : 'zijn'} ${typeOrphans.length} ${typeLabel} zonder koppelingen gevonden: ${typeOrphans
          .slice(0, 5)
          .map((i) => i.name)
          .join(', ')}${typeOrphans.length > 5 ? ` en ${typeOrphans.length - 5} meer` : ''}. Deze items zijn niet gekoppeld aan een project of ander onderdeel.`,
        affectedItems: typeOrphans.map((i) => i.name),
        actionLabel: 'Koppel aan project',
        actionType: 'link',
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Hub detection: items with >5 relationships
  // ─────────────────────────────────────────────────────────────────────────
  const hubs = [...relCount.entries()]
    .filter(([, count]) => count > 5)
    .sort((a, b) => b[1] - a[1])

  for (const [name, count] of hubs) {
    const item = items.find((i) => i.name === name)
    if (!item) continue

    insights.push({
      type: 'hub',
      severity: 'info',
      title: `${item.name} is een knooppunt`,
      description: `${item.name} (${typeLabels[item.type] || item.type}) heeft ${count} koppelingen met andere onderdelen. Dit is een centraal punt in je systeem.`,
      affectedItems: [name],
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Gap detection: clusters missing expected item types
  // ─────────────────────────────────────────────────────────────────────────
  for (const cluster of clusters) {
    if (cluster.slug === 'externe-diensten' || cluster.slug === 'basis-gereedschap') continue

    const memberItems = items.filter((i) => cluster.members.includes(i.name))
    const memberTypes = new Set(memberItems.map((i) => i.type))

    // A complete cluster should ideally have commands AND agents
    if (memberItems.length >= 3) {
      if (!memberTypes.has('command') && memberTypes.has('agent')) {
        insights.push({
          type: 'gap',
          severity: 'attention',
          title: `${cluster.name} mist commands`,
          description: `De groep "${cluster.name}" heeft ${memberItems.length} onderdelen maar geen slash commands. Overweeg om commands toe te voegen voor snellere toegang.`,
          affectedItems: cluster.members,
          actionLabel: 'Maak command aan',
          actionType: 'create',
        })
      }

      if (!memberTypes.has('instruction')) {
        insights.push({
          type: 'gap',
          severity: 'info',
          title: `${cluster.name} mist instructies`,
          description: `De groep "${cluster.name}" heeft geen instructie-document. Een instructie helpt bij consistent gebruik.`,
          affectedItems: cluster.members,
          actionLabel: 'Maak instructie aan',
          actionType: 'create',
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Scale detection: items with many children
  // ─────────────────────────────────────────────────────────────────────────
  const childrenCount = new Map<string, number>()
  for (const h of hierarchies) {
    if (h.parentName) {
      childrenCount.set(h.parentName, (childrenCount.get(h.parentName) || 0) + 1)
    }
  }

  const avgChildren =
    childrenCount.size > 0
      ? [...childrenCount.values()].reduce((a, b) => a + b, 0) / childrenCount.size
      : 0

  for (const [name, count] of childrenCount) {
    if (count > avgChildren * 3 && count >= 5) {
      insights.push({
        type: 'scale',
        severity: 'info',
        title: `${name} is erg groot`,
        description: `${name} heeft ${count} sub-onderdelen, dat is ${Math.round(count / avgChildren)}x het gemiddelde. Overweeg of dit te splitsen is.`,
        affectedItems: [name],
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Isolated cluster: cluster with no external relationships
  // ─────────────────────────────────────────────────────────────────────────
  for (const cluster of clusters) {
    if (cluster.slug === 'externe-diensten' || cluster.slug === 'basis-gereedschap') continue
    if (cluster.members.length < 3) continue

    const memberSet = new Set(cluster.members)
    const externalRels = relationships.filter(
      (r) =>
        (memberSet.has(r.sourceId) && !memberSet.has(r.targetId)) ||
        (memberSet.has(r.targetId) && !memberSet.has(r.sourceId))
    )

    if (externalRels.length === 0) {
      insights.push({
        type: 'isolated_cluster',
        severity: 'attention',
        title: `${cluster.name} staat op zichzelf`,
        description: `De groep "${cluster.name}" (${cluster.members.length} onderdelen) heeft geen koppelingen met andere groepen. Dit kan wijzen op een geïsoleerd systeem.`,
        affectedItems: cluster.members,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Single point of failure: service used by many projects
  // ─────────────────────────────────────────────────────────────────────────
  const serviceDeps = new Map<string, string[]>()
  for (const rel of relationships) {
    if (rel.relationship === 'depends_on' && rel.targetType === 'service') {
      const deps = serviceDeps.get(rel.targetId) || []
      deps.push(rel.sourceId)
      serviceDeps.set(rel.targetId, deps)
    }
  }

  for (const [service, dependents] of serviceDeps) {
    if (dependents.length >= 3) {
      insights.push({
        type: 'single_point',
        severity: 'warning',
        title: `${service} is een single point of failure`,
        description: `${dependents.length} projecten zijn afhankelijk van ${service}: ${dependents.join(', ')}. Als ${service} uitvalt, worden al deze projecten getroffen.`,
        affectedItems: [service, ...dependents],
        actionLabel: 'Overweeg redundantie',
        actionType: 'review',
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Health: general system health observations
  // ─────────────────────────────────────────────────────────────────────────
  const projectCount = items.filter((i) => i.type === 'project').length
  const totalItems = items.length
  const totalRels = relationships.length

  insights.push({
    type: 'pattern',
    severity: 'info',
    title: 'Systeemoverzicht',
    description: `Je AI-ecosysteem bevat ${totalItems} onderdelen verdeeld over ${projectCount} projecten, met ${totalRels} koppelingen en ${clusters.length} groepen.`,
    affectedItems: [],
  })

  // Check for projects without any assets
  const projectsWithAssets = new Set(
    items.filter((i) => i.project && i.type !== 'project').map((i) => i.project!)
  )
  const emptyProjects = items.filter(
    (i) => i.type === 'project' && !projectsWithAssets.has(i.name)
  )

  if (emptyProjects.length > 0) {
    insights.push({
      type: 'health',
      severity: 'info',
      title: `${emptyProjects.length} projecten zonder onderdelen`,
      description: `Deze projecten hebben geen geregistreerde agents, commands of skills: ${emptyProjects
        .slice(0, 5)
        .map((p) => p.name)
        .join(', ')}. Overweeg om ze te analyseren of te verwijderen.`,
      affectedItems: emptyProjects.map((p) => p.name),
      actionLabel: 'Analyseer project',
      actionType: 'analyze',
    })
  }

  return insights
}

const typeLabels: Record<string, string> = {
  project: 'projecten',
  agent: 'agents',
  command: 'commands',
  skill: 'skills',
  plugin: 'plugins',
  api: "API's",
  instruction: 'instructies',
  prompt: 'prompts',
  'design-system': 'design systemen',
  service: 'diensten',
}
