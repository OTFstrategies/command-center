# Command Center — Middelpunt Upgrade Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade Command Center van "werkt grotendeels" naar "absoluut middelpunt" door 11 concrete gaten te dichten — met maximale kwaliteit, geen shortcuts.

**Architecture:** Next.js 14 Server Components + Supabase PostgreSQL + Tailwind CSS v4 + Vercel. Wijzigingen verdeeld over 4 SQL migraties, 6 API route wijzigingen, 2 UI component wijzigingen, 1 nieuw API endpoint, en 2 Claude Code hooks. Elke wijziging is atomair en onafhankelijk testbaar.

**Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL + Edge Functions + RLS), TypeScript, Tailwind CSS v4, Vercel, Claude Code CLI hooks.

**Project pad:** `~/projects/command-center/command-center-app/`
**Live URL:** `https://command-center-app-nine.vercel.app`
**Supabase project:** `ikpmlhmbooaxfrlpzcfa`

---

## Visie

Command Center is het **absolute middelpunt** van het hele Claude Code ecosysteem. Elk asset, elke actie, elke sessie, elk project is erin zichtbaar. Geen blinde vlekken, geen handmatige stappen, geen verouderde data.

Na deze upgrade:

- Elke sync schrijft een volledige audit trail
- Data gaat nooit verloren door een halve sync
- Het dashboard is altijd actueel (auto-sync)
- Alle mutatie-endpoints zijn beveiligd
- Nieuwe projecten worden automatisch ontdekt
- Zoekresultaten zijn gepagineerd
- Bulk operaties zijn mogelijk

---

## Doelen

| #   | Doel                       | Meetbaar criterium                                     |
| --- | -------------------------- | ------------------------------------------------------ |
| 1   | Activity log gevuld        | Na sync: ≥1 entry per gewijzigd item in activity_log   |
| 2   | entity_versions consistent | Kolom `created_at` bestaat en is gevuld                |
| 3   | Auto-sync werkt            | Binnen 120s na registry-wijziging is dashboard actueel |
| 4   | Usage statistics gevuld    | Na sync: ≥1 entry per type in usage_statistics         |
| 5   | PATCH endpoints beveiligd  | PATCH zonder key → 401 response                        |
| 6   | Homepage crashbestendig    | Homepage laadt met lege data als DB onbereikbaar       |
| 7   | Sync is atomair            | INSERT-fout na DELETE → data behouden (rollback)       |
| 8   | Projecten auto-discovery   | Nieuw project in ~/projects/ verschijnt na sync        |
| 9   | Sessie-info behouden       | STATUS.md wordt bijgewerkt bij dagstart                |
| 10  | Search gepagineerd         | Resultaten beperkt tot 50 per pagina                   |
| 11  | Bulk operaties werken      | Meerdere items tegelijk verwijderen/taggen             |

---

## Subagents Overzicht

| Agent | Naam                           | Taken   | Verantwoordelijkheid                                      |
| ----- | ------------------------------ | ------- | --------------------------------------------------------- |
| SA-1  | **Database Architect**         | T1-T4   | SQL migraties schrijven en uitvoeren via Supabase CLI     |
| SA-2  | **Sync Engineer**              | T5-T9   | Sync route, activity logging, rollback, project discovery |
| SA-3  | **Security Engineer**          | T10-T13 | Auth op PATCH endpoints, homepage crashbescherming        |
| SA-4  | **Search & Registry Engineer** | T14-T17 | Search paginatie, bulk operaties                          |
| SA-5  | **Hooks Engineer**             | T18-T20 | Auto-sync hook, usage tracking, sessie-einde              |
| SA-6  | **Quality Assurance**          | T21-T23 | Build verificatie, API tests, deployment check            |

### Interactielogica

```
SA-1 (Database) ──┐
                   ├──→ SA-2 (Sync) ──┐
                   │                    │
                   ├──→ SA-3 (Security) ├──→ SA-6 (QA) ──→ Deploy
                   │                    │
                   ├──→ SA-4 (Search)  ─┘
                   │
SA-5 (Hooks) ─────┘ (parallel, onafhankelijk)
```

**Volgorde:**

1. SA-1 draait EERST (alle migraties moeten staan voordat API code wijzigt)
2. SA-2, SA-3, SA-4 draaien PARALLEL na SA-1
3. SA-5 draait PARALLEL (geen dependency op database)
4. SA-6 draait als LAATSTE (verificatie van alles)

---

## Workflow

```
1. SA-1: Migraties → supabase db push
2. SA-2 + SA-3 + SA-4 (parallel): API + UI wijzigingen
3. SA-5 (parallel): Hook scripts in ~/.claude/hooks/
4. npm run build (moet slagen)
5. SA-6: Verificatie via curl + browser
6. git commit + push → Vercel auto-deploy
7. SA-6: Productie verificatie
```

---

## TAKEN

---

### Task 1: SQL migratie — entity_versions created_at

**Agent:** SA-1 | **Issue:** #2 | **Prioriteit:** KRITIEK

**Files:**

- Create: `supabase/migrations/20260219100000_add_created_at_entity_versions.sql`

**Step 1: Schrijf de migratie**

