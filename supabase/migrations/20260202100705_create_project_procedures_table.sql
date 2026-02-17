-- Create project_procedures junction table
CREATE TABLE IF NOT EXISTS project_procedures (
  project_id TEXT REFERENCES projecten(id) ON DELETE CASCADE,
  procedure_id TEXT REFERENCES procedures(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, procedure_id)
);

CREATE INDEX IF NOT EXISTS idx_project_procedures_project ON project_procedures(project_id);
CREATE INDEX IF NOT EXISTS idx_project_procedures_procedure ON project_procedures(procedure_id);

ALTER TABLE project_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON project_procedures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON project_procedures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON project_procedures FOR DELETE TO authenticated USING (true);;
