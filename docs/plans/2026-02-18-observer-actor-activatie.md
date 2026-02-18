# Observer + Actor Activatie Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Het Observer + Actor systeem activeren — database tabellen aanmaken, Edge Functions deployen, data pipeline completeren, en het hele systeem end-to-end werkend krijgen.

**Architecture:** De frontend code is deployed op Vercel maar de backend infra (Supabase tabellen, Edge Functions, pg_cron) bestaat nog niet. Dit plan activeert alles, lost code gaps op (graceful degradation, entity_versions, job executie), en configureert Claude Code auto-sync.

**Tech Stack:** Supabase (PostgreSQL, Edge Functions, Realtime, pg_cron), Next.js 14, Supabase CLI, Claude Code hooks

---

## Fase 1: Database Activatie

### Task 1: Run Observer + Actor SQL migration

**Doel:** De 3 nieuwe tabellen + trigger + Realtime activeren in Supabase.

**Step 1: Open Supabase SQL Editor**

Ga naar: `https://supabase.com/dashboard/project/ikpmlhmbooaxfrlpzcfa/sql/new`

**Step 2: Plak en run de migration**

Kopieer de inhoud van `supabase/migrations/20260218200000_observer_actor.sql` en execute in SQL Editor.

**Step 3: Verifieer tabellen bestaan**

Run in SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('alerts', 'job_queue', 'sync_status');
```
Verwacht: 3 rijen.

**Step 4: Verifieer seed data**

```sql
SELECT * FROM sync_status;
```
Verwacht: 3 rijen (registry_sync, deep_scan, health_check) met status 'idle'.

**Step 5: Verifieer trigger**

```sql
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'job_queue';
```
Verwacht: `after_sync_complete`.

---

### Task 2: Add RLS policies voor nieuwe tabellen

**Files:**
- Create: `supabase/migrations/20260218200200_observer_actor_rls.sql`

**Step 1: Schrijf de RLS migration**

```sql
-- RLS policies voor Observer + Actor tabellen

-- Alerts: iedereen kan lezen, alleen service_role kan schrijven
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all on alerts"
  ON alerts FOR SELECT USING (true);

CREATE POLICY "Allow insert for service_role on alerts"
  ON alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for service_role on alerts"
  ON alerts FOR UPDATE USING (true);

-- Job Queue: iedereen kan lezen, alleen service_role kan schrijven
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all on job_queue"
  ON job_queue FOR SELECT USING (true);

CREATE POLICY "Allow insert for service_role on job_queue"
  ON job_queue FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for service_role on job_queue"
  ON job_queue FOR UPDATE USING (true);

-- Sync Status: iedereen kan lezen, alleen service_role kan schrijven
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all on sync_status"
  ON sync_status FOR SELECT USING (true);

CREATE POLICY "Allow update for service_role on sync_status"
  ON sync_status FOR UPDATE USING (true);
```

**Step 2: Run in Supabase SQL Editor**

Kopieer de SQL en execute.

**Step 3: Verifieer**

```sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('alerts', 'job_queue', 'sync_status');
```
Verwacht: 7 policies.

**Step 4: Commit**

```bash
git add supabase/migrations/20260218200200_observer_actor_rls.sql
git commit -m "feat: add RLS policies for Observer + Actor tables"
```

---

## Fase 2: Code Hardening

### Task 3: Consolideer Alert/Job types in types/index.ts

**Files:**
- Modify: `command-center-app/src/types/index.ts`

**Probleem:** Alert en Job interfaces staan in `lib/alerts.ts` en `lib/jobs.ts`, niet in het centrale types bestand. Dit breekt de conventie (alle types in `types/index.ts`).

**Step 1: Voeg types toe aan types/index.ts**

Voeg toe na de `// INTELLIGENCE MAP` sectie:

