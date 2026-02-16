-- Intelligence Map: Entity Relationships
-- Every connection line on the map is a row in this table

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

-- Intelligence Map: Asset Hierarchy
-- Tree structure for nested items (commands, plugin contents)

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

-- Intelligence Map: System Clusters
-- Automatically detected groups on the map

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

-- Intelligence Map: Map Insights
-- Auto-generated observations with action recommendations

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

-- RLS policies
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for entity_relationships" ON entity_relationships FOR ALL USING (true);
CREATE POLICY "Allow all for asset_hierarchy" ON asset_hierarchy FOR ALL USING (true);
CREATE POLICY "Allow all for system_clusters" ON system_clusters FOR ALL USING (true);
CREATE POLICY "Allow all for map_insights" ON map_insights FOR ALL USING (true);
