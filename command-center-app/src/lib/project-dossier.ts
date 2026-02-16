import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side data fetching for the Project Dossier enhanced sections.
 * Reads from entity_relationships, asset_hierarchy, system_clusters, map_insights.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, any, any>

function getSupabase(): Supabase {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
    },
  })
}

// =============================================================================
// TYPES
// =============================================================================

export interface ProjectRelationship {
  sourceType: string
  sourceId: string
  targetType: string
  targetId: string
  relationship: string
  strength: number
}

export interface ProjectHierarchyItem {
  assetType: string
  assetName: string
  parentName: string | null
  rootName: string
  depth: number
  path: string
  sortOrder: number
}

export interface ProjectInsight {
  id: string
  type: string
  severity: string
  title: string
  description: string
  affectedItems: string[]
  actionLabel?: string
}

export interface ProjectIdentity {
  name: string
  slug: string
  description: string | null
  ecosystem: string | null
  services: string[]
  projectPath: string | null
  claudeMdSummary: string | null
  health: string | null
  clusterName: string | null
}

export interface ProjectConnection {
  name: string
  type: string
  relationship: string
  direction: 'incoming' | 'outgoing'
}

export interface ProjectDossierData {
  identity: ProjectIdentity | null
  relationships: ProjectRelationship[]
  hierarchy: ProjectHierarchyItem[]
  insights: ProjectInsight[]
  connections: ProjectConnection[]
  sharedServices: { service: string; projects: string[] }[]
}

// =============================================================================
// QUERIES
// =============================================================================

export async function getProjectDossierData(projectName: string): Promise<ProjectDossierData> {
  const supabase = getSupabase()
  const slug = projectName.toLowerCase().replace(/\s+/g, '-')

  const [identity, relationships, hierarchy, insights] = await Promise.all([
    getProjectIdentity(supabase, projectName, slug),
    getProjectRelationships(supabase, projectName, slug),
    getProjectHierarchy(supabase, projectName),
    getProjectInsights(supabase, projectName, slug),
  ])

  // Derive connections from relationships
  const connections = deriveConnections(relationships, projectName, slug)

  // Derive shared services
  const sharedServices = await getSharedServices(supabase, projectName, slug)

  return {
    identity,
    relationships,
    hierarchy,
    insights,
    connections,
    sharedServices,
  }
}

async function getProjectIdentity(
  supabase: Supabase,
  projectName: string,
  slug: string
): Promise<ProjectIdentity | null> {
  // Get project from projecten table
  const { data } = await supabase
    .from('projecten')
    .select('name, slug, description, ecosystem, services, project_path, claude_md_summary')
    .or(`slug.eq.${slug},name.ilike.${projectName}`)
    .limit(1)
    .single()

  if (!data) return null

  // Get cluster info if ecosystem is set
  let clusterName: string | null = null
  let health: string | null = null
  if (data.ecosystem) {
    const { data: cluster } = await supabase
      .from('system_clusters')
      .select('name, health')
      .eq('slug', data.ecosystem)
      .single()
    if (cluster) {
      clusterName = cluster.name
      health = cluster.health
    }
  }

  return {
    name: data.name || projectName,
    slug: data.slug || slug,
    description: data.description,
    ecosystem: data.ecosystem,
    services: data.services || [],
    projectPath: data.project_path,
    claudeMdSummary: data.claude_md_summary,
    health,
    clusterName,
  }
}

