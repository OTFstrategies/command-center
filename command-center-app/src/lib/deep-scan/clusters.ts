import type { ScannedItem, DetectedRelationship, DetectedCluster } from './types'

/**
 * Phase 4: Cluster Detection
 * Takes ScannedItem[] + DetectedRelationship[] and produces DetectedCluster[]
 *
 * Algorithm:
 * 1. Group items by name prefix (veha-*, hs-*, miro-*, security-*)
 * 2. Group items by shared plugin membership
 * 3. Group items by shared project field
 * 4. Group items by shared service (same Supabase project ID)
 * 5. Merge overlapping groups
 * 6. Name clusters based on dominant prefix or project
 * 7. Calculate member count and health
 */

interface ClusterCandidate {
  name: string
  slug: string
  description: string
  icon: string
  members: Set<string>
  source: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function detectClusters(
  items: ScannedItem[],
  relationships: DetectedRelationship[]
): DetectedCluster[] {
  const candidates: ClusterCandidate[] = []

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Group by name prefix
  // ─────────────────────────────────────────────────────────────────────────
  const prefixGroups = new Map<string, Set<string>>()

  for (const item of items) {
    if (item.type === 'service' || item.type === 'project' || item.type === 'design-system')
      continue

    const name = item.name.split('/').pop() || item.name
    const parts = name.split('-')
    if (parts.length < 2) continue

    const prefix = parts[0]
    // Only create prefix clusters for meaningful prefixes
    if (prefix.length < 2) continue

    const group = prefixGroups.get(prefix) || new Set()
    group.add(item.name)
    prefixGroups.set(prefix, group)
  }

  // Only keep prefix groups with 3+ members
  const prefixClusters: Record<string, { name: string; icon: string; description: string }> = {
    miro: {
      name: 'Miro Toolkit',
      icon: 'layout-dashboard',
      description: 'Diagram templates en Miro integratie',
    },
    hs: {
      name: 'H&S Docs',
      icon: 'file-check',
      description: 'Health & Safety document generatie',
    },
    security: {
      name: 'Security OS',
      icon: 'shield',
      description: 'Security scanning en rapportage',
    },
    veha: {
      name: 'VEHA Manager',
      icon: 'building',
      description: 'VEHA ecosystem management',
    },
    agent: {
      name: 'Agent OS',
      icon: 'bot',
      description: 'Spec-driven development agents',
    },
    vibe: {
      name: 'Vibe Tools',
      icon: 'zap',
      description: 'Synchronisatie en automatisering',
    },
  }

  for (const [prefix, members] of prefixGroups) {
    if (members.size < 3) continue
    const info = prefixClusters[prefix]
    candidates.push({
      name: info?.name || `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Groep`,
      slug: slugify(info?.name || prefix),
      description: info?.description || `Items met prefix ${prefix}-`,
      icon: info?.icon || 'folder',
      members,
      source: 'prefix',
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Group by plugin membership
  // ─────────────────────────────────────────────────────────────────────────
  const pluginGroups = new Map<string, Set<string>>()

  for (const item of items) {
    const plugin = item.metadata?.plugin as string
    if (!plugin) continue

    const group = pluginGroups.get(plugin) || new Set()
    group.add(item.name)
    pluginGroups.set(plugin, group)
  }

  // Add plugin itself to its group
  for (const item of items) {
    if (item.type === 'plugin' && item.tags?.includes('local')) {
      const group = pluginGroups.get(item.name) || new Set()
      group.add(item.name)
      pluginGroups.set(item.name, group)
    }
  }

  for (const [pluginName, members] of pluginGroups) {
    if (members.size < 2) continue
    // Check if already covered by a prefix cluster
    const existingCandidate = candidates.find((c) =>
      [...members].some((m) => c.members.has(m))
    )
    if (existingCandidate) {
      // Merge into existing cluster
      for (const m of members) {
        existingCandidate.members.add(m)
      }
    } else {
      candidates.push({
        name: pluginName.charAt(0).toUpperCase() + pluginName.slice(1),
        slug: slugify(pluginName),
        description: `Plugin: ${pluginName}`,
        icon: 'puzzle',
        members,
        source: 'plugin',
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Group by project field
  // ─────────────────────────────────────────────────────────────────────────
  const projectGroups = new Map<string, Set<string>>()

  for (const item of items) {
    if (!item.project || item.type === 'project') continue

    const group = projectGroups.get(item.project) || new Set()
    group.add(item.name)
    projectGroups.set(item.project, group)
  }

  for (const [projectName, members] of projectGroups) {
    if (members.size < 2) continue
    // Check if already covered by existing clusters
    const overlap = candidates.find((c) => {
      const overlapCount = [...members].filter((m) => c.members.has(m)).length
      return overlapCount > members.size * 0.5
    })
    if (overlap) {
      for (const m of members) {
        overlap.members.add(m)
      }
    } else {
      candidates.push({
        name: `Project: ${projectName}`,
        slug: slugify(`project-${projectName}`),
        description: `Items gekoppeld aan project ${projectName}`,
        icon: 'folder-open',
        members,
        source: 'project',
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Design System cluster
  // ─────────────────────────────────────────────────────────────────────────
  const designItems = items.filter(
    (i) => i.type === 'design-system' || i.tags?.includes('design')
  )
  const huisstijlRelated = relationships
    .filter((r) => r.relationship === 'applies' && r.targetType === 'design-system')
    .map((r) => r.sourceId)

  if (designItems.length > 0 || huisstijlRelated.length > 0) {
    const members = new Set([
      ...designItems.map((i) => i.name),
      ...huisstijlRelated,
    ])
    candidates.push({
      name: 'Design System',
      slug: 'design-system',
      description: 'Huisstijl design system en gerelateerde projecten',
      icon: 'palette',
      members,
      source: 'design',
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Services cluster
  // ─────────────────────────────────────────────────────────────────────────
  const serviceItems = items.filter((i) => i.type === 'service')
  if (serviceItems.length > 0) {
    candidates.push({
      name: 'Externe Diensten',
      slug: 'externe-diensten',
      description: 'Platform diensten en API providers',
      icon: 'cloud',
      members: new Set(serviceItems.map((i) => i.name)),
      source: 'services',
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Core Tools cluster (items not in any other cluster)
  // ─────────────────────────────────────────────────────────────────────────
  const allClusteredItems = new Set<string>()
  for (const c of candidates) {
    for (const m of c.members) {
      allClusteredItems.add(m)
    }
  }

  const unclustered = items.filter(
    (i) =>
      !allClusteredItems.has(i.name) &&
      i.type !== 'project' &&
      i.type !== 'service' &&
      i.type !== 'design-system'
  )

  if (unclustered.length > 0) {
    candidates.push({
      name: 'Basis Gereedschap',
      slug: 'basis-gereedschap',
      description: 'Losse tools en commands zonder groep',
      icon: 'wrench',
      members: new Set(unclustered.map((i) => i.name)),
      source: 'unclustered',
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Calculate health per cluster
  // ─────────────────────────────────────────────────────────────────────────
  return candidates.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    members: [...c.members],
    health: calculateClusterHealth(c, items, relationships),
  }))
}

function calculateClusterHealth(
  cluster: ClusterCandidate,
  items: ScannedItem[],
  relationships: DetectedRelationship[]
): string {
  const memberItems = items.filter((i) => cluster.members.has(i.name))
  const memberRelationships = relationships.filter(
    (r) => cluster.members.has(r.sourceId) || cluster.members.has(r.targetId)
  )

  // Health heuristics
  let score = 100

  // Penalty: many items without descriptions
  const noDesc = memberItems.filter((i) => !i.description || i.description.length < 10)
  if (noDesc.length > memberItems.length * 0.5) score -= 20

  // Penalty: very few relationships (isolated cluster)
  const externalRels = memberRelationships.filter(
    (r) => !cluster.members.has(r.sourceId) || !cluster.members.has(r.targetId)
  )
  if (externalRels.length === 0 && cluster.members.size > 2) score -= 15

  // Penalty: single member cluster
  if (cluster.members.size === 1) score -= 10

  if (score >= 80) return 'healthy'
  if (score >= 50) return 'needs-attention'
  return 'unhealthy'
}