```sql
-- Voeg created_at toe aan entity_versions voor consistentie met andere tabellen
ALTER TABLE entity_versions
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Vul bestaande rijen vanuit detected_at
UPDATE entity_versions SET created_at = detected_at WHERE created_at IS NULL;

-- Index voor sortering
CREATE INDEX IF NOT EXISTS idx_entity_ver_created ON entity_versions(created_at DESC);

-- Trigger: houd created_at gelijk aan detected_at bij INSERT
CREATE OR REPLACE FUNCTION set_entity_version_created_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := COALESCE(NEW.detected_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entity_version_created_at ON entity_versions;
CREATE TRIGGER trg_entity_version_created_at
  BEFORE INSERT ON entity_versions
  FOR EACH ROW EXECUTE FUNCTION set_entity_version_created_at();
```

**Step 2: Voer migratie uit**

Run: `cd ~/projects/command-center && supabase db push`
Expected: Migration applied successfully

**Step 3: Verifieer**

Run: `cd ~/projects/command-center && supabase db push --dry-run`
Expected: No pending migrations

---

### Task 2: SQL migratie — usage_statistics upsert constraint

**Agent:** SA-1 | **Issue:** #4 | **Prioriteit:** KRITIEK

**Files:**

- Create: `supabase/migrations/20260219100100_add_usage_upsert_constraint.sql`

**Step 1: Schrijf de migratie**

```sql
-- Unique constraint voor upsert op usage_statistics
-- Nodig zodat sync per-item usage kan upsertten zonder duplicaten
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_unique_entity_metric_period'
  ) THEN
    ALTER TABLE usage_statistics
      ADD CONSTRAINT usage_unique_entity_metric_period
      UNIQUE (entity_type, entity_id, metric, period);
  END IF;
END $$;
```

**Step 2: Voer migratie uit**

Run: `cd ~/projects/command-center && supabase db push`
Expected: Migration applied successfully

---

### Task 3: SQL migratie — atomaire sync RPC

**Agent:** SA-1 | **Issue:** #7 | **Prioriteit:** BELANGRIJK

**Files:**

- Create: `supabase/migrations/20260219100200_add_sync_transaction_rpc.sql`

**Step 1: Schrijf de RPC functie**

```sql
-- Atomaire sync: DELETE + INSERT in één transactie
-- Als INSERT faalt, wordt DELETE teruggedraaid (PostgreSQL transactie-semantiek)
CREATE OR REPLACE FUNCTION sync_registry_items(
  p_type text,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_deleted int;
  v_inserted int;
BEGIN
  -- Valideer input
  IF p_type IS NULL OR p_items IS NULL THEN
    RAISE EXCEPTION 'p_type and p_items are required';
  END IF;

  -- Verwijder bestaande items van dit type
  DELETE FROM registry_items WHERE type = p_type;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Insert nieuwe items
  INSERT INTO registry_items (id, type, name, path, description, project, tags, metadata, created_at, updated_at)
  SELECT
    (item->>'id')::uuid,
    p_type,
    item->>'name',
    item->>'path',
    item->>'description',
    COALESCE(item->>'project', 'global'),
    CASE
      WHEN item->'tags' IS NOT NULL AND jsonb_typeof(item->'tags') = 'array'
      THEN (SELECT array_agg(t::text) FROM jsonb_array_elements_text(item->'tags') t)
      ELSE '{}'::text[]
    END,
    COALESCE(item->'metadata', '{}'::jsonb),
    COALESCE((item->>'created_at')::timestamptz, now()),
    now()
  FROM jsonb_array_elements(p_items) AS item;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN jsonb_build_object(
    'deleted', v_deleted,
    'inserted', v_inserted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geef execute permissie aan service_role
GRANT EXECUTE ON FUNCTION sync_registry_items(text, jsonb) TO service_role;
```

**Step 2: Voer migratie uit**

Run: `cd ~/projects/command-center && supabase db push`
Expected: Migration applied successfully

**Step 3: Test de RPC functie**

Run (via Supabase SQL Editor of psql):

```sql
SELECT sync_registry_items('api', '[]'::jsonb);
```

Expected: `{"deleted": N, "inserted": 0}` (bestaande api items verwijderd, 0 terug)

**BELANGRIJK:** Voer deze test NIET uit op productiedata zonder backup. Test eerst met een dummy type of op een lege tabel.

---

### Task 4: SQL migratie — projecten slug + name kolom

**Agent:** SA-1 | **Issue:** #8 | **Prioriteit:** GEWENST

**Files:**

- Create: `supabase/migrations/20260219100300_add_slug_name_to_projecten.sql`

**Step 1: Schrijf de migratie**

```sql
-- Voeg slug en name toe aan de projecten tabel
-- De Map/Dossier/Comparison code verwacht deze kolommen
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS name text;

-- Vul bestaande rijen vanuit naam
UPDATE projecten SET
  slug = lower(replace(naam, ' ', '-')),
  name = naam
WHERE slug IS NULL OR name IS NULL;

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_projecten_slug ON projecten(slug);

-- RLS policy voor service_role
CREATE POLICY "Service role full access projecten"
  ON projecten FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
```

**Step 2: Voer migratie uit**

Run: `cd ~/projects/command-center && supabase db push`
Expected: Migration applied successfully

