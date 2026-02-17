-- Create profile for existing user
INSERT INTO profiles (id, email, full_name)
VALUES (
  'e8c0fd53-c85b-41af-8356-e1230b015edf',
  'stelten@vehaontzorgt.nl',
  'Stelten'
);

-- Add user as admin to workspace
INSERT INTO workspace_members (workspace_id, profile_id, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'e8c0fd53-c85b-41af-8356-e1230b015edf',
  'admin'
);;
