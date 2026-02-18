// =============================================================================
// BASE TYPES
// =============================================================================

export interface Asset {
  id: string;
  name: string;
  path: string;
  description: string;
  created: string;
  project: string;
  tags: string[];
}

// =============================================================================
// HOME / DASHBOARD
// =============================================================================

export interface AssetStats {
  apis: number;
  prompts: number;
  skills: number;
  agents: number;
  commands: number;
  instructions: number;
}

export interface ActivityItem {
  id: string;
  type: 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction';
  assetId: string;
  assetName: string;
  event: 'created' | 'used';
  timestamp: string;
  relativeTime: string;
  project: string;
}

export interface HomeData {
  stats: AssetStats;
  recentActivity: ActivityItem[];
}

// =============================================================================
// APIs
// =============================================================================

export interface Api extends Asset {
  service: string;
  authType: 'api_key' | 'oauth' | 'basic' | 'bearer';
  endpoints?: string[];
  baseUrl?: string;
}

export interface ApiListItem {
  id: string;
  name: string;
  service: string;
  authType: string;
  project: string;
}

export interface ApiDetail extends Api {
  credentials: {
    key: string; // Always masked: "sk-...xxxx"
  };
}

// =============================================================================
// PROMPTS
// =============================================================================

export type PromptType = 'system' | 'project' | 'template';

export interface Prompt extends Asset {
  type: PromptType;
  content: string;
  variables?: string[];
  preview: string;
}

export interface PromptListItem {
  id: string;
  name: string;
  type: PromptType;
  preview: string;
  project: string;
}

// =============================================================================
// SKILLS
// =============================================================================

export interface Skill extends Asset {
  files: string[];
  fileCount: number;
  dependencies?: string[];
  skillMdPreview?: string;
}

export interface SkillListItem {
  id: string;
  name: string;
  fileCount: number;
  project: string;
}

// =============================================================================
// AGENTS
// =============================================================================

export interface Agent extends Asset {
  tools: string[];
  toolCount: number;
  parent?: string;
  config?: Record<string, unknown>;
}

export interface AgentListItem {
  id: string;
  name: string;
  toolCount: number;
  parent?: string;
  project: string;
}

// =============================================================================
// COMMANDS
// =============================================================================

export interface Command extends Asset {
  category: string;
  subcommands?: string[];
  hasSubcommands: boolean;
}

export interface CommandCategory {
  name: string;
  commands: CommandListItem[];
  isExpanded: boolean;
}

export interface CommandListItem {
  id: string;
  name: string;
  description: string;
  hasSubcommands: boolean;
  subcommandCount?: number;
}

// =============================================================================
// INSTRUCTIONS
// =============================================================================

export type InstructionScope = 'workflow' | 'project';

export interface Instruction extends Asset {
  scope: InstructionScope;
  content: string;
}

export interface InstructionListItem {
  id: string;
  name: string;
  scope: InstructionScope;
  project: string;
}

// =============================================================================
// ACTIVITY
// =============================================================================

export type AssetType = 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction';
export type EventType = 'created' | 'used';
export type PeriodFilter = 'today' | 'week' | 'month' | 'all';

export interface ActivityEntry {
  id: string;
  type: AssetType;
  assetId: string;
  assetName: string;
  event: EventType;
  timestamp: string;
  relativeTime: string;
  project: string;
}

export interface ActivityFilters {
  type: AssetType | 'all';
  period: PeriodFilter;
  project: string | 'all';
}

export interface ActivityData {
  entries: ActivityEntry[];
  hasMore: boolean;
  filters: ActivityFilters;
}

// =============================================================================
// LOG CATEGORIES
// =============================================================================

export type LogCategory = 'CODE' | 'SCOPE' | 'INTERPRETATION' | 'FIX' | 'TEST' | 'DEPLOY' | 'CONFIG'

// =============================================================================
// SETTINGS
// =============================================================================

export type SyncStatus = 'synced' | 'pending' | 'error' | 'never';

export interface SyncTypeConfig {
  type: string;
  enabled: boolean;
  lastSynced?: string;
  itemCount: number;
}

export interface SupabaseConfig {
  projectUrl: string;
  isConnected: boolean;
}

export interface SettingsData {
  supabase: SupabaseConfig;
  syncStatus: SyncStatus;
  lastSyncTime?: string;
  syncTypes: SyncTypeConfig[];
}