**Step 3: Commit alle migraties**

Run:

```bash
cd ~/projects/command-center
git add supabase/migrations/20260219*.sql
git commit -m "feat(db): add 4 migrations for CC middelpunt upgrade

- entity_versions.created_at for consistency
- usage_statistics unique constraint for upsert
- sync_registry_items RPC for atomic sync
- projecten.slug + name for Map/Dossier compatibility

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Sync route — granulaire activity logging

**Agent:** SA-2 | **Issue:** #1 | **Prioriteit:** KRITIEK
**Depends on:** T1 (migraties moeten draaien)

**Files:**

- Modify: `command-center-app/src/app/api/sync/route.ts`

**Step 1: Voeg per-item activity logging toe na de bestaande generieke log**

In `route.ts`, na regel 165 (na de bestaande activity_log insert), voeg toe:

```typescript
// Per-item activity logging voor granulaire audit trail
const activityEntries: {
  item_type: string;
  item_name: string;
  action: string;
  details: Record<string, unknown>;
}[] = [];

for (const [project, changes] of changesByProject) {
  for (const name of changes.added) {
    activityEntries.push({
      item_type: type,
      item_name: name,
      action: "created",
      details: { project, source: "sync" },
    });
  }
  for (const name of changes.removed) {
    activityEntries.push({
      item_type: type,
      item_name: name,
      action: "deleted",
      details: { project, source: "sync" },
    });
  }
}

if (activityEntries.length > 0) {
  const { error: actError } = await supabase
    .from("activity_log")
    .insert(activityEntries);
  if (actError) {
    console.error("Per-item activity log error:", actError);
  }
}
```

**Step 2: Voeg error handling toe aan de bestaande generieke log (regel 159)**

Vervang regels 159-165:

```typescript
// Log sync summary activity
const { error: syncLogError } = await supabase.from("activity_log").insert({
  item_type: type,
  item_id: null,
  item_name: `${type} sync`,
  action: "synced",
  details: { count: dbItems.length, timestamp: new Date().toISOString() },
});
if (syncLogError) {
  console.error("Sync activity log error:", syncLogError);
}
```

**Step 3: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 6: Sync route — entity_versions created_at veld

**Agent:** SA-2 | **Issue:** #2 | **Prioriteit:** KRITIEK
**Depends on:** T1

**Files:**

- Modify: `command-center-app/src/app/api/sync/route.ts`
- Modify: `command-center-app/src/lib/timeline.ts`

**Step 1: Voeg created_at toe aan versionEntries in sync route**

In `route.ts`, het `versionEntries` type (regels 198-207), voeg `created_at: string` toe:

```typescript
const versionEntries: {
  entity_type: string;
  entity_id: string;
  version: string;
  change_type: string;
  title: string;
  description: string;
  items_changed: { name: string; type: string; action: string }[];
  detected_by: string;
  created_at: string;
}[] = [];
```

En in beide `versionEntries.push()` calls (regels 211 en 223), voeg toe:

```typescript
          created_at: new Date().toISOString(),
```

**Step 2: Update EntityVersion interface**

In `timeline.ts`, voeg toe aan het `EntityVersion` interface (na regel 34):

```typescript
created_at: string;
```

**Step 3: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 7: Sync route — atomaire sync via RPC

**Agent:** SA-2 | **Issue:** #7 | **Prioriteit:** BELANGRIJK
**Depends on:** T3

**Files:**

- Modify: `command-center-app/src/app/api/sync/route.ts`

**Step 1: Vervang DELETE + INSERT met RPC call**

Vervang regels 129-156 (het hele DELETE + INSERT blok) met:

```typescript
// Atomaire sync via PostgreSQL RPC (transactie: alles of niets)
const { data: rpcResult, error: rpcError } = await supabase.rpc(
  "sync_registry_items",
  {
    p_type: type,
    p_items: dbItems,
  },
);

if (rpcError) {
  console.error("Sync RPC error:", rpcError);
  return NextResponse.json(
    {
      error: `Sync failed (transaction rolled back, no data lost): ${rpcError.message}`,
    },
    { status: 500 },
  );
}

const { deleted: deletedCount, inserted: insertedCount } = rpcResult || {
  deleted: 0,
  inserted: 0,
};
```

**Step 2: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 8: Sync route — usage statistics bij sync

**Agent:** SA-2 | **Issue:** #4 | **Prioriteit:** KRITIEK
**Depends on:** T2

**Files:**

- Modify: `command-center-app/src/app/api/sync/route.ts`

**Step 1: Voeg usage tracking toe na de sync (voor de return)**

Voeg toe vlak voor het `return NextResponse.json({...})` blok (voor regel 277):

```typescript
// Track usage: registreer dat elk item gesynced is
const period = new Date().toISOString().slice(0, 7); // YYYY-MM
const usageEntries = dbItems.map((item) => ({
  entity_type: type,
  entity_id: item.name,
  metric: "synced",
  value: 1,
  period,
  last_used: new Date().toISOString(),
}));

