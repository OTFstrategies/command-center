# Intelligence Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a visual Intelligence Map that shows Shadow's entire AI ecosystem — all items, relationships, hierarchies, insights — in an interactive, leek-proof dashboard.

**Architecture:** Four implementation waves. Wave 1 builds the data foundation (Supabase tables + Deep Scan engine). Wave 2 builds the Intelligence Map UI. Wave 3 enhances the Project Dossier. Wave 4 adds advanced features (costs, usage, timeline, comparison, export).

**Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL), react-force-graph-2d, d3-force, Framer Motion, Tailwind CSS v4, Huisstijl design system.

**Design Doc:** `docs/plans/2026-02-16-intelligence-map-design.md`

---

## Wave 1: Data Foundation

### Task 1: Create Intelligence Map database tables (core)

**Files:**
- Create: `supabase/migrations/20260216_001_create_intelligence_map_tables.sql`

**Step 1: Write migration for entity_relationships, asset_hierarchy, system_clusters, map_insights**

```sql
-- Entity Relationships: every connection line on the map
CREATE TABLE IF NOT EXISTS entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  relationship text NOT NULL,
  direction text DEFAULT 'source_to_target',
  strength int DEFAULT 1 CHECK (strength BETWEEN 1 AND 3),
  auto_detected boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_entity_rel_source ON entity_relationships(source_type, source_id);
CREATE INDEX idx_entity_rel_target ON entity_relationships(target_type, target_id);
CREATE INDEX idx_entity_rel_type ON entity_relationships(relationship);

-- Asset Hierarchy: tree structure for nested items
CREATE TABLE IF NOT EXISTS asset_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,
  asset_name text NOT NULL,
  parent_name text,
  root_name text,
  depth int NOT NULL DEFAULT 0,
  path text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_asset_hier_parent ON asset_hierarchy(parent_name);
CREATE INDEX idx_asset_hier_root ON asset_hierarchy(root_name);
CREATE INDEX idx_asset_hier_type ON asset_hierarchy(asset_type);

-- System Clusters: groups on the map
CREATE TABLE IF NOT EXISTS system_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  member_count int DEFAULT 0,
  health text DEFAULT 'unknown',
  insights jsonb DEFAULT '[]',
  position_x float,
  position_y float,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Map Insights: auto-generated observations
CREATE TABLE IF NOT EXISTS map_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('orphan', 'hub', 'gap', 'pattern', 'scale', 'health', 'isolated_cluster', 'single_point')),
  severity text NOT NULL CHECK (severity IN ('info', 'attention', 'warning')),
  title text NOT NULL,
  description text NOT NULL,
  affected_items jsonb DEFAULT '[]',
  action_label text,
  action_type text,
  resolved boolean DEFAULT false,
  generated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_map_insights_severity ON map_insights(severity);
CREATE INDEX idx_map_insights_resolved ON map_insights(resolved);

-- RLS policies (allow all for service role)
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for entity_relationships" ON entity_relationships FOR ALL USING (true);
CREATE POLICY "Allow all for asset_hierarchy" ON asset_hierarchy FOR ALL USING (true);
CREATE POLICY "Allow all for system_clusters" ON system_clusters FOR ALL USING (true);
CREATE POLICY "Allow all for map_insights" ON map_insights FOR ALL USING (true);
```

**Step 2: Run migration**

Run: `npx supabase db push` or apply via Supabase dashboard.
Expected: 4 tables created with indexes and RLS policies.

**Step 3: Commit**

```bash
git add supabase/migrations/20260216_001_create_intelligence_map_tables.sql
git commit -m "feat: create core Intelligence Map database tables"
```

---

### Task 2: Create Intelligence Map database tables (versioning + APIs)

**Files:**
- Create: `supabase/migrations/20260216_002_create_version_and_api_tables.sql`

**Step 1: Write migration for entity_versions and project_api_routes**

```sql
-- Entity Versions: version history per item
CREATE TABLE IF NOT EXISTS entity_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  version text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('added', 'modified', 'removed')),
  title text NOT NULL,
  description text,
  items_changed jsonb DEFAULT '[]',
  detected_at timestamptz DEFAULT now(),
  detected_by text DEFAULT 'deep-scan'
);

CREATE INDEX idx_entity_ver_entity ON entity_versions(entity_type, entity_id);
CREATE INDEX idx_entity_ver_date ON entity_versions(detected_at DESC);

-- Project API Routes: internal endpoints per project
CREATE TABLE IF NOT EXISTS project_api_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project text NOT NULL,
  path text NOT NULL,
  method text NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  auth_type text DEFAULT 'none',
  params jsonb DEFAULT '{}',
  response_type text DEFAULT 'json',
  file_path text,
  line_start int,
  tables_used text[] DEFAULT '{}',
  analyzed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_api_routes_project ON project_api_routes(project);
CREATE INDEX idx_api_routes_method ON project_api_routes(method);

-- RLS
ALTER TABLE entity_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_api_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for entity_versions" ON entity_versions FOR ALL USING (true);
CREATE POLICY "Allow all for project_api_routes" ON project_api_routes FOR ALL USING (true);
```

