# Command Center Upgrade Plan — Van "Werkt Grotendeels" naar "Absoluut Middelpunt"

**Datum:** 2026-02-18
**Auteur:** Claude Code
**Scope:** 11 concrete gaten dichten
**Geen scope creep:** Alleen wat nodig is voor de 11 issues. Niets extra's.

---

## Analyse-Bevindingen

Voordat ik de gaten adresseer, drie belangrijke ontdekkingen uit de code-analyse:

### Ontdekking A: sync-trigger Edge Function is functioneel beperkt

De pg_cron `sync-trigger` (elke 6u) roept `GET /api/sync` aan — dat retourneert alleen **stats** (hoeveel items per type). Het roept NIET `POST /api/sync` aan (dat de daadwerkelijke sync uitvoert). De Edge Function kan de echte sync niet uitvoeren omdat het de `~/.claude/registry/*.json` bestanden niet kan lezen — die staan op de lokale machine, niet op Supabase Edge.

**Implicatie:** Auto-sync kan NIET via Edge Functions. Het moet een lokaal mechanisme zijn (Claude Code hook).

### Ontdekking B: entity_versions `created_at` is geen echt probleem

De tabel heeft `detected_at` (niet `created_at`). Maar de `timeline.ts` code sorteert al correct op `detected_at` (regel 60). De Timeline view **werkt**. Het STATUS.md issue is verouderd. Wel voegen we voor consistentie een `created_at` alias toe.

### Ontdekking C: Twee project-tabellen, niet gesynchroniseerd

- `projects` (VEHA App, Engels) — waar sync auto-creates naar schrijft
- `projecten` (My-Product, Nederlands + Map extensies) — waar Map/Dossier/Comparison uit leest

De sync maakt projecten aan in de verkeerde tabel voor de Map. Dit verklaart waarom de Map "projecten" mist.

---

## Prioriteiten & Fasering

| Fase | Prioriteit | Issues           | Impact                        |
| ---- | ---------- | ---------------- | ----------------------------- |
| 1    | KRITIEK    | #1, #2, #3, #4   | Systeem functioneert volledig |
| 2    | BELANGRIJK | #5, #6, #7       | Beveiliging + betrouwbaarheid |
| 3    | GEWENST    | #8, #9, #10, #11 | CC als echt middelpunt        |

---

## FASE 1 — KRITIEK

### Issue #1: activity_log is leeg

**Probleem:** Sync schrijft slechts 1 generieke entry per type ("agent sync, count: 20"). Geen per-item logging. Geen activiteit vanuit CLI-gebruik. Activity pagina toont praktisch niets.

**Oorzaak:** `route.ts` regel 159-165 logt alleen een samenvattend record, niet per item.

**Oplossing: Granulaire activity logging in sync + CLI tracking hook**

#### Stap 1.1: Sync route uitbreiden met per-item logging

**Bestand:** `command-center-app/src/app/api/sync/route.ts`

Wijziging: Na de bestaande generieke log (regel 158-165), voeg per-item activity logs toe:

- Voor elk **nieuw** item: `action: 'created'`, `item_type: type`, `item_name: name`, `item_id: uuid`
- Voor elk **verwijderd** item: `action: 'deleted'`, `item_type: type`, `item_name: name`
- Behoud de bestaande samenvattende entry als "synced" event

Belangrijk: Gebruik `supabase.from('activity_log').insert([...array])` (batch insert, niet per item).

```
// Pseudocode toevoeging na regel 165
const activityEntries = []
for (const [project, changes] of changesByProject) {
  for (const name of changes.added) {
    activityEntries.push({
      item_type: type, item_name: name, action: 'created',
      details: { project, source: 'sync' }
    })
  }
  for (const name of changes.removed) {
    activityEntries.push({
      item_type: type, item_name: name, action: 'deleted',
      details: { project, source: 'sync' }
    })
  }
}
if (activityEntries.length > 0) {
  await supabase.from('activity_log').insert(activityEntries)
}
```

#### Stap 1.2: CLI activity tracking via sync script

**Bestand:** `command-center-app/scripts/sync-registry.mjs`

Wijziging: Na elke succesvolle sync type, stuur een POST naar `/api/activity`:

```
POST /api/activity
{
  "item_type": "system",
  "item_name": "Registry Sync",
  "action": "synced",
  "details": { "types_synced": [...], "total_items": N, "triggered_by": "cli" }
}
```

