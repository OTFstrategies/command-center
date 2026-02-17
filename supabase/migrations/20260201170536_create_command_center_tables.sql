
-- Registry items (Claude Command Center)
CREATE TABLE registry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('api', 'prompt', 'skill', 'agent', 'command', 'instruction')),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  project TEXT DEFAULT 'global',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'synced')),
  item_type TEXT NOT NULL,
  item_id UUID REFERENCES registry_items(id),
  item_name TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE registry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - admins only for registry
CREATE POLICY "Admins can manage registry" ON registry_items FOR ALL 
  USING (
    auth.uid() IN (
      SELECT profile_id FROM workspace_members WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can view activity log" ON activity_log FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT profile_id FROM workspace_members WHERE role = 'admin'
    )
  );
;
