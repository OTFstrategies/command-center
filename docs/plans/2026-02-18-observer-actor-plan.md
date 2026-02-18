# Observer + Actor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Command Center v2 transformeren naar een levend, actionable dashboard met automatische sync (pg_cron + Edge Functions), real-time alerts (Supabase Realtime), en een command panel voor directe acties.

**Architecture:** Drie Supabase Edge Functions (sync-trigger, health-check, alert-digest) draaien op schema via pg_cron. Health checks genereren alerts in een nieuwe `alerts` tabel. Het dashboard ontvangt real-time updates via Supabase Realtime websocket en toont ze in een notification bell, alerts pagina, en homepage attention sectie. Een command panel (Cmd+J) biedt directe acties.

**Tech Stack:** Next.js 14 (bestaand), Supabase Pro (Edge Functions, pg_cron, pg_net, Realtime), Tailwind CSS v4 (zinc palette), Lucide React, Framer Motion

---

## Task 1: Database Migration — Nieuwe Tabellen

**Files:**
- Create: `supabase/migrations/20260218_observer_actor.sql`

**Step 1: Write the migration SQL**

```sql
-- Observer + Actor: alerts, job_queue, sync_status

-- Alerts tabel
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- Job Queue tabel
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}',
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  error TEXT
);

CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_type ON job_queue(type);

-- Sync Status tabel
CREATE TABLE IF NOT EXISTS sync_status (
  id TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'idle',
  duration_ms INTEGER,
  items_processed INTEGER DEFAULT 0,
  next_run_at TIMESTAMPTZ
);

-- Seed sync_status met initiele records
INSERT INTO sync_status (id, status) VALUES
  ('registry_sync', 'idle'),
  ('deep_scan', 'idle'),
  ('health_check', 'idle')
ON CONFLICT (id) DO NOTHING;

-- Database Trigger: na sync complete → queue health check
CREATE OR REPLACE FUNCTION queue_health_check()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.type = 'registry_sync' THEN
    INSERT INTO job_queue (type, status, payload)
    VALUES ('health_check', 'pending', '{}');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_sync_complete
  AFTER UPDATE ON job_queue
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.type = 'registry_sync')
  EXECUTE FUNCTION queue_health_check();

-- Enable Realtime voor alerts
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
```

**Step 2: Apply migration via Supabase dashboard**

Run: Open Supabase Dashboard → SQL Editor → Paste and execute the migration

Expected: Tables `alerts`, `job_queue`, `sync_status` created. Trigger `after_sync_complete` active. `alerts` tabel in Realtime publication.

**Step 3: Verify tables exist**

Run in SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('alerts', 'job_queue', 'sync_status');
```

Expected: 3 rows returned

**Step 4: Commit**

```bash
git add supabase/migrations/20260218_observer_actor.sql
git commit -m "feat: add alerts, job_queue, sync_status tables with triggers"
```

---

## Task 2: Server Lib — alerts.ts

**Files:**
- Create: `command-center-app/src/lib/alerts.ts`

**Step 1: Create alerts lib with query functions**

```typescript
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

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
  critical: number
  warning: number
  info: number
  new: number
}

export async function getAlerts(options?: {
  status?: string
  severity?: string
  limit?: number
}): Promise<Alert[]> {
  const supabase = getSupabase()
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit || 50)

  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }

  const { data } = await query
  return (data || []) as Alert[]
}

export async function getAlertCounts(): Promise<AlertCounts> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('alerts')
    .select('severity, status')
    .in('status', ['new', 'acknowledged'])

  const alerts = data || []
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    new: alerts.filter(a => a.status === 'new').length,
  }
}

export async function updateAlertStatus(
  id: string,
  status: 'acknowledged' | 'resolved' | 'dismissed'
): Promise<void> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = { status }
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString()
  }
  await supabase.from('alerts').update(update).eq('id', id)
}

export async function bulkUpdateAlerts(
  ids: string[],
  status: 'acknowledged' | 'resolved' | 'dismissed'
): Promise<void> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = { status }
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString()
  }
  await supabase.from('alerts').update(update).in('id', ids)
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/lib/alerts.ts
git commit -m "feat: add alerts lib with query and update functions"
```

---

## Task 3: Server Lib — jobs.ts

**Files:**
- Create: `command-center-app/src/lib/jobs.ts`

**Step 1: Create jobs lib**

```typescript
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface Job {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  error: string | null
}

export interface SyncStatus {
  id: string
  last_run_at: string | null
  status: string
  duration_ms: number | null
  items_processed: number
  next_run_at: string | null
}