#### Stap 1.3: Error handling toevoegen aan activity logging

**Bestand:** `command-center-app/src/app/api/sync/route.ts`

De huidige activity log insert (regel 159) heeft geen error check. Voeg toe:

```
const { error: actError } = await supabase.from('activity_log').insert(...)
if (actError) console.error('Activity log error:', actError)
```

Geen harde fout — activity logging mag niet de sync blokkeren.

**Test:** Draai `/sync-cc`, controleer of Activity pagina nu individuele items toont.

---

### Issue #2: entity_versions mist `created_at` kolom

**Probleem:** STATUS.md vermeldt dit als issue. Analyse toont: de tabel heeft `detected_at` en de code gebruikt dit correct. Maar voor consistentie met andere tabellen is een `created_at` kolom wenselijk.

**Oorzaak:** Schema-ontwerp koos `detected_at` als naamgeving. Niet fout, maar inconsistent.

**Oplossing: `created_at` kolom toevoegen als alias**

#### Stap 2.1: SQL migratie

**Nieuw bestand:** `supabase/migrations/[timestamp]_add_created_at_to_entity_versions.sql`

```sql
-- Voeg created_at toe als alias voor detected_at (voor consistentie)
ALTER TABLE entity_versions
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Vul bestaande rijen
UPDATE entity_versions SET created_at = detected_at WHERE created_at IS NULL;

-- Index voor sortering
CREATE INDEX IF NOT EXISTS idx_entity_ver_created ON entity_versions(created_at DESC);
```

#### Stap 2.2: Sync route bijwerken

**Bestand:** `command-center-app/src/app/api/sync/route.ts`

In het versionEntries object (regel 198-207), voeg `created_at` toe naast de bestaande velden:

```
created_at: new Date().toISOString()
```

#### Stap 2.3: TypeScript type bijwerken

**Bestand:** `command-center-app/src/lib/timeline.ts`

Voeg `created_at` toe aan de `EntityVersion` interface (regel 24-35):

```
created_at: string  // Alias voor detected_at, voor consistentie
```

**Test:** Controleer dat Timeline view nog correct sorteert. Check dat nieuwe sync entries beide velden hebben.

---

### Issue #3: Geen auto-sync

**Probleem:** Dashboard loopt altijd achter. Gebruiker moet handmatig `/sync-cc` draaien. De pg_cron sync-trigger werkt niet voor echte sync (zie Ontdekking A).

**Oorzaak:** Geen lokaal mechanisme dat automatisch synct na wijzigingen.

**Oplossing: Claude Code PostToolUse hook + verbeterde sync-trigger**

#### Stap 3.1: Auto-sync hook aanmaken

**Nieuw bestand:** `~/.claude/hooks/auto-sync-registry.sh`

```bash
#!/bin/bash
# PostToolUse hook: sync registry naar CC na wijzigingen in ~/.claude/registry/
# Triggert alleen bij Write/Edit acties op registry bestanden

REGISTRY_DIR="$HOME/.claude/registry"
TOOL_NAME="$1"    # Write, Edit, etc.
FILE_PATH="$2"    # Het pad van het bewerkte bestand

# Alleen triggeren bij schrijfacties op registry bestanden
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

if [[ "$FILE_PATH" != "$REGISTRY_DIR"* ]]; then
  exit 0
fi

# Debounce: alleen syncen als laatste sync > 60 seconden geleden
LOCK_FILE="/tmp/cc-auto-sync-last"
if [ -f "$LOCK_FILE" ]; then
  LAST_SYNC=$(cat "$LOCK_FILE")
  NOW=$(date +%s)
  DIFF=$((NOW - LAST_SYNC))
  if [ "$DIFF" -lt 60 ]; then
    exit 0
  fi
fi

# Async sync triggeren (niet-blokkerend)
date +%s > "$LOCK_FILE"
cd ~/projects/command-center/command-center-app && \
  SYNC_API_KEY=$(grep SYNC_API_KEY .env.local | cut -d= -f2) \
  npm run sync > /tmp/cc-auto-sync.log 2>&1 &

exit 0
```

#### Stap 3.2: Hook registreren in settings

**Bestand:** `~/.claude/settings.json`

Voeg de hook toe aan de hooks configuratie. De hookify plugin detecteert hooks in `~/.claude/hooks/`.

