-- Intelligence Map: Extend existing tables

-- registry_items: add cluster and visual size
ALTER TABLE registry_items ADD COLUMN IF NOT EXISTS cluster_slug text;
ALTER TABLE registry_items ADD COLUMN IF NOT EXISTS node_size int DEFAULT 1;

-- projecten: add ecosystem, services, path, and CLAUDE.md summary
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS ecosystem text;
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '[]';
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS project_path text;
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS claude_md_summary text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registry_cluster ON registry_items(cluster_slug);
CREATE INDEX IF NOT EXISTS idx_projecten_ecosystem ON projecten(ecosystem);
