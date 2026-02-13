-- Add onboarding metadata columns to projects table (replaces Serena onboarding)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS build_command TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS test_command TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dev_command TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_url TEXT;
