-- Intelligence Map: Service Costs
-- Monthly costs per service per project

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

-- Intelligence Map: Usage Statistics
-- Usage metrics per entity per period

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

-- Intelligence Map: User Visits
-- Track last visit per page for "since last visit" feature

CREATE TABLE IF NOT EXISTS user_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text DEFAULT 'shadow',
  page text NOT NULL,
  visited_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_visits_user_page ON user_visits(user_id, page);

-- Intelligence Map: Shared Views
-- Shareable snapshots for external parties (24h expiry)

CREATE TABLE IF NOT EXISTS shared_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('map', 'project', 'comparison')),
  token text UNIQUE NOT NULL,
  data_snapshot jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shared_views_token ON shared_views(token);

-- Intelligence Map: User Bookmarks
-- Pinned items for quick access

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
