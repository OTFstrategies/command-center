-- Intelligence Map: Entity Versions
-- Version history per item (functional changes, not git commits)

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

-- Intelligence Map: Project API Routes
-- Internal API endpoints per project, auto-detected by code analysis

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