export async function getSyncStatuses(): Promise<SyncStatus[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('sync_status')
    .select('*')
    .order('id')
  return (data || []) as SyncStatus[]
}

export async function getRecentJobs(limit = 10): Promise<Job[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('job_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data || []) as Job[]
}

export async function createJob(
  type: string,
  payload: Record<string, unknown> = {}
): Promise<Job> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('job_queue')
    .insert({ type, status: 'pending', payload })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Job
}

export async function updateJob(
  id: string,
  updates: Partial<Pick<Job, 'status' | 'result' | 'error' | 'started_at' | 'completed_at'>>
): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('job_queue').update(updates).eq('id', id)
}

export async function updateSyncStatus(
  id: string,
  updates: Partial<Omit<SyncStatus, 'id'>>
): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('sync_status').update(updates).eq('id', id)
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/lib/jobs.ts
git commit -m "feat: add jobs lib with queue and sync status functions"
```

---

## Task 4: API Route — Alerts CRUD

**Files:**
- Create: `command-center-app/src/app/api/alerts/route.ts`

**Step 1: Create alerts API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAlerts, getAlertCounts, updateAlertStatus, bulkUpdateAlerts } from '@/lib/alerts'

// GET /api/alerts — Get alerts with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const severity = searchParams.get('severity') || undefined
    const counts = searchParams.get('counts')

    if (counts === 'true') {
      const alertCounts = await getAlertCounts()
      return NextResponse.json(alertCounts)
    }

    const alerts = await getAlerts({ status, severity })
    return NextResponse.json({ alerts })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/alerts — Update alert status (single or bulk)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ids, status } = body as {
      id?: string
      ids?: string[]
      status: 'acknowledged' | 'resolved' | 'dismissed'
    }

    if (!status) {
      return NextResponse.json({ error: 'status required' }, { status: 400 })
    }

    if (ids && ids.length > 0) {
      await bulkUpdateAlerts(ids, status)
      return NextResponse.json({ success: true, updated: ids.length })
    } else if (id) {
      await updateAlertStatus(id, status)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'id or ids required' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/app/api/alerts/route.ts
git commit -m "feat: add alerts API route with GET and PATCH"
```

---

## Task 5: API Route — Jobs

**Files:**
- Create: `command-center-app/src/app/api/jobs/route.ts`

**Step 1: Create jobs API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSyncStatuses, getRecentJobs, createJob } from '@/lib/jobs'

// GET /api/jobs — Get sync statuses and recent jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')

    if (view === 'status') {
      const statuses = await getSyncStatuses()
      return NextResponse.json({ statuses })
    }

    const jobs = await getRecentJobs()
    return NextResponse.json({ jobs })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/jobs — Create a new job (trigger action)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, payload } = body as { type: string; payload?: Record<string, unknown> }

    if (!type) {
      return NextResponse.json({ error: 'type required' }, { status: 400 })
    }

    const validTypes = ['registry_sync', 'deep_scan', 'health_check', 'code_analysis']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Valid: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const job = await createJob(type, payload || {})
    return NextResponse.json({ success: true, job })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/app/api/jobs/route.ts
