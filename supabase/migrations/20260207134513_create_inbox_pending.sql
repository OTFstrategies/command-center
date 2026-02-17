CREATE TABLE inbox_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project TEXT NOT NULL,
  slug TEXT NOT NULL,
  manifest JSONB NOT NULL DEFAULT '{}',
  project_meta JSONB NOT NULL DEFAULT '{}',
  registry_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'synced', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

ALTER TABLE inbox_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on inbox_pending"
ON inbox_pending
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_inbox_pending_status ON inbox_pending(status);;
