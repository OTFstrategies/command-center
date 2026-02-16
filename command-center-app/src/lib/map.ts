import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { MapData, MapNode, MapEdge, MapCluster, MapInsight } from '@/types'

/**
 * Server-side data fetching for the Intelligence Map
 */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
    },
  })
}

export async function getMapData(): Promise<MapData> {
  const supabase = getSupabase()

  const [nodesResult, edgesResult, clustersResult, insightsResult] = await Promise.all([
    getMapNodes(supabase),
    getMapEdges(supabase),
    getMapClusters(supabase),
    getMapInsights(supabase),
  ])

  return {
    nodes: nodesResult,
    edges: edgesResult,
    clusters: clustersResult,
    insights: insightsResult,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, any, any>

async function getMapNodes(supabase: Supabase): Promise<MapNode[]> {
  const nodes: MapNode[] = []

  // Get registry items as nodes
  const { data: registryItems } = await supabase
    .from('registry_items')
    .select('id, name, type, description, project, cluster_slug, node_size')

  if (registryItems) {
    for (const item of registryItems) {
      nodes.push({
        id: `registry:${item.name}`,
        type: item.type,
        name: item.name,
        cluster: item.cluster_slug || undefined,
        size: item.node_size || 1,
        description: item.description,
      })
    }
  }

  // Get projects as nodes
  const { data: projects } = await supabase
    .from('projecten')
    .select('id, slug, name, description, ecosystem')

  if (projects) {
    for (const project of projects) {
      nodes.push({
        id: `project:${project.slug}`,
        type: 'project',
        name: project.name || project.slug,
        cluster: project.ecosystem || undefined,
        size: 3,
        description: project.description,
      })
    }
  }

  // Get system clusters as nodes (meta-nodes)
  const { data: clusters } = await supabase
    .from('system_clusters')
    .select('slug, name, description, health, member_count')

  if (clusters) {
    for (const cluster of clusters) {
      // Only add clusters with enough members as visible nodes
      if (cluster.member_count >= 3) {
        nodes.push({
          id: `cluster:${cluster.slug}`,
          type: 'cluster',
          name: cluster.name,
          cluster: cluster.slug,
          size: Math.min(5, Math.ceil(cluster.member_count / 10)),
          health: cluster.health,
          description: cluster.description,
        })
      }
    }
  }

  return nodes
}

async function getMapEdges(supabase: Supabase): Promise<MapEdge[]> {
  const { data: relationships } = await supabase
    .from('entity_relationships')
    .select('source_type, source_id, target_type, target_id, relationship, strength')

  if (!relationships) return []

  return relationships.map((rel) => ({
    source: `${rel.source_type}:${rel.source_id}`,
    target: `${rel.target_type}:${rel.target_id}`,
    relationship: rel.relationship,
    strength: rel.strength || 1,
    label: relationshipLabels[rel.relationship] || rel.relationship,
  }))
}

async function getMapClusters(supabase: Supabase): Promise<MapCluster[]> {
  const { data: clusters } = await supabase
    .from('system_clusters')
    .select('id, name, slug, description, icon, member_count, health')
    .order('member_count', { ascending: false })

  if (!clusters) return []

  return clusters.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    memberCount: c.member_count,
    health: c.health,
    description: c.description || '',
    icon: c.icon || 'folder',
  }))
}

async function getMapInsights(supabase: Supabase): Promise<MapInsight[]> {
  const { data: insights } = await supabase
    .from('map_insights')
    .select('*')
    .eq('resolved', false)
    .order('severity', { ascending: true })

  if (!insights) return []

  return insights.map((ins) => ({
    id: ins.id,
    type: ins.type,
    severity: ins.severity,
    title: ins.title,
    description: ins.description,
    affectedItems: ins.affected_items || [],
    actionLabel: ins.action_label,
    actionType: ins.action_type,
    resolved: ins.resolved,
  }))
}

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