```typescript
// =============================================================================
// OBSERVER + ACTOR
// =============================================================================

export interface Alert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string | null
  entity_type: string | null
  entity_id: string | null
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed'
  metadata: Record<string, unknown>
  created_at: string
  resolved_at: string | null
}

export interface AlertCounts {
  total: number
  new: number
  critical: number
  warning: number
  info: number
}

export interface Job {
  id: string
  type: 'registry_sync' | 'deep_scan' | 'health_check' | 'code_analysis'
  status: 'pending' | 'running' | 'completed' | 'failed'
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  error: string | null
}

export interface SyncStatusRecord {
  id: string
  last_run_at: string | null
  status: 'idle' | 'running' | 'success' | 'failed'
  duration_ms: number | null
  items_processed: number
  next_run_at: string | null
}
```

**Step 2: Build check**

```bash
cd command-center-app && npx tsc --noEmit
```
Verwacht: 0 errors.

**Step 3: Commit**

```bash
git add command-center-app/src/types/index.ts
git commit -m "feat: add Alert, Job, SyncStatusRecord types to central types"
```

---

### Task 4: Update lib files om shared types te gebruiken

**Files:**
- Modify: `command-center-app/src/lib/alerts.ts`
- Modify: `command-center-app/src/lib/jobs.ts`

**Step 1: Update lib/alerts.ts**

Vervang de lokale `Alert` interface door een import:

```typescript
// Bovenaan het bestand, vervang de interface definitie door:
import type { Alert, AlertCounts } from '@/types'
```

Verwijder de lokale `interface Alert { ... }` definitie uit het bestand.

**Step 2: Update lib/jobs.ts**

Vervang de lokale `Job` en `SyncStatus` interfaces door imports:

```typescript
// Bovenaan het bestand:
import type { Job, SyncStatusRecord } from '@/types'
```

Verwijder de lokale interface definities.

**Step 3: Build check**

```bash
cd command-center-app && npx tsc --noEmit
```
Verwacht: 0 errors. Als er type mismatches zijn, pas de types in `types/index.ts` aan om te matchen met het gebruik.

**Step 4: Commit**

```bash
git add command-center-app/src/lib/alerts.ts command-center-app/src/lib/jobs.ts
git commit -m "refactor: use shared types from types/index.ts in alert and job libs"
```

---

### Task 5: Graceful degradation voor useRealtimeAlerts

**Files:**
- Modify: `command-center-app/src/hooks/useRealtimeAlerts.ts`

**Probleem:** Als de `alerts` tabel niet bestaat (migration nog niet gedraaid), crasht de Realtime subscription niet maar de fetch naar `/api/alerts?counts=true` kan een 500 teruggeven. De hook moet dit afvangen.

**Step 1: Update de fetchCounts functie**

Vervang de huidige `fetchCounts`:

```typescript
const fetchCounts = useCallback(async () => {
  try {
    const res = await fetch('/api/alerts?counts=true')
    if (!res.ok) {
      // Table might not exist yet - silently degrade
      setUnreadCount(0)
      return
    }
    const data = await res.json()
    setUnreadCount(data.new || 0)
  } catch {
    // Network error or table doesn't exist - silently degrade
    setUnreadCount(0)
  }
}, [])
```

**Step 2: Build check**

```bash
cd command-center-app && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add command-center-app/src/hooks/useRealtimeAlerts.ts
git commit -m "fix: graceful degradation in useRealtimeAlerts when alerts table missing"
```

---

### Task 6: CommandPanel met werkende acties

**Files:**
- Modify: `command-center-app/src/components/shell/CommandPanel.tsx`

**Probleem:** CommandPanel maakt job_queue entries aan maar voert ze niet uit. Deep Scan en Health Check kunnen WEL vanuit de browser getriggerd worden.

**Step 1: Update de actions array en executeAction functie**

De 4 acties moeten naast het aanmaken van een job ook de daadwerkelijke actie triggeren:

- **Sync Registry**: Kan niet vanuit browser (vereist lokale bestanden). Toon melding.
- **Deep Scan**: POST naar `/api/sync/deep-scan` triggert een scan.
- **Health Check**: POST naar Supabase Edge Function `health-check`.
- **Code Analyse**: Kan niet vanuit browser (vereist MCP server). Toon melding.

