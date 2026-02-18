-- RLS policies voor Observer + Actor tabellen

-- Alerts: iedereen kan lezen, alleen service_role kan schrijven
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all on alerts"
  ON alerts FOR SELECT USING (true);

CREATE POLICY "Allow insert for service_role on alerts"
  ON alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for service_role on alerts"
  ON alerts FOR UPDATE USING (true);

-- Job Queue: iedereen kan lezen, alleen service_role kan schrijven
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all on job_queue"
  ON job_queue FOR SELECT USING (true);

CREATE POLICY "Allow insert for service_role on job_queue"
  ON job_queue FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for service_role on job_queue"
  ON job_queue FOR UPDATE USING (true);

-- Sync Status: iedereen kan lezen, alleen service_role kan schrijven
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all on sync_status"
  ON sync_status FOR SELECT USING (true);

CREATE POLICY "Allow update for service_role on sync_status"
  ON sync_status FOR UPDATE USING (true);