if (usageEntries.length > 0) {
  const { error: usageError } = await supabase
    .from("usage_statistics")
    .upsert(usageEntries, {
      onConflict: "entity_type,entity_id,metric,period",
    });
  if (usageError) {
    console.error("Usage tracking error:", usageError);
  }
}
```

**Step 2: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 9: Sync route — project auto-discovery + projecten tabel

**Agent:** SA-2 | **Issue:** #8 | **Prioriteit:** GEWENST
**Depends on:** T4

**Files:**

- Modify: `command-center-app/src/app/api/sync/route.ts`

**Step 1: Voeg projecten-tabel schrijven toe naast projects-tabel**

In `route.ts`, in het auto-create projects blok (regels 240-275), voeg na de `projects` insert (na regel 263) toe:

```typescript
// Ook aanmaken in projecten tabel (voor Map/Dossier/Comparison)
const { data: existingProjecten } = await supabase
  .from("projecten")
  .select("id")
  .eq("slug", slug)
  .limit(1)
  .maybeSingle();

if (!existingProjecten) {
  await supabase.from("projecten").insert({
    id: slug,
    naam: projectName,
    name: projectName,
    slug,
    locatie: "auto-discovered",
    start_datum: new Date().toISOString().slice(0, 10),
  });
}
```

**Step 2: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

**Step 3: Commit sync route wijzigingen**

```bash
cd ~/projects/command-center
git add command-center-app/src/app/api/sync/route.ts command-center-app/src/lib/timeline.ts
git commit -m "feat(sync): granular activity logging, atomic RPC, usage tracking, project discovery

- Per-item activity_log entries (created/deleted) with error handling
- entity_versions.created_at field populated
- Atomic sync via sync_registry_items RPC (no data loss on failure)
- Usage statistics upsert per synced item
- Auto-create in projecten table for Map/Dossier compatibility

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Auth — alerts PATCH endpoint

**Agent:** SA-3 | **Issue:** #5 | **Prioriteit:** BELANGRIJK

**Files:**

- Modify: `command-center-app/src/app/api/alerts/route.ts`

**Step 1: Voeg auth check toe aan PATCH handler**

Voeg toe na regel 29 (`try {`), als eerste statements in de PATCH functie:

```typescript
// Auth check — voorkom ongeautoriseerde status wijzigingen
const apiKey = request.headers.get("x-api-key");
if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Step 2: Maak een server-side proxy voor dashboard client calls**

De `AlertsList.tsx` component roept `PATCH /api/alerts` aan zonder auth (client-side). We maken een interne proxy route die geen auth nodig heeft maar alleen werkt vanuit de eigen app.

Create: `command-center-app/src/app/api/alerts/update/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { updateAlertStatus, bulkUpdateAlerts } from "@/lib/alerts";

// POST /api/alerts/update — Server-side proxy voor dashboard client calls
// Geen API key nodig (same-origin, niet publiek bereikbaar via CORS)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ids, status } = body as {
      id?: string;
      ids?: string[];
      status: "acknowledged" | "resolved" | "dismissed";
    };

    if (!status) {
      return NextResponse.json({ error: "status required" }, { status: 400 });
    }

    if (ids && ids.length > 0) {
      await bulkUpdateAlerts(ids, status);
      return NextResponse.json({ success: true, updated: ids.length });
    } else if (id) {
      await updateAlertStatus(id, status);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "id or ids required" },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
