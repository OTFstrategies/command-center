import { createClient } from '@supabase/supabase-js'
import type { DeepScanResult } from './types'

/**
 * Deep Scan Storage Layer
 * Stores scan results into Supabase tables
 *
 * Tables written:
 * - entity_relationships
 * - asset_hierarchy
 * - system_clusters
 * - map_insights
 * - registry_items (update cluster_slug)
 * - projecten (update ecosystem, services, project_path, claude_md_summary)
 */

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
    },
  })
}

export async function storeDeepScanResult(result: DeepScanResult): Promise<void> {
  const supabase = getSupabaseClient()

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Clear existing scan data (fresh scan replaces all)
  // ─────────────────────────────────────────────────────────────────────────
  await Promise.all([
    supabase.from('entity_relationships').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('asset_hierarchy').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('system_clusters').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('map_insights').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ])

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Insert entity_relationships
  // ─────────────────────────────────────────────────────────────────────────
  if (result.relationships.length > 0) {
    const rows = result.relationships.map((r) => ({
      source_type: r.sourceType,
      source_id: r.sourceId,
      target_type: r.targetType,
      target_id: r.targetId,
      relationship: r.relationship,
      direction: r.direction || 'source_to_target',
      strength: r.strength || 1,
      auto_detected: true,
      metadata: r.metadata || {},
    }))

    // Insert in batches of 100
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100)
      const { error } = await supabase.from('entity_relationships').insert(batch)
      if (error) {
        console.error(`Error inserting relationships batch ${i}:`, error.message)
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Insert asset_hierarchy
  // ─────────────────────────────────────────────────────────────────────────
  if (result.hierarchies.length > 0) {
    const rows = result.hierarchies.map((h) => ({
      asset_type: h.assetType,
      asset_name: h.assetName,
      parent_name: h.parentName,
      root_name: h.rootName,
      depth: h.depth,
      path: h.path,
      sort_order: h.sortOrder,
    }))

    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100)
      const { error } = await supabase.from('asset_hierarchy').insert(batch)
      if (error) {
        console.error(`Error inserting hierarchy batch ${i}:`, error.message)
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Insert system_clusters
  // ─────────────────────────────────────────────────────────────────────────
  if (result.clusters.length > 0) {
    const rows = result.clusters.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      member_count: c.members.length,
      health: c.health,
      insights: [],
    }))

    const { error } = await supabase.from('system_clusters').insert(rows)
    if (error) {
      console.error('Error inserting clusters:', error.message)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Insert map_insights
  // ─────────────────────────────────────────────────────────────────────────
  if (result.insights.length > 0) {
    const rows = result.insights.map((ins) => ({
      type: ins.type,
      severity: ins.severity,
      title: ins.title,
      description: ins.description,
      affected_items: ins.affectedItems,
      action_label: ins.actionLabel || null,
      action_type: ins.actionType || null,
      resolved: false,
    }))

    const { error } = await supabase.from('map_insights').insert(rows)
    if (error) {
      console.error('Error inserting insights:', error.message)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Update registry_items with cluster_slug
  // ─────────────────────────────────────────────────────────────────────────
  for (const cluster of result.clusters) {
    for (const memberName of cluster.members) {
      // Find the registry item
      const item = result.items.find((i) => i.name === memberName)
      if (!item || !item.metadata?.registryId) continue

      await supabase
        .from('registry_items')
        .update({ cluster_slug: cluster.slug })
        .eq('id', item.metadata.registryId)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Update projecten with deep scan data
  // ─────────────────────────────────────────────────────────────────────────
  for (const item of result.items) {
    if (item.type !== 'project') continue

    const projectPath = item.metadata?.projectPath as string
    const claudeMdSummary = item.description || null

    // Detect ecosystem from cluster membership
    const cluster = result.clusters.find((c) => c.members.includes(item.name))
    const ecosystem = cluster?.slug || null

    // Detect services from relationships
    const serviceDeps = result.relationships
      .filter((r) => r.sourceId === item.name && r.relationship === 'depends_on')
      .map((r) => r.targetId)

    // Try to update by slug (project name)
    await supabase
      .from('projecten')
      .update({
        ecosystem,
        services: serviceDeps,
        project_path: projectPath || null,
        claude_md_summary: claudeMdSummary,
      })
      .eq('slug', item.name)
  }
}
