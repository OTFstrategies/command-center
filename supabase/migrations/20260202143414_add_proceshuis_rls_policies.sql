-- Add RLS policies for proceshuis tables that are missing them

-- procedures
CREATE POLICY "Allow authenticated read" ON procedures FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Allow authenticated insert" ON procedures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON procedures FOR UPDATE TO authenticated USING (deleted_at IS NULL);

-- procedure_stappen
CREATE POLICY "Allow authenticated read" ON procedure_stappen FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Allow authenticated insert" ON procedure_stappen FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON procedure_stappen FOR UPDATE TO authenticated USING (deleted_at IS NULL);

-- procedure_versies
CREATE POLICY "Allow authenticated read" ON procedure_versies FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Allow authenticated insert" ON procedure_versies FOR INSERT TO authenticated WITH CHECK (true);

-- gebruikers (needed for eigenaar lookups)
CREATE POLICY "Allow authenticated read" ON gebruikers FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- glossary_terms
CREATE POLICY "Allow authenticated read" ON glossary_terms FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Allow authenticated insert" ON glossary_terms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON glossary_terms FOR UPDATE TO authenticated USING (deleted_at IS NULL);;