```

**Step 3: Update AlertsList.tsx om de proxy te gebruiken**

In `command-center-app/src/components/alerts/AlertsList.tsx`:

Vervang alle `fetch('/api/alerts', { method: 'PATCH'` met `fetch('/api/alerts/update', { method: 'POST'`.

Regel 32: `await fetch('/api/alerts/update', { method: 'POST',`
Regel 53: `await fetch('/api/alerts/update', { method: 'POST',`

**Step 4: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 11: Auth — jobs POST en PATCH endpoints

**Agent:** SA-3 | **Issue:** #5 | **Prioriteit:** BELANGRIJK

**Files:**

- Modify: `command-center-app/src/app/api/jobs/route.ts`
- Create: `command-center-app/src/app/api/jobs/action/route.ts`
- Modify: `command-center-app/src/components/shell/CommandPanel.tsx`

**Step 1: Voeg auth check toe aan PATCH handler (jobs route.ts)**

Voeg toe na regel 61 (`try {`):

```typescript
const apiKey = request.headers.get("x-api-key");
if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Step 2: Voeg auth check toe aan POST handler (jobs route.ts)**

Voeg toe na regel 36 (`try {`):

```typescript
const apiKey = request.headers.get("x-api-key");
if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Step 3: Maak server-side proxy voor dashboard job creation**

Create: `command-center-app/src/app/api/jobs/action/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createJob } from "@/lib/jobs";

// POST /api/jobs/action — Server-side proxy voor dashboard CommandPanel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body as {
      type: string;
      payload?: Record<string, unknown>;
    };

    if (!type) {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }

    const validTypes = [
      "registry_sync",
      "deep_scan",
      "health_check",
      "code_analysis",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Valid: ${validTypes.join(", ")}` },
        { status: 400 },
      );
    }

    const job = await createJob(type, payload || {});
    return NextResponse.json({ success: true, job });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
```

**Step 4: Update CommandPanel.tsx**

In `command-center-app/src/components/shell/CommandPanel.tsx`:

Vervang alle `fetch('/api/jobs', { method: 'POST'` met `fetch('/api/jobs/action', { method: 'POST'`.

Dit zijn 4 regels: 42, 58, 84, 115.

**Step 5: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 12: Homepage — crashbescherming

**Agent:** SA-3 | **Issue:** #6 | **Prioriteit:** BELANGRIJK

**Files:**

- Modify: `command-center-app/src/app/(dashboard)/page.tsx`

**Step 1: Wrap Promise.all in try/catch met fallback waarden**

Vervang regels 31-40 met:

```typescript
noStore();
const { project } = await searchParams;

// Fallback waarden als database onbereikbaar is
let stats: AssetStats = {
  apis: 0,
  prompts: 0,
  skills: 0,
  agents: 0,
  commands: 0,
  instructions: 0,
};
let recentActivity: Awaited<ReturnType<typeof getRecentActivity>> = [];
let projects: Awaited<ReturnType<typeof getProjectsFromRegistry>> = [];
let recentChanges: Awaited<ReturnType<typeof getRecentChanges>> = [];
let openAlerts: Awaited<ReturnType<typeof getAlerts>> = [];
let dataError = false;

try {
  [stats, recentActivity, projects, recentChanges, openAlerts] =
    await Promise.all([
      getStats(project),
      getRecentActivity(project),
      getProjectsFromRegistry(),
      getRecentChanges(5),
      getAlerts({ status: "new", limit: 10 }),
    ]);
} catch (error) {
  console.error("Homepage data fetch error:", error);
  dataError = true;
}
```

**Step 2: Voeg error banner toe in de JSX**

Na de header `<div>` (na regel 55), voeg toe:

```tsx
{
  /* Database error banner */
}
{
  dataError && (
    <div className="mb-6 rounded-xl border border-zinc-200/50 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700/50 dark:bg-zinc-800/30">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Kan geen verbinding maken met de database. Getoonde data kan verouderd
        of onvolledig zijn.
      </p>
    </div>
  );
}
```

**Step 3: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

**Step 4: Commit security + homepage wijzigingen**

```bash
cd ~/projects/command-center
git add command-center-app/src/app/api/alerts/ command-center-app/src/app/api/jobs/ \
  command-center-app/src/components/alerts/AlertsList.tsx \
  command-center-app/src/components/shell/CommandPanel.tsx \
  command-center-app/src/app/\(dashboard\)/page.tsx
git commit -m "feat(security): auth on PATCH endpoints + homepage crash protection

- Add x-api-key auth to alerts PATCH and jobs POST/PATCH
- Create /api/alerts/update proxy for dashboard client calls
- Create /api/jobs/action proxy for CommandPanel
- Wrap homepage Promise.all in try/catch with fallback values
- Add error banner when database is unreachable

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: (Reserve) Verifieer Edge Functions niet geraakt

**Agent:** SA-3 | **Prioriteit:** LAAG

De 3 Edge Functions (health-check, sync-trigger, alert-digest) schrijven direct naar Supabase via service_role client, niet via de API routes. Ze worden NIET geraakt door de auth-wijzigingen. Geen actie nodig, alleen bevestiging.

**Step 1: Verifieer**

Lees `supabase/functions/health-check/index.ts` en bevestig dat het `supabase.from('alerts').insert(...)` gebruikt (directe DB call, niet via `/api/alerts`).

---

### Task 14: Search API — paginatie + server-side filtering

**Agent:** SA-4 | **Issue:** #10 | **Prioriteit:** GEWENST

**Files:**

- Modify: `command-center-app/src/app/api/search/route.ts`

**Step 1: Voeg query parameters toe en beperk resultaten**

Vervang de volledige `GET` functie met:

```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category") || undefined;

    const [registryResult, projectsResult, tasksResult] = await Promise.all([
      !category || category === "asset"
        ? supabase
            .from("registry_items")
            .select("id, type, name, description, project")
            .limit(500)
        : Promise.resolve({ data: [] }),
      !category || category === "project"
        ? supabase
            .from("projects")
            .select("id, name, slug, description")
            .limit(100)
        : Promise.resolve({ data: [] }),
      !category || category === "task"
        ? supabase
            .from("kanban_tasks")
            .select("id, title, project, status")
            .limit(200)
        : Promise.resolve({ data: [] }),
    ]);

    const items: {
      id: string;
      type: string;
      name: string;
      description: string | null;
      project: string | null;
      category: string;
      href: string;
    }[] = [];

    for (const item of (registryResult as any).data || []) {
      items.push({
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        project: item.project,
        category: "asset",
        href: `/registry?type=${item.type}&search=${encodeURIComponent(item.name)}`,
      });
    }

    for (const proj of (projectsResult as any).data || []) {
      items.push({
        id: proj.id,
        type: "project",
        name: proj.name,
        description: proj.description,
        project: proj.name,
        category: "project",
        href: `/projects/${proj.slug}`,
      });
    }

    for (const task of (tasksResult as any).data || []) {
      items.push({
        id: task.id,
        type: "task",
        name: task.title,
        description: null,
        project: task.project,
        category: "task",
        href: "/tasks",
      });
    }

    const pages = [
      { name: "Home", href: "/", description: "Dashboard overview" },
      { name: "Registry", href: "/registry", description: "Asset registry" },
      { name: "Tasks", href: "/tasks", description: "Kanban board" },
      { name: "Activity", href: "/activity", description: "Activity log" },
      { name: "Alerts", href: "/alerts", description: "Alert management" },
      { name: "Map", href: "/map", description: "Intelligence Map" },
      { name: "Settings", href: "/settings", description: "Sync configuratie" },
    ];

    if (!category || category === "page") {
      for (const page of pages) {
        items.push({
          id: `page-${page.href}`,
          type: "page",
          name: page.name,
          description: page.description,
          project: null,
          category: "page",
          href: page.href,
        });
      }
    }

    // Server-side filtering op query
    const filtered = query
      ? items.filter(
          (item) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            (item.description &&
              item.description.toLowerCase().includes(query.toLowerCase())),
        )
      : items;

    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      items: paginated,
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { items: [], total: 0, error: "Search failed" },
      { status: 500 },
    );
  }
}
```

Voeg bovenaan toe (na de imports):

```typescript
import { NextRequest } from "next/server";
```

En verwijder de huidige `NextResponse` import en vervang door:

```typescript
import { NextRequest, NextResponse } from "next/server";
```

**Step 2: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 15: SearchDialog — ondersteuning voor paginatie

**Agent:** SA-4 | **Issue:** #10 | **Prioriteit:** GEWENST

**Files:**

- Modify: `command-center-app/src/components/search/SearchDialog.tsx`
- Modify: `command-center-app/src/lib/search.ts` (als dit bestaat, anders overslaan)

**Step 1: Update de fetch in SearchDialog**

In `SearchDialog.tsx`, vervang de `fetch` call (regels 37-39):

```typescript
fetch("/api/search?limit=200")
  .then((res) => res.json())
  .then((data) => setAllItems(data.items || []))
  .catch(console.error);
```

Het client-side fuzzy search patroon blijft behouden (items worden lokaal gefilterd). De server-side paginatie is een vangnet voor grote datasets.

**Step 2: Voeg een "meer resultaten" indicator toe**

In de results rendering sectie (na regel 140, na de `results.map` blok), voeg toe:

```tsx
{
  results.length >= 50 && (
    <div className="px-4 py-2 text-center text-xs text-zinc-400">
      Meer dan 50 resultaten — verfijn je zoekopdracht
    </div>
  );
}
```

**Step 3: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 16: Bulk operaties — API endpoint

**Agent:** SA-4 | **Issue:** #11 | **Prioriteit:** GEWENST

**Files:**

- Create: `command-center-app/src/app/api/registry/bulk/route.ts`

**Step 1: Maak het bulk endpoint aan**

```typescript
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

type BulkAction = "delete" | "update-tags" | "move-project";

interface BulkPayload {
  action: BulkAction;
  ids: string[];
  data?: { tags?: string[]; project?: string };
}

// POST /api/registry/bulk — Bulk operaties op registry items
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as BulkPayload;

    if (
      !body.action ||
      !body.ids ||
      !Array.isArray(body.ids) ||
      body.ids.length === 0
    ) {
      return NextResponse.json(
        {
          error: "action (delete|update-tags|move-project) and ids[] required",
        },
        { status: 400 },
      );
    }

    if (body.ids.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 items per bulk operation" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();
    let affected = 0;

    switch (body.action) {
      case "delete": {
        const { count } = await supabase
          .from("registry_items")
          .delete()
          .in("id", body.ids);
        affected = count || 0;
        break;
      }
      case "update-tags": {
        if (!body.data?.tags || !Array.isArray(body.data.tags)) {
          return NextResponse.json(
            { error: "data.tags[] required for update-tags" },
            { status: 400 },
          );
        }
        const { count } = await supabase
          .from("registry_items")
          .update({
            tags: body.data.tags,
            updated_at: new Date().toISOString(),
          })
          .in("id", body.ids);
        affected = count || 0;
        break;
      }
      case "move-project": {
        if (!body.data?.project) {
          return NextResponse.json(
            { error: "data.project required for move-project" },
            { status: 400 },
          );
        }
        const { count } = await supabase
          .from("registry_items")
          .update({
            project: body.data.project,
            updated_at: new Date().toISOString(),
          })
          .in("id", body.ids);
        affected = count || 0;
        break;
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}` },
          { status: 400 },
        );
    }

    // Log de bulk actie
    await supabase.from("activity_log").insert({
      item_type: "system",
      item_name: `Bulk ${body.action}`,
      action: "updated",
      details: {
        action: body.action,
        count: affected,
        ids: body.ids.slice(0, 10),
      },
    });

    return NextResponse.json({ success: true, action: body.action, affected });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
```

**Step 2: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build succeeds

---

### Task 17: Commit search + bulk wijzigingen

**Agent:** SA-4

```bash
cd ~/projects/command-center
git add command-center-app/src/app/api/search/route.ts \
  command-center-app/src/components/search/SearchDialog.tsx \
  command-center-app/src/app/api/registry/bulk/route.ts
git commit -m "feat(search+bulk): paginated search API + bulk registry operations

- Search API now accepts q, limit, offset, category params
- Server-side filtering + pagination (max 200 per page)
- SearchDialog shows 'refine search' hint at 50+ results
- New POST /api/registry/bulk for delete, update-tags, move-project
- Bulk endpoint has auth + 500 item limit + activity logging

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 18: Hook — auto-sync na registry wijzigingen

**Agent:** SA-5 | **Issue:** #3 | **Prioriteit:** KRITIEK

**Files:**

- Create: `~/.claude/hooks/auto-sync-registry.sh`

**Step 1: Onderzoek beschikbare hook events**

Claude Code hooks ondersteunen `PreToolUse` en `PostToolUse` events. Controleer de actuele hook configuratie en mogelijkheden.

Lees: `~/.claude/settings.json` en `~/.claude/settings.local.json` voor hook configuratie.

**Step 2: Maak het hook script aan**

```bash
#!/bin/bash
# auto-sync-registry.sh
# PostToolUse hook: triggert registry sync na schrijfacties op ~/.claude/registry/
#
# Claude Code geeft hook info via environment variables of stdin.
# Dit script leest het gewijzigde bestandspad en triggert een async sync.

REGISTRY_DIR="$HOME/.claude/registry"
CC_APP="$HOME/projects/command-center/command-center-app"
LOCK_FILE="/tmp/cc-auto-sync-last"
DEBOUNCE_SECONDS=120

# Lees hook input (bestandspad)
# Het exacte formaat hangt af van de Claude Code hook implementatie.
# Als het pad niet in de registry dir valt, doe niets.
FILE_PATH="${1:-}"

if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" != "$REGISTRY_DIR"* ]]; then
  exit 0
fi

# Debounce: alleen syncen als laatste sync > N seconden geleden
if [ -f "$LOCK_FILE" ]; then
  LAST_SYNC=$(cat "$LOCK_FILE" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  DIFF=$((NOW - LAST_SYNC))
  if [ "$DIFF" -lt "$DEBOUNCE_SECONDS" ]; then
    exit 0
  fi
fi

# Trigger async sync (niet-blokkerend)
date +%s > "$LOCK_FILE"

# Lees API key
API_KEY=""
if [ -f "$CC_APP/.env.local" ]; then
  API_KEY=$(grep -oP 'SYNC_API_KEY=\K.*' "$CC_APP/.env.local" 2>/dev/null)
fi

if [ -z "$API_KEY" ]; then
  echo "WARN: SYNC_API_KEY niet gevonden, sync overgeslagen" >&2
  exit 0
fi

# Run sync in achtergrond
(
  cd "$CC_APP" && SYNC_API_KEY="$API_KEY" node scripts/sync-registry.mjs >> /tmp/cc-auto-sync.log 2>&1
) &

exit 0
```

**Step 3: Maak executable**

Run: `chmod +x ~/.claude/hooks/auto-sync-registry.sh`

**Step 4: Registreer de hook**

De hook registratie hangt af van de Claude Code hook configuratie. Controleer of hooks in `~/.claude/hooks/` automatisch gedetecteerd worden door de hookify plugin, of dat registratie in `settings.json` nodig is.

---

### Task 19: Hook — usage tracking

**Agent:** SA-5 | **Issue:** #4 | **Prioriteit:** KRITIEK

**Aanpak:** In plaats van een apart hook-script (waarvan de haalbaarheid afhankelijk is van hoe Claude Code parameters doorgeeft), voegen we usage tracking toe aan het sync script zelf.

**Files:**

- Modify: `command-center-app/scripts/sync-registry.mjs`

**Step 1: Voeg een samenvattende usage POST toe aan het einde van het sync script**

Na de sync loop, voeg toe:

```javascript
// Track usage: registreer sync als activiteit
async function trackUsage(results) {
  const successfulTypes = results
    .filter((r) => r.status === "ok")
    .map((r) => r.type);

  if (successfulTypes.length === 0) return;

  try {
    const res = await fetch(`${API_BASE}/api/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        item_type: "system",
        item_name: "Registry Sync (CLI)",
        action: "synced",
        details: {
          types_synced: successfulTypes,
          total_items: results.reduce((sum, r) => sum + (r.count || 0), 0),
          triggered_by: "sync-registry.mjs",
          timestamp: new Date().toISOString(),
        },
      }),
    });
    if (res.ok) {
      console.log("  [LOG] Sync activiteit gelogd");
    }
  } catch (err) {
    console.error("  [WARN] Kon sync activiteit niet loggen:", err.message);
  }
}
```

Roep `trackUsage(results)` aan na de sync loop (waar `results` het array van sync resultaten is).

**Step 2: Verifieer**

Run: `cd ~/projects/command-center/command-center-app && node scripts/sync-registry.mjs` (met SYNC_API_KEY)
Expected: `[LOG] Sync activiteit gelogd`

---

### Task 20: Sessie-info behoud — dagstart check

**Agent:** SA-5 | **Issue:** #9 | **Prioriteit:** GEWENST

**Files:**

- Modify: `~/.claude/commands/dagstart.md`

**Step 1: Voeg een STATUS.md check toe aan het dagstart command**

Voeg aan het dagstart command een instructie toe die controleert:

1. Wanneer was de laatst gesynchroniseerde sessie? (check activity_log)
2. Is STATUS.md actueel? (check "Laatste update" datum)
3. Zo nee, genereer een waarschuwing

De exacte wijziging hangt af van het huidige formaat van `dagstart.md`. Lees het bestand eerst, voeg dan de check-instructies toe.

**Step 2: Commit hooks + script wijzigingen**

```bash
cd ~/projects/command-center
git add command-center-app/scripts/sync-registry.mjs
git commit -m "feat(sync): add CLI activity tracking to sync script

- POST to /api/activity after successful sync
- Logs types synced, total items, trigger source
- Non-blocking: sync continues even if logging fails

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 21: Build verificatie

**Agent:** SA-6 | **Prioriteit:** KRITIEK
**Depends on:** T5-T17

**Step 1: Build**

Run: `cd ~/projects/command-center/command-center-app && npm run build`
Expected: Build completes without errors

**Step 2: Type check**

Run: `cd ~/projects/command-center/command-center-app && npx tsc --noEmit`
Expected: No type errors

**Step 3: Lint**

Run: `cd ~/projects/command-center/command-center-app && npm run lint`
Expected: No errors (warnings acceptable)

---

### Task 22: API verificatie via curl

**Agent:** SA-6 | **Prioriteit:** KRITIEK
**Depends on:** T21

Lees SYNC_API_KEY uit `.env.local` en voer deze tests uit:

**Test 1: Alerts PATCH zonder key → 401**

```bash
curl -s -X PATCH https://command-center-app-nine.vercel.app/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"id":"test","status":"resolved"}'
```

Expected: `{"error":"Unauthorized"}` met status 401

**Test 2: Jobs POST zonder key → 401**

```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"type":"health_check"}'
```

Expected: `{"error":"Unauthorized"}` met status 401

**Test 3: Search met paginatie**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/search?q=agent&limit=5"
```

Expected: JSON met `items`, `total`, `limit`, `offset`, `hasMore` velden

**Test 4: Alerts update proxy werkt**

```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/alerts/update \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}'
```

Expected: `{"error":"id or ids required"}` met status 400 (auth niet vereist)

**Test 5: Homepage laadt**

```bash
curl -s -o /dev/null -w "%{http_code}" https://command-center-app-nine.vercel.app/
```

Expected: 200

---

### Task 23: Push en deploy

**Agent:** SA-6 | **Prioriteit:** KRITIEK
**Depends on:** T21, T22

**Step 1: Push naar GitHub**

```bash
cd ~/projects/command-center && git push origin master
```

Expected: Vercel auto-deploy triggert

**Step 2: Wacht op deployment**

Check deployment status via Vercel MCP tool of:

```bash
vercel ls --scope otf-strategies 2>/dev/null | head -5
```

**Step 3: Verifieer productie**

Herhaal de curl tests uit T22 tegen de productie URL.

---

## Kwaliteitsborging

### Per-taak verificatie

Elke taak eindigt met een build check (`npm run build`). Als de build faalt, wordt de taak niet als afgerond beschouwd.

### Pre-deploy checklist

- [ ] `npm run build` — geen errors
- [ ] `npx tsc --noEmit` — geen type errors
- [ ] `npm run lint` — geen errors
- [ ] Alle API tests (T22) slagen
- [ ] Geen `console.log` debug statements in productie code
- [ ] Environment variables ongewijzigd (geen nieuwe env vars nodig)

### Post-deploy verificatie

- [ ] Homepage laadt (status 200)
- [ ] PATCH /api/alerts zonder key → 401
- [ ] PATCH /api/jobs zonder key → 401
- [ ] /api/search?q=agent&limit=5 → gepagineerde response
- [ ] Dashboard alerts update werkt via UI
- [ ] CommandPanel acties werken via UI

### Rollback strategie

Als deployment faalt:

1. `git revert HEAD` en push
2. Of: `vercel rollback` naar vorige deployment
3. Database migraties zijn additief (geen destructieve changes) — geen DB rollback nodig

---

## Risico-matrix

| Risico                               | Kans   | Impact | Mitigatie                              |
| ------------------------------------ | ------ | ------ | -------------------------------------- |
| RPC functie syntax error             | Laag   | Hoog   | Test met lege array eerst              |
| Client-side calls breken na auth     | Middel | Hoog   | Proxy routes (T10, T11) als tussenlaag |
| usage_statistics constraint conflict | Laag   | Middel | DO/IF NOT EXISTS wrapper               |
| Hook scripts blokkeren CLI           | Laag   | Hoog   | Async uitvoering (& background)        |
| projecten tabel schema mismatch      | Middel | Middel | IF NOT EXISTS guards                   |
| Build faalt na wijzigingen           | Laag   | Hoog   | Per-taak build check                   |

---

## Samenvatting

| Metriek                                     | Waarde  |
| ------------------------------------------- | ------- |
| Totaal taken                                | 23      |
| SQL migraties                               | 4       |
| Gewijzigde bestanden                        | 10      |
| Nieuwe bestanden                            | 4       |
| Nieuwe hook scripts                         | 1       |
| Geschatte uitvoeringstijd (subagent-driven) | 3-4 uur |