Update de `executeAction` functie:

```typescript
const executeAction = async (actionId: string) => {
  setRunning(actionId)
  setResult(null)

  try {
    // Create job entry
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: actionId }),
    })

    // Execute the actual action
    let actionResult: string

    switch (actionId) {
      case 'registry_sync':
        actionResult = 'Sync vereist lokale toegang. Gebruik /sync-cc in Claude Code.'
        break

      case 'deep_scan': {
        const res = await fetch('/api/sync/deep-scan', { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          actionResult = `Deep Scan voltooid: ${data.stats?.relationships || 0} relaties gevonden`
        } else {
          actionResult = 'Deep Scan mislukt'
        }
        break
      }

      case 'health_check': {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl) {
          const res = await fetch(`${supabaseUrl}/functions/v1/health-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          })
          if (res.ok) {
            const data = await res.json()
            actionResult = `Health Check: ${data.new_alerts || 0} nieuwe alerts`
          } else {
            actionResult = 'Health Check mislukt'
          }
        } else {
          actionResult = 'Supabase URL niet geconfigureerd'
        }
        break
      }

      case 'code_analysis':
        actionResult = 'Code Analyse vereist MCP server. Gebruik /analyze in Claude Code.'
        break

      default:
        actionResult = 'Onbekende actie'
    }

    setResult(actionResult)
  } catch {
    setResult('Actie mislukt')
  } finally {
    setRunning(null)
    setTimeout(() => setResult(null), 5000)
  }
}
```

**Step 2: Build check**

```bash
cd command-center-app && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add command-center-app/src/components/shell/CommandPanel.tsx
git commit -m "feat: CommandPanel executes real actions for deep scan and health check"
```

---

## Fase 3: Data Pipeline Completering

### Task 7: Vul entity_versions bij sync

**Files:**
- Modify: `command-center-app/src/app/api/sync/route.ts`

**Probleem:** De `entity_versions` tabel is leeg, waardoor de Timeline view op de Intelligence Map niet werkt. De sync route detecteert al changes (added/removed items) maar schrijft ze niet naar `entity_versions`.

**Step 1: Voeg entity_versions insert toe na changelog entries**

In de sync route POST handler, na de changelog insert sectie (rond regel 194), voeg toe:

```typescript
// Create entity_version entries for Timeline view
const versionEntries = []
for (const [project, changes] of changesByProject) {
  if (changes.added.length > 0) {
    versionEntries.push({
      entity_type: 'project',
      entity_id: project.toLowerCase().replace(/\s+/g, '-'),
      version: new Date().toISOString().slice(0, 10),
      change_type: 'added',
      title: `${changes.added.length} ${type}(s) toegevoegd`,
      description: changes.added.join(', '),
      items_changed: changes.added.map(name => ({ name, type, action: 'added' })),
      detected_by: 'sync',
    })
  }
  if (changes.removed.length > 0) {
    versionEntries.push({
      entity_type: 'project',
      entity_id: project.toLowerCase().replace(/\s+/g, '-'),
      version: new Date().toISOString().slice(0, 10),
      change_type: 'removed',
      title: `${changes.removed.length} ${type}(s) verwijderd`,
      description: changes.removed.join(', '),
      items_changed: changes.removed.map(name => ({ name, type, action: 'removed' })),
      detected_by: 'sync',
    })
  }
}