#### Stap 3.3: Sync-trigger Edge Function fixen (optioneel, lagere prioriteit)

**Bestand:** `supabase/functions/sync-trigger/index.ts`

De huidige sync-trigger roept GET /api/sync aan (alleen stats). Dit is geen echte sync. Twee opties:

- **Optie A (aanbevolen):** Verander de sync-trigger naar een health-check-only trigger. Hernoem naar "status-check". De echte sync gebeurt lokaal via de hook.
- **Optie B:** Laat de sync-trigger een POST doen, maar dan moet de Edge Function de registry data ergens vandaan halen. Dit vereist dat de CLI de registry data naar Supabase storage uploadt — te complex voor nu.

Aanbeveling: Optie A — verduidelijk dat sync-trigger alleen status checkt, niet daadwerkelijk synct.

**Bestand:** `supabase/functions/sync-trigger/index.ts` — comment toevoegen dat GET /api/sync alleen stats ophaalt.

#### Stap 3.4: Sync-cc command bijwerken

**Bestand:** `~/.claude/commands/sync-cc.md`

Voeg toe: melding dat auto-sync actief is via hook, en dat `/sync-cc` alleen nog nodig is als fallback.

**Test:** Wijzig een registry bestand, wacht 60 seconden, controleer of dashboard bijgewerkt is.

---

### Issue #4: Usage statistics leeg

**Probleem:** Het "Meest gebruikt" paneel op de Map toont niets. De POST endpoint bestaat maar niets roept het aan.

**Oorzaak:** Geen automatische tracking. De /api/usage POST is een dode endpoint.

**Oplossing: Usage tracking in sync pipeline + CLI command tracking**

#### Stap 4.1: Usage tracking toevoegen aan sync

**Bestand:** `command-center-app/src/app/api/sync/route.ts`

Na de INSERT van items, stuur een usage update voor elk item dat gesynced wordt:

```
// Track sync as usage event
const usageEntries = dbItems.map(item => ({
  entity_type: type,
  entity_id: item.name,
  metric: 'synced',
  value: 1,
  period: new Date().toISOString().slice(0, 7), // YYYY-MM
  last_used: new Date().toISOString(),
}))

await supabase.from('usage_statistics').upsert(usageEntries, {
  onConflict: 'entity_type,entity_id,metric,period',
  ignoreDuplicates: false,
})
```

Opmerking: Dit vereist een UNIQUE constraint op (entity_type, entity_id, metric, period).

#### Stap 4.2: SQL migratie voor upsert constraint

**Nieuw bestand:** `supabase/migrations/[timestamp]_add_usage_upsert_constraint.sql`

```sql
-- Unique constraint voor upsert
ALTER TABLE usage_statistics
  ADD CONSTRAINT usage_unique_entity_metric_period
  UNIQUE (entity_type, entity_id, metric, period);
```

#### Stap 4.3: CLI command usage tracking via hook

**Nieuw bestand:** `~/.claude/hooks/track-command-usage.sh`

```bash
#!/bin/bash
# PostToolUse hook: track welke commands gebruikt worden
# Triggert bij Skill tool calls

TOOL_NAME="$1"
if [[ "$TOOL_NAME" != "Skill" ]]; then
  exit 0
fi

SKILL_NAME="$2"
if [ -z "$SKILL_NAME" ]; then
  exit 0
fi

# Async POST naar usage API
API_URL="https://command-center-app-nine.vercel.app/api/usage"
API_KEY=$(grep SYNC_API_KEY ~/projects/command-center/command-center-app/.env.local 2>/dev/null | cut -d= -f2)

if [ -n "$API_KEY" ]; then
  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"entity_type\":\"command\",\"entity_id\":\"$SKILL_NAME\",\"metric\":\"invocations\",\"value\":1}" \
    > /dev/null 2>&1 &
fi

exit 0
```

**Opmerking:** De haalbaarheid van deze hook hangt af van hoe Claude Code hook parameters doorgeeft. Als de Skill naam niet beschikbaar is als parameter, moet dit anders opgelost worden (bijv. via een wrapper in de sync-cc command die na elke sessie een POST stuurt met gebruikte commands).

**Alternatief (eenvoudiger):** Voeg aan het einde van `/sync-cc` een sectie toe die het aantal keer dat elk registry item in de `~/.claude/` directory voorkomt telt als proxy voor "gebruik".

#### Stap 4.4: UsagePanel verbinden met echte data

