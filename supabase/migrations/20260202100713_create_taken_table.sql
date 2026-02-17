-- Create taken table for my-product task management
CREATE TABLE IF NOT EXISTS taken (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projecten(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  procedure_id TEXT NOT NULL REFERENCES procedures(id),
  procedure_code TEXT NOT NULL,
  status "TaakStatus" DEFAULT 'Nieuw',
  toegewezen_aan TEXT NOT NULL REFERENCES gebruikers(id),
  deadline DATE NOT NULL,
  fotos TEXT[] DEFAULT ARRAY[]::TEXT[],
  gestart_op TIMESTAMP,
  voltooid_op TIMESTAMP,
  eind_status "TaakEindStatus",
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_taken_project ON taken(project_id);
CREATE INDEX IF NOT EXISTS idx_taken_procedure ON taken(procedure_id);
CREATE INDEX IF NOT EXISTS idx_taken_toegewezen ON taken(toegewezen_aan);
CREATE INDEX IF NOT EXISTS idx_taken_status ON taken(status);
CREATE INDEX IF NOT EXISTS idx_taken_deadline ON taken(deadline);

ALTER TABLE taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON taken FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Allow authenticated insert" ON taken FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON taken FOR UPDATE TO authenticated USING (deleted_at IS NULL);;
