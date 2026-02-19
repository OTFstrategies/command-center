-- CC Middelpunt Upgrade
-- Verruimt activity_log actions, voegt created_at toe aan entity_versions,
-- unique constraint op usage_statistics, en slug/name op projecten.

-- 1. Verruim activity_log action constraint
-- Huidige CHECK: action IN ('created', 'updated', 'deleted', 'synced')
-- Nodig: ook 'used', 'session_start', 'session_end', 'discovered'
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_action_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_check
  CHECK (action IN ('created', 'updated', 'deleted', 'synced', 'used', 'session_start', 'session_end', 'discovered'));

-- 2. Voeg created_at toe aan entity_versions (heeft alleen detected_at)
ALTER TABLE entity_versions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
UPDATE entity_versions SET created_at = detected_at WHERE created_at IS NULL;

-- 3. Unique constraint op usage_statistics voor upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_unique_entity_metric_period') THEN
    ALTER TABLE usage_statistics
      ADD CONSTRAINT usage_unique_entity_metric_period
      UNIQUE (entity_type, entity_id, metric, period);
  END IF;
END $$;

-- 4. Voeg slug + name toe aan projecten (voor Map/Dossier compatibiliteit)
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS name text;
UPDATE projecten SET slug = lower(replace(naam, ' ', '-')), name = naam WHERE slug IS NULL;
CREATE INDEX IF NOT EXISTS idx_projecten_slug ON projecten(slug);

-- 5. Service role policies voor nieuwe actions
-- activity_log heeft al RLS policies, maar we checken of service_role kan schrijven
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'service_role_all_activity_log'
  ) THEN
    CREATE POLICY "service_role_all_activity_log" ON activity_log FOR ALL TO service_role USING (true);
  END IF;
END $$;