**Bestand:** `command-center-app/src/components/map/UsagePanel.tsx`

Controleer of dit component al `GET /api/usage?summary=true` aanroept. Zo ja, zou het nu data moeten tonen na stap 4.1. Zo nee, voeg de fetch toe.

**Test:** Draai `/sync-cc`, controleer of "Meest gebruikt" paneel op Map nu data toont.

---

## FASE 2 — BELANGRIJK (Beveiliging & Betrouwbaarheid)

### Issue #5: Alerts/Jobs PATCH endpoints hebben geen auth

**Probleem:** Iedereen met de URL kan alert status wijzigen of job status manipuleren.

**Oorzaak:** PATCH handlers hebben geen x-api-key check (in tegenstelling tot POST handlers die dat wel hebben).

**Oplossing: Auth middleware toevoegen aan PATCH endpoints**

#### Stap 5.1: Auth toevoegen aan alerts PATCH

**Bestand:** `command-center-app/src/app/api/alerts/route.ts`

Voeg toe aan het begin van de PATCH functie (na regel 29):

```typescript
const apiKey = request.headers.get("x-api-key");
if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

#### Stap 5.2: Auth toevoegen aan jobs PATCH

**Bestand:** `command-center-app/src/app/api/jobs/route.ts`

Voeg toe aan het begin van de PATCH functie (na regel 61):

```typescript
const apiKey = request.headers.get("x-api-key");
if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

#### Stap 5.3: Auth toevoegen aan jobs POST

**Bestand:** `command-center-app/src/app/api/jobs/route.ts`

Jobs POST (regel 35) heeft ook geen auth. Voeg dezelfde check toe.

#### Stap 5.4: Dashboard client bijwerken

**Bestanden:** Alle client-side componenten die PATCH /api/alerts of PATCH /api/jobs aanroepen.

Zoek alle `fetch('/api/alerts'` en `fetch('/api/jobs'` calls en voeg de `x-api-key` header toe. Omdat dit een client-side call is vanuit het dashboard zelf, hebben we twee opties:

- **Optie A (aanbevolen):** Maak een `/api/alerts/internal` route die GEEN auth vereist maar alleen beschikbaar is via server-side calls. Laat de client-side PATCH calls via een eigen API proxy gaan.
- **Optie B:** Sla de API key op als `NEXT_PUBLIC_` env var (NIET veilig voor productie, maar acceptabel omdat het dashboard geen publieke gebruikers heeft).
- **Optie C:** Voeg een simpele server-side API route toe (`/api/alerts/update`) die als proxy dient: client → proxy (geen auth nodig, zelfde origin) → Supabase.

Aanbeveling: **Optie C** — maak server-side proxy routes. De client-side componenten hoeven geen API key te kennen.

#### Stap 5.5: Controleer Edge Functions

**Bestanden:** `supabase/functions/health-check/index.ts`, `supabase/functions/sync-trigger/index.ts`

Deze functies schrijven direct naar alerts/job_queue via Supabase client (niet via API). Ze worden niet geraakt door de auth-wijziging. Geen actie nodig.

**Test:** Probeer PATCH /api/alerts zonder key → verwacht 401. Probeer via dashboard → verwacht succes.

---

### Issue #6: Homepage Promise.all zonder try/catch

**Probleem:** `page.tsx` regel 34: `await Promise.all([...])` zonder error handling. Als Supabase onbereikbaar is, crasht de hele homepage.

**Oorzaak:** Server Component zonder foutafhandeling.

**Oplossing: Graceful degradation met try/catch en fallback waarden**

#### Stap 6.1: Homepage wrappen in try/catch

**Bestand:** `command-center-app/src/app/(dashboard)/page.tsx`

