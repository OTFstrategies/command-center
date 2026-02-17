CREATE TABLE IF NOT EXISTS project_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project TEXT NOT NULL,
  title TEXT,
  description TEXT,
  change_type TEXT DEFAULT 'sync',
  items_affected TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);;
