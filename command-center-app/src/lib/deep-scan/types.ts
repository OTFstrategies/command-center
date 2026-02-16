// =============================================================================
// DEEP SCAN TYPES
// =============================================================================

export interface ScannedItem {
  type:
    | 'project'
    | 'agent'
    | 'command'
    | 'skill'
    | 'plugin'
    | 'api'
    | 'instruction'
    | 'prompt'
    | 'design-system'
    | 'service'
  name: string
  path: string
  description?: string
  project?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface DetectedRelationship {
  sourceType: string
  sourceId: string
  targetType: string
  targetId: string
  relationship: string
  direction?: string
  strength?: number
  metadata?: Record<string, unknown>
}

export interface DetectedHierarchy {
  assetType: string
  assetName: string
  parentName: string | null
  rootName: string
  depth: number
  path: string
  sortOrder: number
}

export interface DetectedCluster {
  name: string
  slug: string
  description: string
  icon: string
  members: string[]
  health: string
}

export interface DetectedInsight {
  type: string
  severity: string
  title: string
  description: string
  affectedItems: string[]
  actionLabel?: string
  actionType?: string
}

export interface DeepScanResult {
  items: ScannedItem[]
  relationships: DetectedRelationship[]
  hierarchies: DetectedHierarchy[]
  clusters: DetectedCluster[]
  insights: DetectedInsight[]
  stats: {
    items_found: number
    relationships_detected: number
    hierarchies_built: number
    clusters_formed: number
    insights_generated: number
    duration_ms: number
  }
}

// Registry JSON file format (from ~/.claude/registry/*.json)
export interface RegistryFile {
  description?: string
  items: RegistryItem[]
}

export interface RegistryItem {
  id: string
  name: string
  path: string
  description: string
  created: string
  project: string
  tags: string[]
  // Optional fields per type
  subcommands?: string[]
  files?: string[]
  service?: string
  auth_type?: string
}

// Plugin manifest format (.claude-plugin/plugin.json)
export interface PluginManifest {
  name: string
  version: string
  description: string
  author?: { name: string }
  commands_dir?: string
  agents_dir?: string
  skills_dir?: string
}
