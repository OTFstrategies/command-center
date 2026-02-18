-- Activeer pg_cron en pg_net extensions + maak schedules aan

-- Enable extensions (beschikbaar op Supabase Pro)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Verwijder bestaande schedules als ze bestaan (idempotent)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('health-check-6h', 'daily-digest');

-- Elke 6 uur: health check draaien
SELECT cron.schedule(
  'health-check-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check',
    body := '{}'::jsonb,
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcG1saG1ib29heGZybHB6Y2ZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk2NTM2NSwiZXhwIjoyMDg1NTQxMzY1fQ.xdlGyNY7nH9j9fksmiXsBrrYGQ54VHn2qYC1zC9RbPc", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Elke ochtend 7:00 UTC: daily digest
SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/alert-digest',
    body := '{}'::jsonb,
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcG1saG1ib29heGZybHB6Y2ZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk2NTM2NSwiZXhwIjoyMDg1NTQxMzY1fQ.xdlGyNY7nH9j9fksmiXsBrrYGQ54VHn2qYC1zC9RbPc", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