```typescript
// Vervang regels 34-40 met:
let stats: AssetStats = {
  apis: 0,
  prompts: 0,
  skills: 0,
  agents: 0,
  commands: 0,
  instructions: 0,
};
let recentActivity: any[] = [];
let projects: any[] = [];
let recentChanges: any[] = [];
let openAlerts: any[] = [];
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

#### Stap 6.2: Error banner tonen in UI

**Bestand:** `command-center-app/src/app/(dashboard)/page.tsx`

Voeg boven de stats grid toe:

```tsx
{
  dataError && (
    <div className="mb-6 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30 px-4 py-3">
      <p className="text-sm text-zinc-500">
        Kan geen verbinding maken met de database. Data kan verouderd zijn.
      </p>
    </div>
  );
}
```

**Test:** Tijdelijk een foute Supabase URL instellen, controleer dat homepage laadt met lege data + error banner.

---

### Issue #7: Sync heeft geen rollback

**Probleem:** Sync doet DELETE → INSERT. Als INSERT faalt na DELETE, is alle data van dat type kwijt.

**Oorzaak:** Geen transactie, geen backup, geen rollback strategie.

**Oplossing: Backup-before-delete pattern + Supabase RPC transactie**

#### Stap 7.1: Supabase RPC functie voor atomaire sync

**Nieuw bestand:** `supabase/migrations/[timestamp]_add_sync_transaction_rpc.sql`

```sql
-- Atomaire sync: DELETE + INSERT in één transactie
CREATE OR REPLACE FUNCTION sync_registry_items(
  p_type text,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_deleted int;
  v_inserted int;
BEGIN
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
    COALESCE((SELECT array_agg(t::text) FROM jsonb_array_elements_text(item->'tags') t), '{}'),
    COALESCE(item->'metadata', '{}'),
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
```

#### Stap 7.2: Sync route aanpassen om RPC te gebruiken

**Bestand:** `command-center-app/src/app/api/sync/route.ts`

Vervang regels 129-156 (de DELETE + INSERT blokken) met:

```typescript
// Atomaire sync via RPC (transactie: alles of niets)
const { data: rpcResult, error: rpcError } = await supabase.rpc(
  "sync_registry_items",
  {
    p_type: type,
    p_items: JSON.stringify(dbItems),
  },
);

if (rpcError) {
  console.error("Sync RPC error:", rpcError);
  return NextResponse.json(
    { error: `Sync failed (transaction rolled back): ${rpcError.message}` },
    { status: 500 },
  );
}
```

Als de INSERT faalt, wordt de hele transactie teruggedraaid (PostgreSQL transactie-semantiek in een PL/pgSQL functie). De DELETE wordt dan ook ongedaan gemaakt.

**Test:** Forceer een INSERT fout (bijv. ongeldige UUID), controleer dat bestaande items behouden blijven.

---

## FASE 3 — GEWENST (CC als Echt Middelpunt)

### Issue #8: Geen project auto-discovery

**Probleem:** Nieuwe projecten in ~/projects/ zijn onzichtbaar totdat je handmatig `/onboard` of `/connect-project` draait.

**Oorzaak:** Geen automatische detectie van nieuwe project directories.

**Oplossing: Project discovery scan in sync pipeline**

#### Stap 8.1: Discovery script toevoegen

**Nieuw bestand:** `command-center-app/scripts/discover-projects.mjs`

```javascript
// Scant ~/projects/ voor nieuwe projecten
// Vergelijkt met Supabase projecten tabel
// Rapporteert nieuwe/verdwenen projecten

import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const PROJECTS_DIR = join(process.env.HOME, "projects");

function discoverProjects() {
  const dirs = readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        !d.name.startsWith(".") &&
        d.name !== "done" &&
        d.name !== "node_modules",
    )
    .map((d) => {
      const projectPath = join(PROJECTS_DIR, d.name);
      const info = { name: d.name, slug: d.name, path: projectPath };

      // Detecteer tech stack
      if (existsSync(join(projectPath, "package.json"))) {
        try {
          const pkg = JSON.parse(
            readFileSync(join(projectPath, "package.json"), "utf-8"),
          );
          info.techStack = Object.keys(pkg.dependencies || {}).slice(0, 10);
          info.description = pkg.description || null;
        } catch {}
      }

      // Check voor CLAUDE.md
      if (existsSync(join(projectPath, "CLAUDE.md"))) {
        info.hasClaude = true;
      }

      return info;
    });

  return dirs;
}
```

#### Stap 8.2: Discovery integreren in sync script

**Bestand:** `command-center-app/scripts/sync-registry.mjs`

Voeg een `discoverProjects()` stap toe aan het einde van de sync:

```javascript
// Na registry sync, check voor nieuwe projecten
const discoveredProjects = discoverProjects();
for (const project of discoveredProjects) {
  // POST naar /api/projects/[slug] als project nog niet bestaat
  const res = await fetch(`${API_BASE}/api/projects/${project.slug}`, {
    method: "GET",
    headers: { "x-api-key": API_KEY },
  });
  if (res.status === 404) {
    console.log(`  [NEW] Project ontdekt: ${project.name}`);
    // Create project via API
    await fetch(`${API_BASE}/api/projects/${project.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify(project),
    });
  }
}
```

#### Stap 8.3: Sync route: projecten in juiste tabel

**Bestand:** `command-center-app/src/app/api/sync/route.ts`

De huidige auto-create (regels 240-274) schrijft naar de `projects` tabel. Maar de Map/Dossier/Comparison leest uit `projecten`. Twee opties:

- **Optie A (aanbevolen):** Schrijf naar BEIDE tabellen. `projects` voor het VEHA project management, `projecten` voor de Map/Dossier. Dit dupliceert data maar zorgt dat alle views werken.
- **Optie B:** Migreer alle Map/Dossier code naar `projects` tabel. Dit is een grotere refactor (veel bestanden: map.ts, comparison.ts, project-dossier.ts, deep-scan/storage.ts).

Aanbeveling: **Optie A** voor nu — voeg een `projecten` insert toe naast de bestaande `projects` insert. De Map heeft een `slug` kolom nodig die via een migratie moet worden toegevoegd.

#### Stap 8.4: SQL migratie voor projecten.slug

**Nieuw bestand:** `supabase/migrations/[timestamp]_add_slug_and_name_to_projecten.sql`

```sql
-- Voeg slug en name toe aan projecten (als die nog niet bestaan)
-- De projecten tabel heeft 'naam' (NL), de code verwacht ook 'name' en 'slug'
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS name text;

-- Vul bestaande rijen
UPDATE projecten SET
  slug = lower(replace(naam, ' ', '-')),
  name = naam
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_projecten_slug ON projecten(slug);
```

**Test:** Voeg een nieuw project toe in ~/projects/, draai sync, controleer of het in de Map verschijnt.

---

### Issue #9: Geen hook voor sessie-einde

**Probleem:** STATUS.md wordt alleen geschreven als je `/session-status` draait. Sessie-informatie gaat verloren.

**Oorzaak:** Geen automatisch mechanisme bij sessie-einde.

**Oplossing: Claude Code stop hook**

#### Stap 9.1: Sessie-einde hook aanmaken

**Nieuw bestand:** `~/.claude/hooks/session-end-status.sh`

```bash
#!/bin/bash
# Hook: wordt aangeroepen bij het afsluiten van Claude Code
# Genereert een minimale sessie-log entry

PROJECT_DIR=$(pwd)
STATUS_FILE="$PROJECT_DIR/STATUS.md"
LOGBOEK_FILE="$PROJECT_DIR/LOGBOEK.md"

# Alleen uitvoeren als we in een project directory zijn
if [[ "$PROJECT_DIR" != "$HOME/projects/"* ]]; then
  exit 0
fi

# Alleen als STATUS.md bestaat (= geregistreerd project)
if [ ! -f "$STATUS_FILE" ]; then
  exit 0
fi

# Datum bijwerken in STATUS.md
DATE=$(date '+%Y-%m-%d %H:%M')
sed -i "s/\*\*Laatste update:\*\* .*/\*\*Laatste update:\*\* $DATE/" "$STATUS_FILE"

# Minimale logboek entry
if [ -f "$LOGBOEK_FILE" ]; then
  echo "" >> "$LOGBOEK_FILE"
  echo "## $DATE" >> "$LOGBOEK_FILE"
  echo "### Sessie: automatische afsluiting" >> "$LOGBOEK_FILE"
  echo "- Sessie beëindigd" >> "$LOGBOEK_FILE"
fi
```

**Opmerking:** Claude Code hooks ondersteunen momenteel `PreToolUse` en `PostToolUse` events, maar geen `SessionEnd` event. Controleer de Claude Code documentatie voor beschikbare hook events. Als `SessionEnd` niet beschikbaar is, moet dit via een alternatieve aanpak:

#### Stap 9.2: Alternatief — Dagstart check

**Bestand:** `~/.claude/commands/dagstart.md`

Voeg aan het `/dagstart` command toe: controleer of de vorige sessie een STATUS.md update had. Zo nee, genereer een melding.

#### Stap 9.3: Activity log bij sessie-start

**Bestand:** `~/.claude/commands/dagstart.md`

Voeg toe: POST naar `/api/activity` met `action: 'session_start'` zodat er altijd een audit trail is, ook als de sessie niet netjes afgesloten wordt.

**Test:** Start een sessie, sluit af, controleer of LOGBOEK.md een entry heeft.

---

### Issue #10: Search heeft geen paginatie

**Probleem:** Search API retourneert ALLE resultaten. Bij veel items worden ze afgekapt in de UI.

**Oorzaak:** Geen limit/offset parameters. Geen server-side filtering.

**Oplossing: Server-side filtering + paginatie**

#### Stap 10.1: Search API uitbreiden

**Bestand:** `command-center-app/src/app/api/search/route.ts`

Voeg query parameters toe:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')
  const category = searchParams.get('category') || undefined // asset | project | task | page
```

Wijzig de Supabase queries om `.limit()` te gebruiken:

```typescript
const [registryResult, projectsResult, tasksResult] = await Promise.all([
  supabase
    .from("registry_items")
    .select("id, type, name, description, project")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit),
  supabase
    .from("projects")
    .select("id, name, slug, description")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit),
  supabase
    .from("kanban_tasks")
    .select("id, title, project, status")
    .ilike("title", `%${query}%`)
    .limit(limit),
]);
```

Voeg total count toe aan response:

```typescript
return NextResponse.json({
  items: items.slice(offset, offset + limit),
  total: items.length,
  limit,
  offset,
});
```

#### Stap 10.2: SearchDialog component bijwerken

**Bestand:** `command-center-app/src/components/search/SearchDialog.tsx`

Voeg "meer laden" knop toe wanneer `total > offset + limit`.

**Test:** Zoek op een breed begrip, controleer dat resultaten gepagineerd worden.

---

### Issue #11: Geen bulk operaties in registry

**Probleem:** Alles is per-item. Geen manier om meerdere items tegelijk te bewerken.

**Oorzaak:** API is ontworpen voor sync (per type), niet voor bulk bewerking.

**Oplossing: Bulk operations endpoint**

#### Stap 11.1: Bulk API route aanmaken

**Nieuw bestand:** `command-center-app/src/app/api/registry/bulk/route.ts`

```typescript
// POST /api/registry/bulk
// Body: { action: 'delete' | 'update-tags' | 'move-project', ids: string[], data?: {} }

export async function POST(request: NextRequest) {
  // Auth check
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, ids, data } = await request.json();

  if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "action and ids[] required" },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  switch (action) {
    case "delete":
      await supabase.from("registry_items").delete().in("id", ids);
      break;
    case "update-tags":
      if (!data?.tags)
        return NextResponse.json(
          { error: "data.tags required" },
          { status: 400 },
        );
      await supabase
        .from("registry_items")
        .update({ tags: data.tags })
        .in("id", ids);
      break;
    case "move-project":
      if (!data?.project)
        return NextResponse.json(
          { error: "data.project required" },
          { status: 400 },
        );
      await supabase
        .from("registry_items")
        .update({ project: data.project })
        .in("id", ids);
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Log bulk action
  await supabase.from("activity_log").insert({
    item_type: "system",
    item_name: `Bulk ${action}`,
    action: "updated",
    details: { action, count: ids.length },
  });

  return NextResponse.json({ success: true, affected: ids.length });
}
```

#### Stap 11.2: Registry pagina UI uitbreiden

**Bestand:** `command-center-app/src/app/(dashboard)/registry/page.tsx`

Voeg selectie-checkboxes toe aan registry items + een bulk action bar:

- Selecteer meerdere items (checkboxes)
- Bulk actions: Verwijderen, Tags wijzigen, Project verplaatsen

Dit is een client-side component wijziging. De registry pagina moet een `'use client'` wrapper krijgen voor de selectie-state.

**Test:** Selecteer 5 items, verwijder ze, controleer dat ze weg zijn.

---

## SQL Migraties Overzicht

| #   | Migratie                                | Fase | Issue |
| --- | --------------------------------------- | ---- | ----- |
| 1   | `add_created_at_to_entity_versions.sql` | 1    | #2    |
| 2   | `add_usage_upsert_constraint.sql`       | 1    | #4    |
| 3   | `add_sync_transaction_rpc.sql`          | 2    | #7    |
| 4   | `add_slug_and_name_to_projecten.sql`    | 3    | #8    |

---

## Bestanden Overzicht

### Gewijzigde bestanden (14)

| Bestand                                                     | Issue(s)       |
| ----------------------------------------------------------- | -------------- |
| `command-center-app/src/app/api/sync/route.ts`              | #1, #2, #7, #8 |
| `command-center-app/src/app/api/alerts/route.ts`            | #5             |
| `command-center-app/src/app/api/jobs/route.ts`              | #5             |
| `command-center-app/src/app/api/search/route.ts`            | #10            |
| `command-center-app/src/app/(dashboard)/page.tsx`           | #6             |
| `command-center-app/src/lib/timeline.ts`                    | #2             |
| `command-center-app/src/components/search/SearchDialog.tsx` | #10            |
| `command-center-app/scripts/sync-registry.mjs`              | #1, #8         |
| `supabase/functions/sync-trigger/index.ts`                  | #3             |
| `~/.claude/commands/sync-cc.md`                             | #3             |
| `~/.claude/commands/dagstart.md`                            | #9             |
| `~/.claude/settings.json`                                   | #3, #4         |

### Nieuwe bestanden (7)

| Bestand                                                          | Issue |
| ---------------------------------------------------------------- | ----- |
| `supabase/migrations/[ts]_add_created_at_to_entity_versions.sql` | #2    |
| `supabase/migrations/[ts]_add_usage_upsert_constraint.sql`       | #4    |
| `supabase/migrations/[ts]_add_sync_transaction_rpc.sql`          | #7    |
| `supabase/migrations/[ts]_add_slug_and_name_to_projecten.sql`    | #8    |
| `~/.claude/hooks/auto-sync-registry.sh`                          | #3    |
| `~/.claude/hooks/track-command-usage.sh`                         | #4    |
| `command-center-app/src/app/api/registry/bulk/route.ts`          | #11   |

Optioneel nieuw:
| `~/.claude/hooks/session-end-status.sh` | #9 (afhankelijk van hook support) |
| `command-center-app/scripts/discover-projects.mjs` | #8 |

---

## Implementatievolgorde (Aanbevolen)

```
FASE 1 — KRITIEK
  ├── #2 entity_versions created_at (klein, 30 min)
  │     → SQL migratie + type update
  ├── #1 activity_log vullen (middel, 1-2 uur)
  │     → Sync route uitbreiden + error handling
  ├── #3 auto-sync hook (middel, 1-2 uur)
  │     → Hook aanmaken + sync-cc bijwerken
  └── #4 usage statistics (middel, 1-2 uur)
        → SQL migratie + sync tracking + hook