async function getProjectRelationships(
  supabase: Supabase,
  projectName: string,
  slug: string
): Promise<ProjectRelationship[]> {
  // Find relationships where this project is source or target
  const projectId = `project:${slug}`
  const projectIdAlt = `project:${projectName}`

  const { data } = await supabase
    .from('entity_relationships')
    .select('source_type, source_id, target_type, target_id, relationship, strength')
    .or(
      `and(source_type.eq.project,source_id.in.(${slug},${projectName})),` +
      `and(target_type.eq.project,target_id.in.(${slug},${projectName})),` +
      `source_id.eq.${projectId},target_id.eq.${projectId},` +
      `source_id.eq.${projectIdAlt},target_id.eq.${projectIdAlt}`
    )

  if (!data) return []

  return data.map((r) => ({
    sourceType: r.source_type,
    sourceId: r.source_id,
    targetType: r.target_type,
    targetId: r.target_id,
    relationship: r.relationship,
    strength: r.strength || 1,
  }))
}

async function getProjectHierarchy(
  supabase: Supabase,
  projectName: string
): Promise<ProjectHierarchyItem[]> {
  // Find hierarchy items that belong to this project (by matching root or asset names)
  const { data } = await supabase
    .from('asset_hierarchy')
    .select('asset_type, asset_name, parent_name, root_name, depth, path, sort_order')
    .or(`root_name.ilike.%${projectName}%,asset_name.ilike.%${projectName}%`)
    .order('depth')
    .order('sort_order')
    .limit(100)

  if (!data) return []

  return data.map((h) => ({
    assetType: h.asset_type,
    assetName: h.asset_name,
    parentName: h.parent_name,
    rootName: h.root_name,
    depth: h.depth,
    path: h.path,
    sortOrder: h.sort_order,
  }))
}

async function getProjectInsights(
  supabase: Supabase,
  projectName: string,
  slug: string
): Promise<ProjectInsight[]> {
  // Find insights that mention this project in affected_items
  const { data } = await supabase
    .from('map_insights')
    .select('id, type, severity, title, description, affected_items, action_label')
    .eq('resolved', false)
    .order('severity')

  if (!data) return []

  // Filter to insights that affect this project
  return data
    .filter((ins) => {
      const items = ins.affected_items || []
      return items.some((item: string) =>
        item.toLowerCase().includes(projectName.toLowerCase()) ||
        item.toLowerCase().includes(slug)
      )
    })
    .map((ins) => ({
      id: ins.id,
      type: ins.type,
      severity: ins.severity,
      title: ins.title,
      description: ins.description,
      affectedItems: ins.affected_items || [],
      actionLabel: ins.action_label,
    }))
}

function deriveConnections(
  relationships: ProjectRelationship[],
  projectName: string,
  slug: string
): ProjectConnection[] {
  const connections: ProjectConnection[] = []

  for (const rel of relationships) {
    const isSource =
      (rel.sourceType === 'project' && (rel.sourceId === slug || rel.sourceId === projectName))

    if (isSource) {
      connections.push({
        name: rel.targetId,
        type: rel.targetType,
        relationship: rel.relationship,
        direction: 'outgoing',
      })
    } else {
      connections.push({
        name: rel.sourceId,
        type: rel.sourceType,
        relationship: rel.relationship,
        direction: 'incoming',
      })
    }
  }

  return connections
}

async function getSharedServices(
  supabase: Supabase,
  projectName: string,
  slug: string
): Promise<{ service: string; projects: string[] }[]> {
  // Find services this project uses
  const { data: rels } = await supabase
    .from('entity_relationships')
    .select('target_id')
    .eq('source_type', 'project')
    .in('source_id', [slug, projectName])
    .in('relationship', ['depends_on', 'deployed_on', 'shares_service'])

  if (!rels || rels.length === 0) return []

  const services = [...new Set(rels.map((r) => r.target_id))]

  // For each service, find other projects that also use it
  const result: { service: string; projects: string[] }[] = []
  for (const service of services) {
    const { data: otherRels } = await supabase
      .from('entity_relationships')
      .select('source_id')
      .eq('target_id', service)
      .eq('source_type', 'project')
      .not('source_id', 'in', `(${slug},${projectName})`)

    result.push({
      service,
      projects: otherRels?.map((r) => r.source_id) || [],
    })
  }

  return result
}
