-- Project memories table (replaces Serena .serena/memories/)
CREATE TABLE IF NOT EXISTS project_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project, name)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_project_memories_project ON project_memories(project);

-- RLS disabled (we use service role key for all access)
ALTER TABLE project_memories ENABLE ROW LEVEL SECURITY;
