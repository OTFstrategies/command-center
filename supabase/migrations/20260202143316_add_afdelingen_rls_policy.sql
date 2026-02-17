-- Add RLS policy for afdelingen table
CREATE POLICY "Allow authenticated read" ON afdelingen FOR SELECT TO authenticated USING (deleted_at IS NULL);;