if (versionEntries.length > 0) {
  await supabase.from('entity_versions').insert(versionEntries)
}
```

**Step 2: Build check**

```bash
cd command-center-app && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add command-center-app/src/app/api/sync/route.ts
git commit -m "feat: populate entity_versions during sync for Timeline view"
```

---

### Task 8: Sync script met job_queue integratie

**Files:**
- Modify: `command-center-app/scripts/sync-registry.mjs`

**Probleem:** Het sync script maakt geen job_queue entry aan. Hierdoor weet de SyncStatus indicator niet wanneer een sync gedraaid is, en de database trigger voor health check wordt niet getriggerd.

**Step 1: Voeg job_queue integratie toe**

Voeg na de `main()` functie start (na het summary gedeelte) job tracking toe:

```javascript
async function main() {
  if (!API_KEY) {
    console.error('ERROR: SYNC_API_KEY environment variable is required')
    console.error('Usage: SYNC_API_KEY="your-key" node scripts/sync-registry.mjs')
    process.exit(1)
  }

  console.log(`\nSync Registry -> CC v2`)
  console.log(`Source: ${REGISTRY_DIR}`)
  console.log(`Target: ${API_BASE}/api/sync`)
  console.log('---')

  // Create job entry
  let jobId = null
  try {
    const jobRes = await fetch(`${API_BASE}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ type: 'registry_sync' }),
    })
    if (jobRes.ok) {
      const jobData = await jobRes.json()
      jobId = jobData.id
      console.log(`Job created: ${jobId}`)
    }
  } catch {
    console.log('  [WARN] Could not create job entry (jobs table may not exist)')
  }

  let files
  try {
    files = readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.json'))
  } catch (err) {
    console.error(`ERROR: Cannot read ${REGISTRY_DIR}: ${err.message}`)
    process.exit(1)
  }

  const results = []
  const startTime = Date.now()

  for (const filename of files) {
    const type = TYPE_MAP[filename]
    if (!type) {
      console.log(`  [SKIP] ${filename}: unknown type`)
      continue
    }
    const result = await syncType(filename, type)
    results.push(result)
  }

  const duration = Date.now() - startTime

  console.log('\n--- Summary ---')
  const ok = results.filter(r => r.status === 'ok')
  const failed = results.filter(r => r.status === 'error')
  const skipped = results.filter(r => r.status === 'skipped')
  const totalItems = ok.reduce((sum, r) => sum + (r.count || 0), 0)

  console.log(`Synced: ${ok.length} types, ${totalItems} total items`)
  console.log(`Duration: ${duration}ms`)
  if (skipped.length) console.log(`Skipped: ${skipped.length} types`)
  if (failed.length) console.log(`Failed: ${failed.length} types`)

  // Update job status (triggers health check via DB trigger)
  if (jobId) {
    try {
      await fetch(`${API_BASE}/api/jobs`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          id: jobId,
          status: failed.length > 0 ? 'failed' : 'completed',
          result: { types_ok: ok.length, types_failed: failed.length, total_items: totalItems },
          duration_ms: duration,
        }),
      })
      console.log('Job status updated')
    } catch {
      console.log('  [WARN] Could not update job status')
    }
  }

  process.exit(failed.length > 0 ? 1 : 0)
}
```

**Step 2: Voeg PATCH support toe aan jobs API route**

De huidige jobs route heeft alleen GET en POST. Voeg PATCH toe voor job status updates:

**File:** `command-center-app/src/app/api/jobs/route.ts`

Voeg toe:

```typescript
// PATCH /api/jobs - Update job status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, result, duration_ms, error } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    const updateData: Record<string, unknown> = { status }
    if (result) updateData.result = result
    if (error) updateData.error = error
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }
    if (status === 'running') {
      updateData.started_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('job_queue')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Update sync_status when job completes
    if (status === 'completed' || status === 'failed') {
      const jobType = body.type || 'registry_sync'
      await supabase.from('sync_status').update({
        status: status === 'completed' ? 'success' : 'failed',
        last_run_at: new Date().toISOString(),
        duration_ms: duration_ms || null,
        items_processed: result?.total_items || 0,
        next_run_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      }).eq('id', jobType === 'registry_sync' ? 'registry_sync' :
             jobType === 'deep_scan' ? 'deep_scan' :
             jobType === 'health_check' ? 'health_check' : 'registry_sync')
    }

    return NextResponse.json({ success: true, id, status })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Build check**

```bash
cd command-center-app && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add command-center-app/scripts/sync-registry.mjs command-center-app/src/app/api/jobs/route.ts
git commit -m "feat: sync script creates job entries, add PATCH to jobs API"
```

---

### Task 9: Health-check detecteert stale sync

**Files:**
- Modify: `supabase/functions/health-check/index.ts`

**Probleem:** De health-check controleert niet of de laatste sync te lang geleden is. Als Shadow vergeet te syncen, moet er een alert komen.

**Step 1: Voeg stale sync check toe**

Voeg na Check 4 (Failed sync jobs) een nieuwe check toe:

```typescript
// Check 5: Stale sync (> 24 uur geleden)
const { data: syncStatus } = await supabase
  .from('sync_status')
  .select('last_run_at')
  .eq('id', 'registry_sync')
  .single()

if (syncStatus?.last_run_at) {
  const lastSync = new Date(syncStatus.last_run_at).getTime()
  const hoursAgo = (Date.now() - lastSync) / (1000 * 60 * 60)

  if (hoursAgo > 24) {
    newAlerts.push({
      type: 'sync_stale',
      severity: 'warning',
      title: `Registry sync is ${Math.floor(hoursAgo)} uur oud`,
      description: 'De laatste sync was meer dan 24 uur geleden. Draai /sync-cc in Claude Code of gebruik de Command Panel.',
      entity_type: 'system',
      entity_id: 'registry_sync',
      metadata: { hours_ago: Math.floor(hoursAgo), last_sync: syncStatus.last_run_at },
    })
  }
} else {
  // Nooit gesynchroniseerd
  newAlerts.push({
    type: 'sync_stale',
    severity: 'info',
    title: 'Nog nooit gesynchroniseerd',
    description: 'Draai /sync-cc in Claude Code om je registry te synchroniseren.',
    entity_type: 'system',
    entity_id: 'registry_sync',
    metadata: { never_synced: true },
  })
}
```

Voeg `'sync_stale'` toe aan de auto-resolve types array (rond regel 143):

```typescript
.in('type', ['unhealthy_project', 'stale_asset', 'orphan_detected', 'sync_failed', 'sync_stale'])
```

**Step 2: Commit**

```bash
git add supabase/functions/health-check/index.ts
git commit -m "feat: health-check detects stale sync (>24h) and missing sync"
```

---

## Fase 4: Edge Function Deployment

### Task 10: Installeer Supabase CLI en link project

**Step 1: Check of Supabase CLI al geinstalleerd is**

```bash
supabase --version
```

Als niet geinstalleerd:

```bash
npm install -g supabase
```

**Step 2: Login bij Supabase**

```bash
supabase login
```

Dit opent een browser voor authenticatie.

**Step 3: Link project**

```bash
cd /c/Users/Shadow/Projects/command-center-v2
supabase link --project-ref ikpmlhmbooaxfrlpzcfa
```

**Step 4: Verifieer**

```bash
supabase status
```

---

### Task 11: Deploy Edge Functions + set secrets

**Step 1: Deploy alle 3 Edge Functions**

```bash
supabase functions deploy health-check --no-verify-jwt
supabase functions deploy sync-trigger --no-verify-jwt
supabase functions deploy alert-digest --no-verify-jwt
```

Noot: `--no-verify-jwt` omdat pg_cron geen JWT meestuurt. De functies authenticeren zelf via service role key.

**Step 2: Set secrets**

```bash
supabase secrets set APP_URL=https://command-center-app-nine.vercel.app
supabase secrets set SYNC_API_KEY=09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f
```

Noot: `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` worden automatisch beschikbaar gesteld door Supabase aan Edge Functions.

**Step 3: Test health-check**

```bash
supabase functions invoke health-check --body '{}'
```

Verwacht: JSON response met `success: true`.

**Step 4: Test sync-trigger**

```bash
supabase functions invoke sync-trigger --body '{}'
```

Verwacht: JSON response met sync status.

---

### Task 12: Activeer pg_cron schedules

**Prerequisite:** pg_cron en pg_net extensions moeten actief zijn.

**Step 1: Enable extensions**

Ga naar Supabase Dashboard → Database → Extensions → Zoek en enable:
- `pg_cron`
- `pg_net`

**Step 2: Run cron schedules**

In SQL Editor, run:

```sql
-- Elke 6 uur: status check + health check
SELECT cron.schedule(
  'health-check-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check',
    body := '{}'::jsonb,
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb
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
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

**BELANGRIJK:** Vervang `<SERVICE_ROLE_KEY>` met de echte service role key.

**Step 3: Verifieer**

```sql
SELECT * FROM cron.job;
```

Verwacht: 2 rijen (health-check-6h, daily-digest).

---

## Fase 5: Claude Code Session Hook

### Task 13: Configureer auto-sync bij sessie-einde

**Files:**
- Modify: `C:\Users\Shadow\.claude\settings.json` (of equivalent hooks locatie)

**Doel:** Bij elke Claude Code sessie-einde automatisch de registry syncen naar Command Center.

**Step 1: Bepaal hook configuratie locatie**

Claude Code hooks worden geconfigureerd in `~/.claude/settings.json` onder de `hooks` key:

```json
{
  "hooks": {
    "PostToolUse": [],
    "Stop": [
      {
        "matcher": "",
        "command": "node C:/Users/Shadow/Projects/command-center-v2/command-center-app/scripts/sync-registry.mjs"
      }
    ]
  }
}
```

Noot: De `SYNC_API_KEY` moet als environment variable beschikbaar zijn. Voeg toe aan Shadow's shell profile:

```bash
export SYNC_API_KEY="09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f"
```

**Step 2: Test de hook**

Sluit een Claude Code sessie en verifieer:
- In Supabase: `SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 5;`
- Op dashboard: Check of SyncStatus indicator updated is

**Alternatief:** Als hooks niet beschikbaar zijn, maak een npm script:

In `command-center-app/package.json`, voeg toe:

```json
{
  "scripts": {
    "sync": "SYNC_API_KEY=$SYNC_API_KEY node scripts/sync-registry.mjs"
  }
}
```

Dan handmatig: `cd command-center-app && npm run sync`

---

## Fase 6: Verificatie & Deploy

### Task 14: Run volledige sync + deep scan

**Step 1: Run registry sync**

```bash
cd /c/Users/Shadow/Projects/command-center-v2/command-center-app
SYNC_API_KEY="09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" node scripts/sync-registry.mjs
```

Verwacht: 6 types gesynchroniseerd (agents, commands, skills, prompts, apis, instructions).

**Step 2: Verifieer sync data**

In Supabase SQL Editor:
```sql
SELECT type, COUNT(*) FROM registry_items GROUP BY type ORDER BY type;
```

**Step 3: Verifieer entity_versions**

```sql
SELECT * FROM entity_versions ORDER BY detected_at DESC LIMIT 10;
```

Verwacht: Entries voor elke change gedetecteerd door sync.

**Step 4: Verifieer job_queue**

```sql
SELECT * FROM job_queue ORDER BY created_at DESC LIMIT 5;
```

Verwacht: Een `registry_sync` job met status `completed`.

---

### Task 15: Trigger health check + verifieer alerts

**Step 1: Trigger health check via Edge Function**

```bash
supabase functions invoke health-check --body '{}'
```

OF via dashboard Command Panel (Cmd+J → Health Check).

**Step 2: Verifieer alerts**

```sql
SELECT type, severity, title, status FROM alerts ORDER BY created_at DESC LIMIT 10;
```

Verwacht: Alerts gebaseerd op huidige staat (mogelijk: stale assets, orphan assets, sync stale).

**Step 3: Check dashboard**

Open https://command-center-app-nine.vercel.app:
- NotificationBell moet badge tonen
- AttentionSection op homepage moet alerts tonen
- `/alerts` pagina moet alerts lijst tonen

---

### Task 16: Verifieer Realtime + dashboard componenten

**Step 1: Open dashboard in browser**

Ga naar https://command-center-app-nine.vercel.app

**Step 2: Check NotificationBell**

- Klik op het bel-icoon in de sidebar
- Dropdown moet recente alerts tonen
- Badge count moet kloppen

**Step 3: Check SyncStatus**

- In sidebar (desktop) moet een gekleurd bolletje zichtbaar zijn
- Hover toont "Gesynchroniseerd X geleden"

**Step 4: Check CommandPanel**

- Druk Cmd+J (of Ctrl+J)
- Panel opent met 4 acties
- Klik "Health Check" — moet resultaat tonen

**Step 5: Check Alerts pagina**

- Navigeer naar `/alerts`
- Filter chips moeten werken (Alles/Kritiek/Waarschuwing/Info)
- Status tabs moeten werken (Open/Opgelost/Genegeerd)

**Step 6: Check Realtime**

- Houd dashboard open
- In SQL Editor, insert een test alert:
```sql
INSERT INTO alerts (type, severity, title, description)
VALUES ('test', 'info', 'Test alert', 'Dit is een test');
```
- Dashboard NotificationBell moet live updaten (badge +1)
- Verwijder de test alert:
```sql
DELETE FROM alerts WHERE type = 'test';
```

---

### Task 17: Commit alle wijzigingen + deploy

**Step 1: Check git status**

```bash
cd /c/Users/Shadow/Projects/command-center-v2
git status
```

**Step 2: Stage en commit**

```bash
git add -A
git commit -m "feat: Observer + Actor activatie - RLS, types, graceful degradation, entity_versions, job tracking"
```

**Step 3: Push**

```bash
git push origin master
```

**Step 4: Deploy naar Vercel**

```bash
cd command-center-app && npx vercel --prod --yes
```

Verwacht: Build slaagt, alle routes zichtbaar.

---

### Task 18: Update STATUS.md

**Files:**
- Modify: `STATUS.md`

**Step 1: Voeg Observer + Actor sectie toe**

Voeg toe na de Intelligence Map Features sectie:

```markdown
## Observer + Actor (live)

| Component | Status | Details |
|-----------|--------|---------|
| Database tabellen | Live | alerts, job_queue, sync_status + RLS |
| Realtime | Live | alerts tabel subscribed |
| Edge Functions | Live | health-check, sync-trigger, alert-digest |
| pg_cron | Live | Health check elke 6u, digest elke ochtend 7:00 |
| NotificationBell | Live | Realtime badge + dropdown |
| SyncStatus | Live | Polling elke 60s, groene/amber/rode stip |
| CommandPanel | Live | Cmd+J, 4 acties |
| AttentionSection | Live | Homepage critical/warning alerts |
| Alerts pagina | Live | /alerts met filters en bulk acties |
| Session Hook | Live | Auto-sync bij sessie-einde |
```

Update het "Volgende Stappen" gedeelte:

```markdown
## Volgende Stappen (suggesties)

- [ ] Test framework opzetten (Vitest + React Testing Library)
- [ ] Alert email notificaties (via Supabase Edge Function)
- [ ] Bookmark pin/unpin knop toevoegen aan DetailPanel
- [ ] Usage statistics automatisch vullen
- [ ] Service costs tracking integratie
```

**Step 2: Commit**

```bash
git add STATUS.md
git commit -m "docs: update STATUS.md with Observer + Actor activation status"
git push origin master
```

---

## Samenvatting

| Fase | Tasks | Type |
|------|-------|------|
| 1. Database Activatie | 1-2 | Supabase SQL (handmatig) |
| 2. Code Hardening | 3-6 | Code wijzigingen |
| 3. Data Pipeline | 7-9 | Code wijzigingen |
| 4. Edge Functions | 10-12 | CLI + Supabase (handmatig) |
| 5. Claude Code Hook | 13 | Configuratie |
| 6. Verificatie | 14-18 | Test + deploy |

**Totaal:** 18 tasks, ~6 code wijzigingen + 5 handmatige Supabase stappen + 5 verificatie/deploy stappen.
