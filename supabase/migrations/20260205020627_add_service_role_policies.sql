-- Add service role policies for sync API
-- Service role should bypass RLS, but we add explicit policies for clarity

-- Policy for registry_items - allow service role full access
CREATE POLICY "Service role can manage registry_items"
ON registry_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy for activity_log - allow service role full access
CREATE POLICY "Service role can manage activity_log"
ON activity_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy for project_changelog - allow service role full access
CREATE POLICY "Service role can manage project_changelog"
ON project_changelog
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy for projects - allow service role full access
CREATE POLICY "Service role can manage projects"
ON projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);;
