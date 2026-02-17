-- Create probleem_meldingen table for task issue reporting
CREATE TABLE IF NOT EXISTS probleem_meldingen (
  id TEXT PRIMARY KEY,
  taak_id TEXT NOT NULL REFERENCES taken(id) ON DELETE CASCADE,
  categorie "ProbleemCategorie" NOT NULL,
  beschrijving TEXT NOT NULL,
  gemeld_door TEXT NOT NULL REFERENCES gebruikers(id),
  gemeld_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opgelost BOOLEAN DEFAULT FALSE,
  opgelost_op TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_probleem_meldingen_taak ON probleem_meldingen(taak_id);

ALTER TABLE probleem_meldingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON probleem_meldingen FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Allow authenticated insert" ON probleem_meldingen FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON probleem_meldingen FOR UPDATE TO authenticated USING (deleted_at IS NULL);;