**Step 2: Run migration**

Run: `npx supabase db push` or apply via Supabase dashboard.
Expected: 2 tables created.

**Step 3: Commit**

```bash
git add supabase/migrations/20260216_002_create_version_and_api_tables.sql
git commit -m "feat: create version history and API routes tables"
```

---

### Task 3: Create Intelligence Map database tables (usage, costs, social)

**Files:**
- Create: `supabase/migrations/20260216_003_create_usage_cost_social_tables.sql`

**Step 1: Write migration**

```sql
-- Service Costs: costs per service per period
CREATE TABLE IF NOT EXISTS service_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  project text,
  plan text,
  monthly_cost decimal DEFAULT 0,
  usage_metric text,
  usage_value decimal DEFAULT 0,
  period text NOT NULL,
  detected_at timestamptz DEFAULT now()
);

CREATE INDEX idx_service_costs_period ON service_costs(period);
CREATE INDEX idx_service_costs_service ON service_costs(service);

-- Usage Statistics: usage per entity per period
CREATE TABLE IF NOT EXISTS usage_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metric text NOT NULL,
  value int DEFAULT 0,
  period text NOT NULL,
  last_used timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_usage_stats_entity ON usage_statistics(entity_type, entity_id);
CREATE INDEX idx_usage_stats_period ON usage_statistics(period);

-- User Visits: track last visit per page
CREATE TABLE IF NOT EXISTS user_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text DEFAULT 'shadow',
  page text NOT NULL,
  visited_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_visits_user_page ON user_visits(user_id, page);

-- Shared Views: shareable snapshots
CREATE TABLE IF NOT EXISTS shared_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('map', 'project', 'comparison')),
  token text UNIQUE NOT NULL,
  data_snapshot jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shared_views_token ON shared_views(token);

-- User Bookmarks: pinned items
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text DEFAULT 'shadow',
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  label text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bookmarks_user ON user_bookmarks(user_id);

-- RLS
ALTER TABLE service_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service_costs" ON service_costs FOR ALL USING (true);
CREATE POLICY "Allow all for usage_statistics" ON usage_statistics FOR ALL USING (true);
CREATE POLICY "Allow all for user_visits" ON user_visits FOR ALL USING (true);
CREATE POLICY "Allow all for shared_views" ON shared_views FOR ALL USING (true);
CREATE POLICY "Allow all for user_bookmarks" ON user_bookmarks FOR ALL USING (true);
```

**Step 2: Run migration**

Expected: 5 tables created.

**Step 3: Commit**

```bash
git add supabase/migrations/20260216_003_create_usage_cost_social_tables.sql
git commit -m "feat: create usage, costs, visits, shares, bookmarks tables"
```

---

### Task 4: Extend existing tables

**Files:**
- Create: `supabase/migrations/20260216_004_extend_registry_and_projects.sql`

**Step 1: Write migration**

```sql
-- Extend registry_items
ALTER TABLE registry_items ADD COLUMN IF NOT EXISTS cluster_slug text;
ALTER TABLE registry_items ADD COLUMN IF NOT EXISTS node_size int DEFAULT 1;

-- Extend projecten
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS ecosystem text;
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '[]';
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS project_path text;
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS claude_md_summary text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registry_cluster ON registry_items(cluster_slug);
CREATE INDEX IF NOT EXISTS idx_projecten_ecosystem ON projecten(ecosystem);
```

**Step 2: Run migration**

Expected: 6 columns added, 2 indexes created.

**Step 3: Commit**

```bash
git add supabase/migrations/20260216_004_extend_registry_and_projects.sql
git commit -m "feat: extend registry_items and projecten with map fields"
```

---

### Task 5: Build Deep Scan engine — Item Inventory (Phase 1)

**Files:**
- Create: `command-center-app/src/lib/deep-scan/inventory.ts`
- Create: `command-center-app/src/lib/deep-scan/types.ts`

**Step 1: Define Deep Scan types**

```typescript
// types.ts
export interface ScannedItem {
  type: 'project' | 'agent' | 'command' | 'skill' | 'plugin' | 'api' | 'instruction' | 'prompt' | 'design-system' | 'service'
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
```

**Step 2: Build inventory scanner**

