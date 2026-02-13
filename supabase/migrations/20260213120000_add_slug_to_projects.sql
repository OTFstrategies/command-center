-- Add slug column to projects table for Command Center v2 project lookup
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs from existing project names
UPDATE projects SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
