import * as path from 'path'
import * as os from 'os'
import { scanInventory } from './inventory'
import { detectHierarchies } from './hierarchy'
import { detectRelationships } from './relationships'
import { detectClusters } from './clusters'
import { generateInsights } from './insights'
import type { DeepScanResult } from './types'

export type { DeepScanResult } from './types'

/**
 * Deep Scan Orchestrator
 * Runs all 5 scan phases in sequence and returns combined result
 */
export async function runDeepScan(basePath?: string): Promise<DeepScanResult> {
  const start = Date.now()

  // Resolve base path: default to ~/.claude/
  const resolvedPath = basePath
    ? basePath.replace('~', os.homedir())
    : path.join(os.homedir(), '.claude')

  // Phase 1: Inventory
  const items = scanInventory(resolvedPath)

  // Phase 2: Hierarchy Detection
  const hierarchies = detectHierarchies(items)

  // Phase 3: Relationship Detection
  const relationships = detectRelationships(items, hierarchies, resolvedPath)

  // Phase 4: Cluster Detection
  const clusters = detectClusters(items, relationships)

  // Phase 5: Insight Generation
  const insights = generateInsights(items, relationships, hierarchies, clusters)

  const duration = Date.now() - start

  return {
    items,
    relationships,
    hierarchies,
    clusters,
    insights,
    stats: {
      items_found: items.length,
      relationships_detected: relationships.length,
      hierarchies_built: hierarchies.length,
      clusters_formed: clusters.length,
      insights_generated: insights.length,
      duration_ms: duration,
    },
  }
}