Create `inventory.ts` that reads all `~/.claude/` directories and produces a `ScannedItem[]`. Must handle:
- `registry/*.json` — parse all registry JSON files
- `commands/*.md` — scan command files, extract name + description
- `agents/*/` — scan agent directories, parse agent .md files
- `skills/*/SKILL.md` — scan skill definitions
- `plugins/local/*/` — scan local plugins, inventory contents
- `plugins/cache/*/` — scan installed plugins (name, version, enabled)
- `apis/*/` — scan API configs (without exposing secrets)
- `instructions/*/` — scan instruction files
- `projects/*/` — scan project snapshots (name, size, CLAUDE.md)
- `design-system/` — scan as single special item

**Step 3: Commit**

```bash
git add command-center-app/src/lib/deep-scan/
git commit -m "feat: build Deep Scan inventory scanner (phase 1)"
```

---

### Task 6: Build Deep Scan engine — Hierarchy Detection (Phase 2)

**Files:**
- Create: `command-center-app/src/lib/deep-scan/hierarchy.ts`

**Step 1: Build hierarchy detector**

Takes `ScannedItem[]` as input, produces `DetectedHierarchy[]`.

Detection rules:
1. **Command naming:** Split on `-` and match prefixes. `miro-flowcharts-process-linear` -> find parent `miro-flowcharts-process` in items list.
2. **Agent folders:** Items in `agents/agent-os/*.md` -> parent is `agent-os`.
3. **Plugin contents:** Items in `plugins/local/security-os/agents/` -> parent is `security-os` plugin.
4. **Skill nesting:** Skills inside plugin folders -> parent is the plugin.

Build tree from leaves up, calculate depth and full path string.

**Step 2: Commit**

```bash
git add command-center-app/src/lib/deep-scan/hierarchy.ts
git commit -m "feat: build hierarchy detection (phase 2)"
```

---

### Task 7: Build Deep Scan engine — Relationship Detection (Phase 3)

**Files:**
- Create: `command-center-app/src/lib/deep-scan/relationships.ts`

**Step 1: Build relationship detector**

Takes `ScannedItem[]` + `DetectedHierarchy[]` as input, produces `DetectedRelationship[]`.

Detection methods:
1. **Same project:** Items with matching `project` field -> `belongs_to` relationship.
2. **Shared services:** Parse CLAUDE.md files for Supabase project IDs, Vercel configs -> `shares_service` between projects.
3. **Design system:** Projects that reference `~/.claude/design-system/` or mention Huisstijl -> `applies_to` relationship.
4. **Parent-child:** From hierarchy data -> `parent_of` relationships.
5. **Plugin-asset:** Assets inside a plugin directory -> `belongs_to` plugin.
6. **Agent-command:** Parse agent .md files for command references -> `invokes` relationship.
7. **Tag matching:** Items sharing tags -> weak `related_to` relationship.
8. **Service dependencies:** Projects with Supabase/Vercel/API configs -> `depends_on` service.
9. **Deployment:** Projects with Vercel config -> `deployed_on` Vercel.

**Step 2: Commit**

```bash
git add command-center-app/src/lib/deep-scan/relationships.ts
git commit -m "feat: build relationship detection (phase 3)"
```

---

### Task 8: Build Deep Scan engine — Cluster Detection (Phase 4)

**Files:**
- Create: `command-center-app/src/lib/deep-scan/clusters.ts`

**Step 1: Build cluster detector**

Takes `ScannedItem[]` + `DetectedRelationship[]` as input, produces `DetectedCluster[]`.

Algorithm:
1. Group items by name prefix: `veha-*`, `hs-*`, `miro-*`, `security-*`
2. Group items by shared plugin membership
3. Group items by shared project field
4. Group items by shared service (Supabase project ID)
5. Merge overlapping groups
6. Name clusters based on dominant prefix or project
7. Calculate member count and health (based on connected code intelligence data if available)

Expected clusters: VEHA, Agent-OS, H&S Docs, Security OS, Miro Toolkit, Core Tools, Design System.

**Step 2: Commit**

```bash
git add command-center-app/src/lib/deep-scan/clusters.ts
git commit -m "feat: build cluster detection (phase 4)"
```

---

### Task 9: Build Deep Scan engine — Insight Generation (Phase 5)

**Files:**
- Create: `command-center-app/src/lib/deep-scan/insights.ts`

**Step 1: Build insight generator**

Takes all previous scan results as input, produces `DetectedInsight[]`.

Rules:
1. **Orphan:** Items with 0 relationships -> severity "attention", action "Koppel aan project"
2. **Hub:** Items with >5 relationships -> severity "info", informational
3. **Gap:** Cluster without expected item types (e.g. no instructions) -> severity "attention", action "Maak aan"
4. **Scale:** Item with >3x average children -> severity "info"
5. **Isolated cluster:** Cluster with no external relationships -> severity "attention"
6. **Single point:** Service used by >3 projects -> severity "warning", action "Overweeg redundantie"
7. **Unused:** Items not used in 90+ days (from usage data) -> severity "info"
8. **Health:** Projects without code intelligence data -> severity "info", action "Analyseer project"

