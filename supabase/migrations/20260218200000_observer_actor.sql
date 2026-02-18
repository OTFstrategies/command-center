-- Observer + Actor: alerts, job_queue, sync_status

-- Alerts tabel
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- Job Queue tabel
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}',
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);

-- Sync Status tabel
CREATE TABLE IF NOT EXISTS sync_status (
  id TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'idle',
  duration_ms INTEGER,
  items_processed INTEGER DEFAULT 0,
  next_run_at TIMESTAMPTZ
);

-- Seed sync_status met initiele records
INSERT INTO sync_status (id, status) VALUES
  ('registry_sync', 'idle'),
  ('deep_scan', 'idle'),
  ('health_check', 'idle')
ON CONFLICT (id) DO NOTHING;

-- Database Trigger: na sync complete -> queue health check
CREATE OR REPLACE FUNCTION queue_health_check()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.type = 'registry_sync' THEN
    INSERT INTO job_queue (type, status, payload)
    VALUES ('health_check', 'pending', '{}');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_sync_complete ON job_queue;
CREATE TRIGGER after_sync_complete
  AFTER UPDATE ON job_queue
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.type = 'registry_sync')
  EXECUTE FUNCTION queue_health_check();

-- Enable Realtime voor alerts
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
