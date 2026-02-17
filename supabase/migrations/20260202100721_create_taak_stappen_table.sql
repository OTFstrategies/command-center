-- Create taak_stappen table for task checklist steps
CREATE TABLE IF NOT EXISTS taak_stappen (
  id TEXT PRIMARY KEY,
  taak_id TEXT NOT NULL REFERENCES taken(id) ON DELETE CASCADE,
  procedure_stap_id TEXT NOT NULL REFERENCES procedure_stappen(id),
  titel TEXT NOT NULL,
  beschrijving TEXT NOT NULL,
  afgevinkt BOOLEAN DEFAULT FALSE,
  afgevinkt_op TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_taak_stappen_taak ON taak_stappen(taak_id);
CREATE INDEX IF NOT EXISTS idx_taak_stappen_procedure_stap ON taak_stappen(procedure_stap_id);

ALTER TABLE taak_stappen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON taak_stappen FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Allow authenticated insert" ON taak_stappen FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON taak_stappen FOR UPDATE TO authenticated USING (deleted_at IS NULL);;