**Step 2: Commit**

```bash
git add command-center-app/src/lib/deep-scan/insights.ts
git commit -m "feat: build insight generation (phase 5)"
```

---

### Task 10: Build Deep Scan orchestrator + storage

**Files:**
- Create: `command-center-app/src/lib/deep-scan/index.ts`
- Create: `command-center-app/src/lib/deep-scan/storage.ts`

**Step 1: Build orchestrator**

`index.ts` exports `runDeepScan(basePath: string): Promise<DeepScanResult>` that:
1. Calls inventory scanner
2. Calls hierarchy detector
3. Calls relationship detector
4. Calls cluster detector
5. Calls insight generator
6. Returns combined result with timing stats

**Step 2: Build storage layer**

`storage.ts` exports `storeDeepScanResult(result: DeepScanResult): Promise<void>` that:
1. DELETEs all existing rows from: entity_relationships, asset_hierarchy, system_clusters, map_insights (fresh scan replaces old data)
2. INSERTs all new rows in batch
3. UPDATEs registry_items with cluster_slug
4. UPDATEs projecten with ecosystem, services, project_path, claude_md_summary

Uses Supabase service role client with `cache: 'no-store'` fetch.

**Step 3: Commit**

```bash
git add command-center-app/src/lib/deep-scan/index.ts command-center-app/src/lib/deep-scan/storage.ts
git commit -m "feat: build Deep Scan orchestrator and storage"
```

---

### Task 11: Build Deep Scan API endpoint

**Files:**
- Create: `command-center-app/src/app/api/sync/deep-scan/route.ts`

**Step 1: Build POST /api/sync/deep-scan**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { runDeepScan } from '@/lib/deep-scan'
import { storeDeepScanResult } from '@/lib/deep-scan/storage'

