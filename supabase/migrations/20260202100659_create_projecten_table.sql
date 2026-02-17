-- Create projecten table for my-product project management
CREATE TABLE IF NOT EXISTS projecten (
  id TEXT PRIMARY KEY,
  naam TEXT NOT NULL,
  locatie TEXT NOT NULL,
  status "ProjectStatus" DEFAULT 'Planning',
  start_datum DATE NOT NULL,
  eind_datum DATE,
  voortgang INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

ALTER TABLE projecten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON projecten FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Allow authenticated insert" ON projecten FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON projecten FOR UPDATE TO authenticated USING (deleted_at IS NULL);;
