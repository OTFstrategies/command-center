-- Create audit_log table for tracking all entity changes
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entiteit_type "EntiteitType" NOT NULL,
  entiteit_id TEXT NOT NULL,
  actie "AuditActie" NOT NULL,
  beschrijving TEXT NOT NULL,
  gebruiker_id TEXT NOT NULL REFERENCES gebruikers(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entiteit ON audit_log(entiteit_type, entiteit_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_gebruiker ON audit_log(gebruiker_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);;