export async function POST(request: NextRequest) {
  // Auth check
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { basePath } = await request.json()

  try {
    const result = await runDeepScan(basePath || '~/.claude/')
    await storeDeepScanResult(result)

    return NextResponse.json({
      success: true,
      stats: result.stats
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/app/api/sync/deep-scan/route.ts
git commit -m "feat: add POST /api/sync/deep-scan endpoint"
```

---

### Task 12: Build /deep-scan slash command

**Files:**
- Create: `~/.claude/commands/deep-scan.md`

**Step 1: Write command**

The command should:
1. Read the full `~/.claude/` directory structure
2. Build the scan payload (all items, files, configs)
3. POST to `/api/sync/deep-scan`
4. Display results summary

**Step 2: Register in registry**

Add to `~/.claude/registry/commands.json`.

**Step 3: Commit**

```bash
git add ~/.claude/commands/deep-scan.md
git commit -m "feat: add /deep-scan slash command"
```

---

## Wave 2: Intelligence Map UI

### Task 13: Install react-force-graph-2d

**Step 1: Install dependency**

Run: `cd command-center-app && npm install react-force-graph-2d`

**Step 2: Verify install**

Run: `npm ls react-force-graph-2d`
Expected: Shows installed version.

**Step 3: Commit**

```bash
git add command-center-app/package.json command-center-app/package-lock.json
git commit -m "feat: add react-force-graph-2d for Intelligence Map"
```

---

### Task 14: Build map data fetching layer

**Files:**
- Create: `command-center-app/src/lib/map.ts`

**Step 1: Build server-side queries**

Functions needed:
- `getMapData()` — Returns all nodes (from registry_items + projecten + system_clusters) and edges (from entity_relationships)
- `getMapInsights()` — Returns all unresolved insights sorted by severity
- `getClusterData()` — Returns system_clusters with member counts
- `getRecentChanges(since: Date)` — Returns changes since last visit
- `getUserBookmarks(userId: string)` — Returns pinned items

All functions use Supabase service role with `cache: 'no-store'`.

**Step 2: Define TypeScript interfaces for map data**

Add to `command-center-app/src/types/index.ts`:
- `MapNode` — id, type, name, cluster, size, health, x, y
- `MapEdge` — source, target, relationship, strength, label
- `MapCluster` — name, slug, memberCount, health, description
- `MapInsight` — type, severity, title, description, affectedItems, action
- `MapData` — nodes, edges, clusters, insights

**Step 3: Commit**

```bash
git add command-center-app/src/lib/map.ts command-center-app/src/types/index.ts
git commit -m "feat: build map data fetching layer"
```

---

### Task 15: Build Intelligence Map page — layout + cockpit view

**Files:**
- Create: `command-center-app/src/app/(dashboard)/map/page.tsx`
- Create: `command-center-app/src/app/(dashboard)/map/loading.tsx`
- Create: `command-center-app/src/components/map/CockpitView.tsx`
- Create: `command-center-app/src/components/map/ClusterCard.tsx`

**Step 1: Build the page (Server Component)**

Fetches all map data server-side. Renders layout with mode toggle (Cockpit / Volledige kaart).

**Step 2: Build CockpitView**

Client component showing 5-7 ClusterCard components with connection lines between them. Each card shows: name, member count, health indicator, description.

**Step 3: Build ClusterCard**

Glassmorphism card component with Huisstijl styling. Shows cluster info. On click: either expands inline (shows members) or switches to full map filtered on that cluster.

**Step 4: Commit**

```bash
git add command-center-app/src/app/\(dashboard\)/map/ command-center-app/src/components/map/
git commit -m "feat: build Intelligence Map page with cockpit view"
```

---

### Task 16: Build full graph view

**Files:**
- Create: `command-center-app/src/components/map/FullGraphView.tsx`
- Create: `command-center-app/src/components/map/MapNodeRenderer.tsx`

**Step 1: Build FullGraphView**

Client component wrapping react-force-graph-2d. Receives MapData props. Configures:
- Node rendering: shapes by type, sizes by node_size, colors by zinc palette
- Edge rendering: styles by relationship type
- Force simulation: d3-force with cluster grouping (nodes in same cluster attract)
- Interactions: hover (highlight connections), click (open detail panel), zoom/pan
- Dark mode support: inverted zinc palette
- Performance: WebGL renderer, label hiding at zoom <2x for >300 nodes

**Step 2: Build MapNodeRenderer**

Custom canvas renderer for nodes. Draws different shapes per type:
- Project: circle, Agent: hexagon, Command: square, Skill: diamond
- Plugin: rounded square, Service: triangle, Instruction: dash, Design System: star

**Step 3: Commit**

```bash
git add command-center-app/src/components/map/FullGraphView.tsx command-center-app/src/components/map/MapNodeRenderer.tsx
git commit -m "feat: build full graph view with react-force-graph-2d"
```

---

### Task 17: Build filter bar

**Files:**
- Create: `command-center-app/src/components/map/FilterBar.tsx`

**Step 1: Build FilterBar component**

Client component with:
- Search input (zoek op naam — filters nodes in real-time)
- Type filter dropdown (Alle / Projecten / Agents / Commands / etc.)
- Cluster filter dropdown (Alle / VEHA / Agent-OS / etc.)
- Relationship type filter (Alle / Hierarchie / Koppelingen / Diensten)
- Reset button

Emits filter state to parent. Parent filters nodes/edges and passes filtered data to graph view.

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/FilterBar.tsx
git commit -m "feat: build map filter bar"
```

---

### Task 18: Build insights panel

**Files:**
- Create: `command-center-app/src/components/map/InsightsPanel.tsx`

**Step 1: Build InsightsPanel component**

Client component showing auto-generated observations:
- Grouped by severity (warning first, then attention, then info)
- Each insight shows: icon, title, description, action button
- Click insight -> highlights affected nodes on the map
- "Verberg opgeloste" toggle
- Collapsible (can minimize to just a count badge)

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/InsightsPanel.tsx
git commit -m "feat: build insights panel with action buttons"
```

---

### Task 19: Build detail panel (slide-in)

**Files:**
- Create: `command-center-app/src/components/map/DetailPanel.tsx`

**Step 1: Build DetailPanel component**

Client component that slides in from the right when a node is clicked:
- Framer Motion spring animation (slide + fade)
- Shows: item name, type, cluster, description
- Lists all relationships (grouped by type)
- Shows version history (last 5 entries)
- "Open project dossier" button (for projects)
- Close button (X) + Escape key

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/DetailPanel.tsx
git commit -m "feat: build detail panel with slide-in animation"
```

---

### Task 20: Add map to navigation

**Files:**
- Modify: `command-center-app/src/components/shell/MainNav.tsx`

**Step 1: Add Map link to sidebar navigation**

Add "Overzichtskaart" as second item (after Home), with a map/network icon from Lucide React.

**Step 2: Commit**

```bash
git add command-center-app/src/components/shell/MainNav.tsx
git commit -m "feat: add Intelligence Map to sidebar navigation"
```

---

### Task 21: Build "Sinds je laatste bezoek" component

**Files:**
- Create: `command-center-app/src/components/map/SinceLastVisit.tsx`

**Step 1: Build component**

Server component that:
1. Queries user_visits for last visit timestamp
2. Queries entity_versions + project_changelog for changes since then
3. Renders notification banner at top of map page
4. Groups changes: Nieuw, Gewijzigd, Aandacht
5. "Markeer als gelezen" button updates user_visits

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/SinceLastVisit.tsx
git commit -m "feat: build 'since last visit' notification component"
```

---

### Task 22: Build help overlay

**Files:**
- Create: `command-center-app/src/components/map/HelpOverlay.tsx`

**Step 1: Build (?) help button + overlay**

Floating button (?) in top-right corner. On click, shows overlay explaining:
- "Dit is de Overzichtskaart — een visuele kaart van je hele AI-setup"
- What each shape means (with visual legend)
- What each line type means
- How to interact (hover, click, zoom, pan)
- First-time auto-show (uses localStorage flag)

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/HelpOverlay.tsx
git commit -m "feat: build help overlay with legend"
```

---

## Wave 3: Project Dossier

### Task 23: Restructure project detail page with tabs/scroll toggle

**Files:**
- Modify: `command-center-app/src/app/(dashboard)/projects/[slug]/page.tsx`
- Create: `command-center-app/src/components/project-dossier/DossierLayout.tsx`
- Modify: `command-center-app/src/components/code-intel/ProjectTabs.tsx`

**Step 1: Add tabs/scroll toggle**

Extend ProjectTabs to support a "Scroll" mode where all tab contents render sequentially on one scrollable page. Toggle button at top: [Tabs] [Scroll].

**Step 2: Add new tabs/sections to page**

Add data fetching for: functions, relationships, api routes, version history. Extend the page's Promise.all to include new queries.

**Step 3: Commit**

```bash
git add command-center-app/src/app/\(dashboard\)/projects/\[slug\]/page.tsx command-center-app/src/components/project-dossier/ command-center-app/src/components/code-intel/ProjectTabs.tsx
git commit -m "feat: restructure project detail with tabs/scroll toggle"
```

---

### Task 24: Build "Overzicht" section (enhanced)

**Files:**
- Create: `command-center-app/src/components/project-dossier/OverviewSection.tsx`
- Create: `command-center-app/src/components/project-dossier/IdentityCard.tsx`
- Create: `command-center-app/src/components/project-dossier/MiniMap.tsx`
- Create: `command-center-app/src/components/project-dossier/AttentionPoints.tsx`

**Step 1: IdentityCard** — Name, path, ecosystem, services, health, CLAUDE.md summary
**Step 2: MiniMap** — Small react-force-graph showing only this project + direct connections
**Step 3: AttentionPoints** — Project-specific insights with action buttons

**Step 4: Commit**

```bash
git add command-center-app/src/components/project-dossier/
git commit -m "feat: build enhanced overview section with identity card, mini map, attention points"
```

---

### Task 25: Build "Functies" section

**Files:**
- Create: `command-center-app/src/components/project-dossier/FunctionsSection.tsx`
- Create: `command-center-app/src/lib/functions.ts`

**Step 1: Build capability detection logic**

`functions.ts` analyzes project assets (APIs, commands, agents, components, Code Intelligence symbols) and groups them into functional categories:
- Document Generation, Project Management, Automation, Data Sync, Search, etc.
- Each capability lists: what implements it (components, routes, tables)

**Step 2: Build FunctionsSection**

Collapsible categories showing capabilities with their implementation details.

**Step 3: Commit**

```bash
git add command-center-app/src/components/project-dossier/FunctionsSection.tsx command-center-app/src/lib/functions.ts
git commit -m "feat: build functions/capabilities section"
```

---

### Task 26: Build "Onderdelen" section (tree view)

**Files:**
- Create: `command-center-app/src/components/project-dossier/AssetsTree.tsx`
- Create: `command-center-app/src/components/project-dossier/TreeNode.tsx`

**Step 1: Build AssetsTree**

Reads from asset_hierarchy + registry_items. Renders collapsible tree with:
- Type icons per node
- Version badges ("sinds v1.3")
- Gap indicators (empty groups that should have items)
- Inline detail on click (description, path, tags)

**Step 2: Commit**

```bash
git add command-center-app/src/components/project-dossier/AssetsTree.tsx command-center-app/src/components/project-dossier/TreeNode.tsx
git commit -m "feat: build hierarchical assets tree view"
```

---

### Task 27: Build "Verbindingen" section

**Files:**
- Create: `command-center-app/src/components/project-dossier/ConnectionsSection.tsx`

**Step 1: Build ConnectionsSection**

Reads entity_relationships filtered for this project. Shows three sub-sections:
1. Ecosystem partners (visual mini-diagram of related projects)
2. Shared services (Supabase, Vercel, Huisstijl + who else uses them)
3. Asset connections (agents, commands that serve this project)

**Step 2: Commit**

```bash
git add command-center-app/src/components/project-dossier/ConnectionsSection.tsx
git commit -m "feat: build connections section"
```

---

### Task 28: Build "Toegangspunten" section (API routes)

**Files:**
- Create: `command-center-app/src/components/project-dossier/ApiRoutesSection.tsx`

**Step 1: Build ApiRoutesSection**

Reads project_api_routes. Shows:
- Routes grouped by auth status (secured / open)
- Method badges (GET/POST/PUT/DELETE)
- Expandable rows showing params, response type, related tables, code location
- Lock icon for authenticated routes

**Step 2: Commit**

```bash
git add command-center-app/src/components/project-dossier/ApiRoutesSection.tsx
git commit -m "feat: build API routes section"
```

---

### Task 29: Build "Geschiedenis" section (version timeline)

**Files:**
- Create: `command-center-app/src/components/project-dossier/VersionTimeline.tsx`

**Step 1: Build VersionTimeline**

Reads entity_versions for this project. Renders vertical timeline:
- Grouped by month
- Each entry: version number, title, date, items changed
- "Toon volledige geschiedenis" expand button

**Step 2: Commit**

```bash
git add command-center-app/src/components/project-dossier/VersionTimeline.tsx
git commit -m "feat: build version timeline component"
```

---

## Wave 4: Advanced Features

### Task 30: Build costs overview

**Files:**
- Create: `command-center-app/src/components/map/CostsOverview.tsx`
- Create: `command-center-app/src/lib/costs.ts`

**Step 1: Build costs detection**

`costs.ts` reads service_costs table + detects services from projecten.services field.

**Step 2: Build CostsOverview component**

Shows monthly costs per service, per project breakdown, trend over time.

**Step 3: Commit**

```bash
git add command-center-app/src/components/map/CostsOverview.tsx command-center-app/src/lib/costs.ts
git commit -m "feat: build costs overview component"
```

---

### Task 31: Build usage statistics

**Files:**
- Create: `command-center-app/src/components/map/UsageStats.tsx`
- Create: `command-center-app/src/lib/usage.ts`

**Step 1: Build usage parsing**

`usage.ts` reads usage_statistics table. Can also parse `~/.claude/usage-data/` during deep scan to populate the table.

**Step 2: Build UsageStats component**

Bar chart of most/least used items. Highlights never-used items.

**Step 3: Commit**

```bash
git add command-center-app/src/components/map/UsageStats.tsx command-center-app/src/lib/usage.ts
git commit -m "feat: build usage statistics component"
```

---

### Task 32: Build timeline/growth view

**Files:**
- Create: `command-center-app/src/components/map/TimelineView.tsx`

**Step 1: Build TimelineView**

Horizontal timeline showing ecosystem growth:
- Key milestones from entity_versions + activity_log
- Growth sparklines (items, projects, sessions)
- Grouped by month

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/TimelineView.tsx
git commit -m "feat: build ecosystem growth timeline"
```

---

### Task 33: Build comparison view

**Files:**
- Create: `command-center-app/src/components/map/ComparisonView.tsx`

**Step 1: Build ComparisonView**

Two project selector dropdowns. Shows side-by-side comparison:
- Asset counts, code metrics, health, services
- Shared items highlighted
- Differences highlighted

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/ComparisonView.tsx
git commit -m "feat: build project comparison view"
```

---

### Task 34: Build risk analysis

**Files:**
- Create: `command-center-app/src/components/map/RiskAnalysis.tsx`

**Step 1: Build RiskAnalysis**

Analyzes entity_relationships to find:
- Critical dependencies (services used by >3 projects)
- Single points of failure
- Impact assessment ("Als dit uitvalt: X projecten getroffen")

Color coded: red (high), yellow (medium), green (low).

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/RiskAnalysis.tsx
git commit -m "feat: build risk analysis component"
```

---

### Task 35: Build bookmarks

**Files:**
- Create: `command-center-app/src/components/map/BookmarksPanel.tsx`
- Create: `command-center-app/src/app/api/bookmarks/route.ts`

**Step 1: Build API route for CRUD bookmarks**
**Step 2: Build BookmarksPanel component** — List of pinned items with drag-to-reorder

**Step 3: Commit**

```bash
git add command-center-app/src/components/map/BookmarksPanel.tsx command-center-app/src/app/api/bookmarks/route.ts
git commit -m "feat: build bookmarks panel with API"
```

---

### Task 36: Build export/share

**Files:**
- Create: `command-center-app/src/components/map/ExportMenu.tsx`
- Create: `command-center-app/src/app/api/share/route.ts`

**Step 1: Build share API** — Creates shared_views entry with token, returns share URL
**Step 2: Build ExportMenu** — Dropdown with options: Screenshot (PNG), Deelbare link (24h), PDF rapport

**Step 3: Commit**

```bash
git add command-center-app/src/components/map/ExportMenu.tsx command-center-app/src/app/api/share/route.ts
git commit -m "feat: build export and share functionality"
```

---

### Task 37: Build quick actions

**Files:**
- Create: `command-center-app/src/components/map/QuickActions.tsx`

**Step 1: Build QuickActions component**

Floating action menu on the map page:
- [Volledige Scan] — Triggers POST /api/sync/deep-scan
- [Synchroniseer] — Triggers existing sync
- [Analyseer Code] — Triggers Code Intelligence MCP
- Shows loading state and result notification

**Step 2: Commit**

```bash
git add command-center-app/src/components/map/QuickActions.tsx
git commit -m "feat: build quick actions floating menu"
```

---

### Task 38: Add (?) help buttons to all pages

**Files:**
- Create: `command-center-app/src/components/ui/HelpButton.tsx`
- Modify: All page files to include HelpButton

**Step 1: Build reusable HelpButton component**

Takes `content: string` prop. Renders (?) button that opens popover with explanation text.

**Step 2: Add to every page** — map, project dossier, tasks, registry, activity, settings

**Step 3: Commit**

```bash
git add command-center-app/src/components/ui/HelpButton.tsx
git commit -m "feat: add help buttons to all pages"
```

---

### Task 39: Add tooltips to all interactive elements

**Files:**
- Create: `command-center-app/src/components/ui/Tooltip.tsx`
- Modify: Components across the app to add tooltip props

**Step 1: Build reusable Tooltip component**

Lightweight tooltip that appears on hover with configurable delay and position.

**Step 2: Add tooltips to** — Node types, edge types, health badges, insight icons, action buttons, filter chips

**Step 3: Commit**

```bash
git add command-center-app/src/components/ui/Tooltip.tsx
git commit -m "feat: add tooltips across the application"
```

---

### Task 40: MCP Server extension — API route extraction

**Files:**
- Create: `cc-v2-mcp/src/analyzer/api-routes.ts`
- Modify: `cc-v2-mcp/src/analyzer/index.ts`
- Modify: `cc-v2-mcp/src/index.ts`

**Step 1: Build API route extractor**

Uses ts-morph to scan `app/api/` directories. For each route file:
- Detect exported HTTP method handlers (GET, POST, PUT, DELETE)
- Parse request parameters from code
- Detect auth checks (x-api-key, Bearer token patterns)
- Detect Supabase table references (.from('table_name'))
- Extract file path and line numbers

**Step 2: Add `extract_api_routes` tool to MCP server**

New MCP tool that runs the extractor and stores results in project_api_routes table.

**Step 3: Integrate into analyze_project**

Make `analyze_project` also run API route extraction as part of full analysis.

**Step 4: Commit**

```bash
git add cc-v2-mcp/src/analyzer/api-routes.ts cc-v2-mcp/src/index.ts cc-v2-mcp/src/analyzer/index.ts
git commit -m "feat: add API route extraction to MCP server"
```

---

### Task 41: Update CLAUDE.md with Intelligence Map documentation

**Files:**
- Modify: `command-center-app/../CLAUDE.md` (project root)

**Step 1: Add Intelligence Map section**

Document: new pages, new tables, new API endpoints, Deep Scan pipeline, map components.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Intelligence Map architecture"
```

---

### Task 42: Deploy and verify

**Step 1: Run full build**

Run: `cd command-center-app && npm run build`
Expected: No errors, map page shows as dynamic (f).

**Step 2: Deploy to Vercel**

Run: `cd command-center-app && npx vercel --prod --yes --force`
Expected: Successful deployment.

**Step 3: Run first Deep Scan**

Trigger `/deep-scan` or POST /api/sync/deep-scan manually to populate all new tables.

**Step 4: Verify Intelligence Map**

Open https://command-center-app-nine.vercel.app/map
Expected: Cockpit view shows system clusters. Toggle to full map shows all nodes.

**Step 5: Verify Project Dossier**

Open https://command-center-app-nine.vercel.app/projects/command-center
Expected: All 8 sections visible, tabs/scroll toggle works.

**Step 6: Commit any fixes**

```bash
git add -A && git commit -m "fix: post-deployment fixes for Intelligence Map"
```

---

## Summary

| Wave | Tasks | Estimated Components |
|------|-------|---------------------|
| 1: Data Foundation | Tasks 1-12 | 11 tables + Deep Scan engine (6 modules) + API + command |
| 2: Map UI | Tasks 13-22 | Map page + 8 components (cockpit, graph, filters, insights, detail, help, notifications) |
| 3: Project Dossier | Tasks 23-29 | 8 enhanced sections + tree view + mini map + timeline |
| 4: Advanced Features | Tasks 30-42 | Costs, usage, timeline, comparison, risk, bookmarks, export, quick actions, help, tooltips, MCP extension |

**Total: 42 tasks across 4 waves.**