git commit -m "feat: add jobs API route for sync status and job creation"
```

---

## Task 6: Supabase Edge Function — health-check

**Files:**
- Create: `supabase/functions/health-check/index.ts`

**Step 1: Initialize Supabase functions directory**

Run: `mkdir -p supabase/functions/health-check`

**Step 2: Create the health-check Edge Function**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update sync_status
    await supabase.from('sync_status').update({
      status: 'running',
      last_run_at: new Date().toISOString(),
    }).eq('id', 'health_check')

    const startTime = Date.now()
    const newAlerts: Array<{
      type: string
      severity: string
      title: string
      description: string
      entity_type: string
      entity_id: string
      metadata: Record<string, unknown>
    }> = []

    // Check 1: Unhealthy projects (project_metrics with health != 'healthy')
    const { data: metrics } = await supabase
      .from('project_metrics')
      .select('project_slug, health, error_count, warning_count')

    for (const m of metrics || []) {
      if (m.health === 'unhealthy' || (m.error_count && m.error_count > 10)) {
        newAlerts.push({
          type: 'unhealthy_project',
          severity: 'critical',
          title: `Project "${m.project_slug}" is unhealthy`,
          description: `${m.error_count || 0} errors, ${m.warning_count || 0} warnings gevonden. Draai een code analyse om details te zien.`,
          entity_type: 'project',
          entity_id: m.project_slug,
          metadata: { health: m.health, errors: m.error_count, warnings: m.warning_count },
        })
      } else if (m.health === 'needs-attention') {
        newAlerts.push({
          type: 'unhealthy_project',
          severity: 'warning',
          title: `Project "${m.project_slug}" heeft aandacht nodig`,
          description: `${m.warning_count || 0} warnings gevonden. Bekijk de Health tab voor details.`,
          entity_type: 'project',
          entity_id: m.project_slug,
          metadata: { health: m.health, warnings: m.warning_count },
        })
      }
    }

    // Check 2: Stale assets (registry_items not updated in 30+ days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: staleCount } = await supabase
      .from('registry_items')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', thirtyDaysAgo)

    if (staleCount && staleCount > 10) {
      newAlerts.push({
        type: 'stale_asset',
        severity: 'warning',
        title: `${staleCount} assets niet bijgewerkt in 30+ dagen`,
        description: 'Overweeg een registry sync of verwijder ongebruikte assets.',
        entity_type: 'asset',
        entity_id: 'bulk',
        metadata: { stale_count: staleCount },
      })
    }

    // Check 3: Orphan assets (registry_items without project)
    const { count: orphanCount } = await supabase
      .from('registry_items')
      .select('*', { count: 'exact', head: true })
      .or('project.is.null,project.eq.global')

    if (orphanCount && orphanCount > 20) {
      newAlerts.push({
        type: 'orphan_detected',
        severity: 'info',
        title: `${orphanCount} assets zonder project koppeling`,
        description: 'Deze assets zijn "global" of hebben geen project. Overweeg ze aan een project te koppelen.',
        entity_type: 'asset',
        entity_id: 'bulk',
        metadata: { orphan_count: orphanCount },
      })
    }

    // Check 4: Failed sync jobs
    const { data: failedJobs } = await supabase
      .from('job_queue')
      .select('id, type, error, created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (failedJobs && failedJobs.length > 0) {
      const job = failedJobs[0]
      newAlerts.push({
        type: 'sync_failed',
        severity: 'critical',
        title: `Laatste ${job.type} is mislukt`,
        description: job.error || 'Onbekende fout. Probeer handmatig opnieuw.',
        entity_type: 'job',
        entity_id: job.id,
        metadata: { job_type: job.type, job_id: job.id },
      })
    }

    // Deduplicate: don't create alerts that already exist (open, same type+entity_id)
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('type, entity_id')
      .in('status', ['new', 'acknowledged'])

    const existingKeys = new Set(
      (existingAlerts || []).map(a => `${a.type}:${a.entity_id}`)
    )

    const deduped = newAlerts.filter(
      a => !existingKeys.has(`${a.type}:${a.entity_id}`)
    )

    // Auto-resolve: close alerts where condition no longer applies
    const activeAlertTypes = new Set(newAlerts.map(a => `${a.type}:${a.entity_id}`))
    const { data: toResolve } = await supabase
      .from('alerts')
      .select('id, type, entity_id')
      .in('status', ['new', 'acknowledged'])
      .in('type', ['unhealthy_project', 'stale_asset', 'orphan_detected', 'sync_failed'])

    const resolveIds = (toResolve || [])
      .filter(a => !activeAlertTypes.has(`${a.type}:${a.entity_id}`))
      .map(a => a.id)

    if (resolveIds.length > 0) {
      await supabase.from('alerts').update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      }).in('id', resolveIds)
    }

    // Insert new alerts
    if (deduped.length > 0) {
      await supabase.from('alerts').insert(deduped)
    }

    const duration = Date.now() - startTime

    // Update sync_status
    await supabase.from('sync_status').update({
      status: 'success',
      duration_ms: duration,
      items_processed: deduped.length,
    }).eq('id', 'health_check')

    return new Response(
      JSON.stringify({
        success: true,
        new_alerts: deduped.length,
        auto_resolved: resolveIds.length,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 3: Commit**

```bash
git add supabase/functions/health-check/index.ts
git commit -m "feat: add health-check Edge Function with 4 alert checks"
```

---

## Task 7: Supabase Edge Function — sync-trigger

**Files:**
- Create: `supabase/functions/sync-trigger/index.ts`

**Step 1: Create the sync-trigger Edge Function**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const appUrl = Deno.env.get('APP_URL') ?? 'https://command-center-app-nine.vercel.app'
    const syncApiKey = Deno.env.get('SYNC_API_KEY') ?? ''

    // Create job entry
    const { data: job } = await supabase
      .from('job_queue')
      .insert({ type: 'registry_sync', status: 'running', started_at: new Date().toISOString() })
      .select()
      .single()

    // Update sync_status
    await supabase.from('sync_status').update({
      status: 'running',
      last_run_at: new Date().toISOString(),
    }).eq('id', 'registry_sync')

    const startTime = Date.now()

    // Call the Next.js sync API to get current status
    const statusRes = await fetch(`${appUrl}/api/sync`, {
      method: 'GET',
      headers: { 'x-api-key': syncApiKey },
    })

    const statusData = await statusRes.json()
    const duration = Date.now() - startTime

    // Update job as completed
    if (job) {
      await supabase.from('job_queue').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: statusData,
      }).eq('id', job.id)
    }

    // Update sync_status
    await supabase.from('sync_status').update({
      status: 'success',
      duration_ms: duration,
      items_processed: Object.values(statusData.stats || {}).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0),
      next_run_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    }).eq('id', 'registry_sync')

    // Trigger health check
    const healthRes = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/health-check`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      }
    )

    const healthData = await healthRes.json()

    return new Response(
      JSON.stringify({
        success: true,
        sync: statusData,
        health: healthData,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 2: Commit**

```bash
git add supabase/functions/sync-trigger/index.ts
git commit -m "feat: add sync-trigger Edge Function for cron-based sync"
```

---

## Task 8: Supabase Edge Function — alert-digest

**Files:**
- Create: `supabase/functions/alert-digest/index.ts`

**Step 1: Create the alert-digest Edge Function**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Count open alerts by severity
    const { data: openAlerts } = await supabase
      .from('alerts')
      .select('severity, status')
      .in('status', ['new', 'acknowledged'])

    const alerts = openAlerts || []
    const critical = alerts.filter(a => a.severity === 'critical').length
    const warning = alerts.filter(a => a.severity === 'warning').length
    const info = alerts.filter(a => a.severity === 'info').length

    // Auto-resolve info alerts older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: oldInfoAlerts } = await supabase
      .from('alerts')
      .select('id')
      .eq('severity', 'info')
      .in('status', ['new', 'acknowledged'])
      .lt('created_at', sevenDaysAgo)

    if (oldInfoAlerts && oldInfoAlerts.length > 0) {
      await supabase.from('alerts').update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      }).in('id', oldInfoAlerts.map(a => a.id))
    }

    // Create daily digest alert (if there are open alerts)
    if (alerts.length > 0) {
      // Remove previous digest alerts
      await supabase.from('alerts')
        .delete()
        .eq('type', 'daily_digest')
        .in('status', ['new'])

      const parts = []
      if (critical > 0) parts.push(`${critical} kritiek`)
      if (warning > 0) parts.push(`${warning} waarschuwing${warning > 1 ? 'en' : ''}`)
      if (info > 0) parts.push(`${info} info`)

      await supabase.from('alerts').insert({
        type: 'daily_digest',
        severity: critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'info',
        title: `Dagelijks overzicht: ${parts.join(', ')}`,
        description: `Er ${alerts.length === 1 ? 'is' : 'zijn'} ${alerts.length} openstaande alert${alerts.length > 1 ? 's' : ''}. Bekijk de alerts pagina voor details.`,
        entity_type: 'system',
        entity_id: 'digest',
        metadata: { critical, warning, info, total: alerts.length },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        open_alerts: alerts.length,
        auto_resolved: oldInfoAlerts?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 2: Commit**

```bash
git add supabase/functions/alert-digest/index.ts
git commit -m "feat: add alert-digest Edge Function for daily summaries"
```

---

## Task 9: pg_cron Schedules

**Files:**
- Create: `supabase/migrations/20260218_cron_schedules.sql`

**Step 1: Write cron schedule migration**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Elke 6 uur: trigger sync
SELECT cron.schedule(
  'sync-every-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-trigger',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Elke ochtend 7:00 UTC: daily digest
SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/alert-digest',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

**Step 2: Apply via Supabase SQL Editor**

Note: pg_cron is only available on Supabase Pro. The `app.settings` vars must be set in the Supabase dashboard under Database → Extensions → pg_cron, or use hardcoded URLs.

Als `app.settings` niet werkt, vervang met directe URLs:
```sql
SELECT net.http_post(
  url := 'https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/sync-trigger',
  ...
);
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260218_cron_schedules.sql
git commit -m "feat: add pg_cron schedules for sync and digest"
```

---

## Task 10: React Hook — useRealtimeAlerts

**Files:**
- Create: `command-center-app/src/hooks/useRealtimeAlerts.ts`

**Step 1: Create realtime alerts hook**

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeAlert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  status: string
  created_at: string
}

export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch initial counts
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?counts=true')
      const data = await res.json()
      setUnreadCount(data.new || 0)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchCounts()

    const supabase = createClient()
    let channel: RealtimeChannel

    channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const newAlert = payload.new as RealtimeAlert
          setAlerts((prev) => [newAlert, ...prev].slice(0, 10))
          setUnreadCount((prev) => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'alerts' },
        (payload) => {
          const updated = payload.new as RealtimeAlert
          setAlerts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          )
          // Recount
          fetchCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCounts])

  const markRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return { alerts, unreadCount, markRead, refetch: fetchCounts }
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/hooks/useRealtimeAlerts.ts
git commit -m "feat: add useRealtimeAlerts hook for live alert updates"
```

---

## Task 11: Component — NotificationBell

**Files:**
- Create: `command-center-app/src/components/shell/NotificationBell.tsx`

**Step 1: Create notification bell component**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts'
import Link from 'next/link'

const severityConfig = {
  critical: { icon: AlertTriangle, class: 'text-red-500' },
  warning: { icon: AlertCircle, class: 'text-amber-500' },
  info: { icon: Info, class: 'text-zinc-400' },
}

export function NotificationBell() {
  const { alerts, unreadCount, markRead } = useRealtimeAlerts()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    setOpen(!open)
    if (!open) markRead()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
        aria-label="Alerts"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-200/50 bg-white/95 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95 z-50">
          <div className="flex items-center justify-between border-b border-zinc-200/50 px-4 py-3 dark:border-zinc-800/50">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Alerts</span>
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Bekijk alles
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-400">
                Geen recente alerts
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => {
                const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info
                const Icon = config.icon
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.class}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {alert.title}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(alert.created_at).toLocaleString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/components/shell/NotificationBell.tsx
git commit -m "feat: add NotificationBell with realtime alert dropdown"
```

---

## Task 12: Component — SyncStatus

**Files:**
- Create: `command-center-app/src/components/shell/SyncStatus.tsx`

**Step 1: Create sync status indicator**

```typescript
'use client'

import { useState, useEffect } from 'react'

export function SyncStatus() {
  const [status, setStatus] = useState<{
    last_run_at: string | null
    status: string
  } | null>(null)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/jobs?view=status')
        const data = await res.json()
        const syncStatus = data.statuses?.find((s: { id: string }) => s.id === 'registry_sync')
        if (syncStatus) setStatus(syncStatus)
      } catch {
        // silently fail
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60_000) // refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (!status) return null

  const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'zojuist'
    if (minutes < 60) return `${minutes}m geleden`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}u geleden`
    const days = Math.floor(hours / 24)
    return `${days}d geleden`
  }

  const dotClass =
    status.status === 'running'
      ? 'bg-amber-400 animate-pulse'
      : status.status === 'success'
        ? 'bg-emerald-400'
        : status.status === 'failed'
          ? 'bg-red-400'
          : 'bg-zinc-400'

  const label = status.last_run_at
    ? getTimeAgo(status.last_run_at)
    : 'Nog niet gedraaid'

  return (
    <div className="flex items-center gap-1.5 px-2 py-1" title={`Sync status: ${status.status}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/components/shell/SyncStatus.tsx
git commit -m "feat: add SyncStatus indicator with auto-refresh"
```

---

## Task 13: Component — CommandPanel (Cmd+J)

**Files:**
- Create: `command-center-app/src/components/shell/CommandPanel.tsx`

**Step 1: Create command panel component**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ScanSearch, HeartPulse, Code, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CommandAction {
  id: string
  label: string
  description: string
  icon: typeof RefreshCw
  handler: () => Promise<string>
}

export function CommandPanel() {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  // Cmd+J shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const actions: CommandAction[] = [
    {
      id: 'sync',
      label: 'Sync Registry',
      description: 'Synchroniseer ~/.claude/registry/ naar database',
      icon: RefreshCw,
      handler: async () => {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'registry_sync' }),
        })
        const data = await res.json()
        return data.success ? 'Sync job aangemaakt' : 'Sync mislukt'
      },
    },
    {
      id: 'scan',
      label: 'Deep Scan',
      description: 'Scan heel ~/.claude/ voor relaties en clusters',
      icon: ScanSearch,
      handler: async () => {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'deep_scan' }),
        })
        const data = await res.json()
        return data.success ? 'Deep Scan job aangemaakt' : 'Scan mislukt'
      },
    },
    {
      id: 'health',
      label: 'Health Check',
      description: 'Controleer gezondheid van alle projecten',
      icon: HeartPulse,
      handler: async () => {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'health_check' }),
        })
        const data = await res.json()
        return data.success ? 'Health Check job aangemaakt' : 'Check mislukt'
      },
    },
    {
      id: 'analysis',
      label: 'Code Analyse',
      description: 'Draai TypeScript analyse via MCP server',
      icon: Code,
      handler: async () => {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'code_analysis' }),
        })
        const data = await res.json()
        return data.success ? 'Code Analyse job aangemaakt' : 'Analyse mislukt'
      },
    },
  ]

  const runAction = useCallback(async (action: CommandAction) => {
    setRunning(action.id)
    setResult(null)
    try {
      const msg = await action.handler()
      setResult(msg)
    } catch {
      setResult('Actie mislukt')
    }
    setRunning(null)
    setTimeout(() => setResult(null), 3000)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/3 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200/50 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200/50 dark:border-zinc-800/50 mb-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Acties
              </span>
              <div className="flex items-center gap-2">
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-mono">
                  Ctrl+J
                </kbd>
                <button onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => runAction(action)}
                    disabled={running !== null}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 disabled:opacity-50"
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${
                      running === action.id ? 'animate-spin text-zinc-500' : 'text-zinc-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">{action.label}</p>
                      <p className="text-xs text-zinc-400 truncate">{action.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {result && (
              <div className="mx-2 mt-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                {result}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/components/shell/CommandPanel.tsx
git commit -m "feat: add CommandPanel (Cmd+J) with sync, scan, health, analyse actions"
```

---

## Task 14: Component — AttentionSection (Homepage)

**Files:**
- Create: `command-center-app/src/components/dashboard/AttentionSection.tsx`

**Step 1: Create attention section**

```typescript
import { AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Alert } from '@/lib/alerts'

interface AttentionSectionProps {
  alerts: Alert[]
}

export function AttentionSection({ alerts }: AttentionSectionProps) {
  // Only show critical and warning alerts
  const important = alerts.filter(
    (a) => (a.severity === 'critical' || a.severity === 'warning') && (a.status === 'new' || a.status === 'acknowledged')
  )

  if (important.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
        Aandacht Nodig
      </h2>
      <div className="space-y-2">
        {important.slice(0, 5).map((alert) => {
          const Icon = alert.severity === 'critical' ? AlertTriangle : AlertCircle
          const href = alert.entity_type === 'project' && alert.entity_id
            ? `/projects/${alert.entity_id}`
            : '/alerts'

          return (
            <Link
              key={alert.id}
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-zinc-200/50 bg-white/60 px-4 py-3 transition-all duration-300 hover:bg-white/80 dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80"
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {alert.title}
                </p>
                {alert.description && (
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                    {alert.description}
                  </p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
            </Link>
          )
        })}
        {important.length > 5 && (
          <Link
            href="/alerts"
            className="block text-center text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors py-2"
          >
            +{important.length - 5} meer alerts bekijken
          </Link>
        )}
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/components/dashboard/AttentionSection.tsx
git commit -m "feat: add AttentionSection for homepage critical/warning alerts"
```

---

## Task 15: Component — AlertsList (Alerts Page)

**Files:**
- Create: `command-center-app/src/components/alerts/AlertsList.tsx`

**Step 1: Create alerts list component**

```typescript
'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle, AlertCircle, Info, Check, X, Eye } from 'lucide-react'
import type { Alert } from '@/lib/alerts'

interface AlertsListProps {
  initialAlerts: Alert[]
}

const severityConfig = {
  critical: { icon: AlertTriangle, class: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20', label: 'Kritiek' },
  warning: { icon: AlertCircle, class: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'Waarschuwing' },
  info: { icon: Info, class: 'text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-800/50', label: 'Info' },
}

export default function AlertsList({ initialAlerts }: AlertsListProps) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('open')

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    if (statusFilter === 'open' && !['new', 'acknowledged'].includes(a.status)) return false
    if (statusFilter === 'resolved' && a.status !== 'resolved') return false
    if (statusFilter === 'dismissed' && a.status !== 'dismissed') return false
    return true
  })

  const updateAlert = useCallback(async (id: string, status: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: status as Alert['status'] } : a))
      )
    } catch {
      // silently fail
    }
  }, [])

  const bulkDismissInfo = useCallback(async () => {
    const infoIds = alerts
      .filter((a) => a.severity === 'info' && ['new', 'acknowledged'].includes(a.status))
      .map((a) => a.id)

    if (infoIds.length === 0) return

    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: infoIds, status: 'dismissed' }),
      })
      setAlerts((prev) =>
        prev.map((a) => (infoIds.includes(a.id) ? { ...a, status: 'dismissed' as const } : a))
      )
    } catch {
      // silently fail
    }
  }, [alerts])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Severity chips */}
        {['all', 'critical', 'warning', 'info'].map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              severityFilter === s
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {s === 'all' ? 'Alles' : s === 'critical' ? 'Kritiek' : s === 'warning' ? 'Waarschuwing' : 'Info'}
          </button>
        ))}

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />

        {/* Status tabs */}
        {['open', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              statusFilter === s
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {s === 'open' ? 'Open' : s === 'resolved' ? 'Opgelost' : 'Genegeerd'}
          </button>
        ))}

        {/* Bulk action */}
        <button
          onClick={bulkDismissInfo}
          className="ml-auto text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          Negeer alle info
        </button>
      </div>

      {/* Alert items */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200/50 bg-white/60 dark:border-zinc-800/50 dark:bg-zinc-900/60 p-8 text-center">
          <p className="text-sm text-zinc-400">
            {statusFilter === 'open'
              ? 'Geen openstaande alerts — alles ziet er goed uit'
              : 'Geen alerts in deze categorie'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info
            const Icon = config.icon

            return (
              <div
                key={alert.id}
                className={`rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 ${config.bg} p-4`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.class}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-medium ${config.class}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(alert.created_at).toLocaleString('nl-NL', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                      {alert.title}
                    </p>
                    {alert.description && (
                      <p className="text-xs text-zinc-500 mt-1">{alert.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {['new', 'acknowledged'].includes(alert.status) && (
                    <div className="flex items-center gap-1 shrink-0">
                      {alert.status === 'new' && (
                        <button
                          onClick={() => updateAlert(alert.id, 'acknowledged')}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                          title="Markeer als gezien"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => updateAlert(alert.id, 'resolved')}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                        title="Markeer als opgelost"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => updateAlert(alert.id, 'dismissed')}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                        title="Negeer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/components/alerts/AlertsList.tsx
git commit -m "feat: add AlertsList with severity/status filters and bulk actions"
```

---

## Task 16: Alerts Page

**Files:**
- Create: `command-center-app/src/app/(dashboard)/alerts/page.tsx`

**Step 1: Create the alerts page**

```typescript
import { Bell } from 'lucide-react'
import { getAlerts, getAlertCounts } from '@/lib/alerts'
import AlertsList from '@/components/alerts/AlertsList'

export const dynamic = 'force-dynamic'

export default async function AlertsPage() {
  const [alerts, counts] = await Promise.all([
    getAlerts(),
    getAlertCounts(),
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Alerts
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {counts.total} openstaand &middot;{' '}
              {counts.critical > 0 && <span className="text-red-500">{counts.critical} kritiek</span>}
              {counts.critical > 0 && counts.warning > 0 && ' · '}
              {counts.warning > 0 && <span className="text-amber-500">{counts.warning} waarschuwing{counts.warning > 1 ? 'en' : ''}</span>}
              {(counts.critical > 0 || counts.warning > 0) && counts.info > 0 && ' · '}
              {counts.info > 0 && `${counts.info} info`}
            </p>
          </div>
          <Bell className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
        </div>

        {/* Alerts list */}
        <AlertsList initialAlerts={alerts} />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/app/(dashboard)/alerts/page.tsx
git commit -m "feat: add alerts page with counts and filterable list"
```

---

## Task 17: Integration — Shell + Navigation + Homepage

**Files:**
- Modify: `command-center-app/src/components/shell/AppShell.tsx`
- Modify: `command-center-app/src/components/shell/ShellLayout.tsx`
- Modify: `command-center-app/src/app/(dashboard)/page.tsx`

**Step 1: Add NotificationBell to AppShell**

In `AppShell.tsx`, add `NotificationBell` import and place it in the desktop sidebar above the search button, and in the mobile header next to the search button.

Import:
```typescript
import { NotificationBell } from './NotificationBell'
import { SyncStatus } from './SyncStatus'
```

Desktop sidebar — add NotificationBell below search button (line ~52, after the search button's closing `</div>`):
```typescript
<div className="flex justify-center p-1">
  <NotificationBell />
</div>
```

Desktop sidebar — add SyncStatus at bottom, before ProjectSwitcher (line ~63):
```typescript
<SyncStatus />
```

Mobile header — add NotificationBell next to search button (line ~88):
```typescript
<NotificationBell />
```

**Step 2: Add CommandPanel to ShellLayout**

In `ShellLayout.tsx`, add CommandPanel import and render it inside the SearchProvider:

Import:
```typescript
import { CommandPanel } from './CommandPanel'
```

Add `<CommandPanel />` after `<AppShell>` closing tag, inside `<SearchProvider>`:
```typescript
<SearchProvider>
  <CommandPanel />
  <AppShell ...>
    {children}
  </AppShell>
</SearchProvider>
```

**Step 3: Add Alerts nav item to ShellLayout**

In `ShellLayout.tsx`, add Bell icon import and alerts nav item:

```typescript
import { Bell } from 'lucide-react'
```

Add to `navigationItems` array (after Activity, before Settings):
```typescript
{ label: 'Alerts', href: '/alerts', icon: <Bell className="h-5 w-5" /> },
```

**Step 4: Add AttentionSection to homepage**

In `app/(dashboard)/page.tsx`:

Import:
```typescript
import { getAlerts } from '@/lib/alerts'
import { AttentionSection } from '@/components/dashboard/AttentionSection'
```

Add to parallel fetch (line ~32):
```typescript
const [stats, recentActivity, projects, recentChanges, openAlerts] = await Promise.all([
  getStats(project),
  getRecentActivity(project),
  getProjectsFromRegistry(),
  getRecentChanges(5),
  getAlerts({ status: 'new', limit: 10 }),
])
```

Add AttentionSection after QuickActionBar (line ~59):
```typescript
{!project && openAlerts.length > 0 && (
  <AttentionSection alerts={openAlerts} />
)}
```

**Step 5: Commit**

```bash
git add command-center-app/src/components/shell/AppShell.tsx
git add command-center-app/src/components/shell/ShellLayout.tsx
git add command-center-app/src/app/(dashboard)/page.tsx
git commit -m "feat: integrate alerts bell, command panel, sync status, and attention section"
```

---

## Task 18: Deploy Edge Functions

**Step 1: Install Supabase CLI (als nog niet gedaan)**

Run: `npm install -g supabase`

**Step 2: Login en link project**

Run:
```bash
cd command-center-v2
supabase login
supabase link --project-ref ikpmlhmbooaxfrlpzcfa
```

**Step 3: Set Edge Function secrets**

Run:
```bash
supabase secrets set APP_URL=https://command-center-app-nine.vercel.app
supabase secrets set SYNC_API_KEY=<your-sync-api-key>
```

**Step 4: Deploy alle Edge Functions**

Run:
```bash
supabase functions deploy health-check
supabase functions deploy sync-trigger
supabase functions deploy alert-digest
```

Expected: 3 functions deployed successfully

**Step 5: Test health-check handmatig**

Run:
```bash
curl -X POST https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json"
```

Expected: JSON response met `success: true`, `new_alerts`, `auto_resolved`

---

## Task 19: Build + Deploy Dashboard

**Step 1: TypeScript check**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: No errors

**Step 2: Build**

Run: `npm run build`
Expected: Build succeeds, `/alerts` route visible in output

**Step 3: Deploy to Vercel**

Run: `npx vercel --prod --yes`
Expected: Deployed successfully

---

## Task 20: Apply pg_cron Schedules

**Step 1: Open Supabase SQL Editor**

Run the SQL from `supabase/migrations/20260218_cron_schedules.sql` in the Supabase Dashboard SQL Editor.

Note: Als `app.settings` niet werkt, gebruik directe URLs in de cron jobs.

**Step 2: Verify cron is active**

Run in SQL Editor:
```sql
SELECT * FROM cron.job;
```

Expected: 2 rows (sync-every-6h, daily-digest)

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Observer + Actor implementation"
git push
```

---

## Summary

| Task | Wat | Type |
|------|-----|------|
| 1 | Database migration (alerts, job_queue, sync_status) | SQL |
| 2 | `lib/alerts.ts` | Server lib |
| 3 | `lib/jobs.ts` | Server lib |
| 4 | `/api/alerts` route | API route |
| 5 | `/api/jobs` route | API route |
| 6 | Edge Function: health-check | Supabase |
| 7 | Edge Function: sync-trigger | Supabase |
| 8 | Edge Function: alert-digest | Supabase |
| 9 | pg_cron schedules | SQL |
| 10 | `useRealtimeAlerts` hook | React hook |
| 11 | NotificationBell component | UI |
| 12 | SyncStatus component | UI |
| 13 | CommandPanel (Cmd+J) component | UI |
| 14 | AttentionSection component | UI |
| 15 | AlertsList component | UI |
| 16 | Alerts page | Page |
| 17 | Integration (shell + nav + homepage) | Integration |
| 18 | Deploy Edge Functions | Infra |
| 19 | Build + Deploy Dashboard | Deploy |
| 20 | Apply pg_cron schedules | Infra |