// =============================================================================
// NOTES
// =============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  position: Position;
  size: Size;
  project: string;
  connections: string[];
  created: string;
  updated: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface NotesCanvas {
  project: string;
  notes: Note[];
  viewport: CanvasViewport;
}

export interface NotesData {
  canvases: NotesCanvas[];
  currentProject: string;
}

// =============================================================================
// PROJECT CHANGELOG
// =============================================================================

export type ChangelogEntryType = 'added' | 'updated' | 'removed' | 'sync';

export interface ProjectChangelogEntry {
  id: string;
  project: string;
  project_id?: string;
  title: string;
  description: string;
  change_type: ChangelogEntryType;
  items_affected: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RecentChange {
  id: string;
  project: string;
  title: string;
  change_type: ChangelogEntryType;
  items_affected: string[];
  created_at: string;
  relativeTime: string;
}

// =============================================================================
// INBOX SYNC
// =============================================================================

// =============================================================================
// CODE INTELLIGENCE
// =============================================================================

export interface CodeSymbol {
  id: string
  project: string
  file_path: string
  name: string
  kind: string
  signature: string | null
  return_type: string | null
  line_start: number
  line_end: number
  parent: string | null
  exported: boolean
  is_async: boolean
  parameters: { name: string; type: string; optional: boolean }[] | null
  analyzed_at: string
}

export interface CodeDiagnostic {
  id: string
  project: string
  file_path: string
  line: number
  col: number | null
  severity: 'error' | 'warning' | 'suggestion'
  code: number | null
  message: string
  source: string | null
  analyzed_at: string
}

export interface CodeDependency {
  id: string
  project: string
  name: string
  version: string
  dep_type: 'production' | 'dev' | 'peer' | 'optional'
  analyzed_at: string
}

export interface CodeMetrics {
  id: string
  project: string
  total_files: number
  total_loc: number
  languages: Record<string, number>
  total_symbols: number
  total_exports: number
  total_diagnostics_error: number
  total_diagnostics_warning: number
  total_dependencies: number
  analyzed_at: string
}

export interface CodeHealthScore {
  score: 'healthy' | 'needs-attention' | 'unhealthy'
  loc: number
  files: number
  symbols: number
  errors: number
  warnings: number
  dependencies: number
  last_analyzed: string
  issues: string[]
}

// =============================================================================
// INBOX SYNC
// =============================================================================

export type InboxStatus = 'pending' | 'processing' | 'synced' | 'error'

export interface InboxManifest {
  project: string
  slug: string
  scannedAt: string
  counts: Record<string, number>
  totalItems: number
}

export interface InboxPending {
  id: string
  project: string
  slug: string
  manifest: InboxManifest
  project_meta: {
    name: string
    path?: string
    description?: string
    techStack?: string[]
  }
  registry_data: Record<string, unknown[]>
  status: InboxStatus
  created_at: string
  synced_at: string | null
}

// =============================================================================
// INTELLIGENCE MAP
// =============================================================================

export interface MapNode {
  id: string
  type: string
  name: string
  cluster?: string
  size: number
  health?: string
  description?: string
  x?: number
  y?: number
}

export interface MapEdge {
  source: string
  target: string
  relationship: string
  strength: number
  label?: string
}

export interface MapCluster {
  id: string
  name: string
  slug: string
  memberCount: number
  health: string
  description: string
  icon: string
}

export interface MapInsight {
  id: string
  type: string
  severity: string
  title: string
  description: string
  affectedItems: string[]
  actionLabel?: string
  actionType?: string
  resolved: boolean
}

export interface MapData {
  nodes: MapNode[]
  edges: MapEdge[]
  clusters: MapCluster[]
  insights: MapInsight[]
}

// =============================================================================
// OBSERVER + ACTOR
// =============================================================================

export interface Alert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string | null
  entity_type: string | null
  entity_id: string | null
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed'
  metadata: Record<string, unknown>
  created_at: string
  resolved_at: string | null
}

export interface AlertCounts {
  total: number
  new: number
  critical: number
  warning: number
  info: number
}

export interface Job {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  error: string | null
}

export interface SyncStatusRecord {
  id: string
  last_run_at: string | null
  status: 'idle' | 'running' | 'success' | 'failed'
  duration_ms: number | null
  items_processed: number
  next_run_at: string | null
}