FASE 2 — BELANGRIJK
  ├── #5 auth op PATCH endpoints (klein, 30 min)
  │     → 3 auth checks toevoegen
  ├── #6 homepage try/catch (klein, 30 min)
  │     → Wrap + error banner
  └── #7 sync rollback (middel, 1-2 uur)
        → SQL RPC functie + route aanpassen

FASE 3 — GEWENST
  ├── #10 search paginatie (klein-middel, 1 uur)
  │     → API params + UI "meer laden"
  ├── #8 project auto-discovery (middel, 1-2 uur)
  │     → Discovery script + projecten sync fix
  ├── #9 sessie-einde hook (klein, 30 min)
  │     → Hook + dagstart check
  └── #11 bulk operaties (middel, 1-2 uur)
        → Nieuwe API route + registry UI
```

---

## Risico's & Aandachtspunten

| Risico                                      | Impact               | Mitigatie                               |
| ------------------------------------------- | -------------------- | --------------------------------------- |
| RPC functie faalt op productie              | Data verlies         | Test eerst op preview deployment        |
| Hook scripts blokkeren Claude Code          | Workflow stokt       | Alle hooks async (& achtergrond)        |
| Dual-tabel schrijven (projects + projecten) | Data inconsistentie  | Op termijn consolideren naar 1 tabel    |
| usage_statistics upsert constraint conflict | Sync faalt           | Test constraint op bestaande data eerst |
| Claude Code hook events beperkt             | Auto-sync werkt niet | Fallback naar /sync-cc reminder         |

---

## Buiten Scope (Genoteerd, Niet Aangepakt)

- `projecten` vs `projects` tabel consolidatie (grote refactor, apart project)
- Alert email notificaties (vereist email service)
- Error boundaries per component (Next.js `error.tsx` bestanden)
- Sync-trigger Edge Function omschrijven naar echte sync (vereist externe registry storage)
- Mobile responsive fixes
- Dark mode inconsistenties
