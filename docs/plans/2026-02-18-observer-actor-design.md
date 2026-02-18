# Observer + Actor: Live & Actionable Command Center

**Datum:** 2026-02-18
**Status:** Goedgekeurd
**Doel:** Command Center v2 transformeren van read-only dashboard naar een levend, actionable systeem met automatische sync, real-time alerts en directe acties.

---

## Probleem

1. **Data is verouderd** — Sync en deep scan moeten handmatig gedraaid worden
2. **Dashboard is passief** — Mooi om naar te kijken, maar geen alerts of acties mogelijk

## Oplossing

**Observer + Actor** architectuur:
- **Observer:** Supabase Edge Functions + pg_cron die automatisch data verzamelen en analyseren
- **Actor:** Dashboard met alerts, command panel en real-time updates via Supabase Realtime

---

## Architectuur

```
┌──────────────────────────────────────────────────────┐
│                    DASHBOARD (Next.js)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Alert    │ │ Command  │ │ Refresh  │ │ Notif   │ │
│  │ Page     │ │ Panel    │ │ Status   │ │ Bell    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │            │            │             │      │
│  ┌────┴────────────┴────────────┴─────────────┴────┐ │
│  │         Supabase Realtime (websocket)           │ │
│  └─────────────────────┬───────────────────────────┘ │
└────────────────────────┼─────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────┐
│                   SUPABASE (Pro)                     │
│  ┌─────────────────────┴───────────────────────────┐ │
│  │              Database (PostgreSQL)               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │
│  │  │ alerts   │ │ job_queue│ │ sync_status      │ │ │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │          Database Triggers (PL/pgSQL)           │ │
│  │  Na sync complete → trigger health check        │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │           Edge Functions (Deno)                 │ │
│  │  ┌────────────┐ ┌───────────┐ ┌──────────────┐ │ │
│  │  │sync-trigger│ │health-chk │ │alert-digest  │ │ │
│  │  └────────────┘ └───────────┘ └──────────────┘ │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │           pg_cron                               │ │
│  │  Elke 6u: sync-trigger                          │ │
│  │  Elke ochtend 7:00: alert-digest                │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────┐
│              CLAUDE CODE (lokaal)                     │
│  ┌─────────────────────┴───────────────────────────┐ │
│  │           Session Hook                          │ │
│  │  Bij sessie-einde → POST /api/sync              │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Data Flow

1. **Trigger:** pg_cron (elke 6u) OF Claude Code hook OF dashboard knop
2. **Sync:** `sync-trigger` Edge Function roept Next.js `/api/sync` aan
3. **Health Check:** Database trigger na sync → `health-check` Edge Function draait checks
4. **Alert Generatie:** Health check genereert/update alerts in `alerts` tabel
5. **Real-time Push:** Supabase Realtime pusht nieuwe alerts naar dashboard
6. **Dashboard:** Notification bell + alerts pagina + actie-suggesties

### Belangrijk

Registry sync (leest `~/.claude/`) blijft een Next.js API route omdat Edge Functions geen lokale bestanden kunnen lezen. Health checks en alerts draaien in Supabase Edge Functions (directe DB access).

---

## Database Schema

### Nieuwe tabel: `alerts`

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `type` | text NOT NULL | `unhealthy_project`, `stale_asset`, `dependency_issue`, `orphan_detected`, `sync_failed`, `cluster_issue` |
| `severity` | text NOT NULL | `critical`, `warning`, `info` |
| `title` | text NOT NULL | Korte beschrijving |
| `description` | text | Details + fix suggestie |
| `entity_type` | text | project, asset, dependency, cluster |
| `entity_id` | text | ID/slug van het item |
| `status` | text NOT NULL DEFAULT 'new' | `new`, `acknowledged`, `resolved`, `dismissed` |
| `metadata` | jsonb | Extra context |
| `created_at` | timestamptz DEFAULT NOW() | |
| `resolved_at` | timestamptz | |

### Nieuwe tabel: `job_queue`

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `type` | text NOT NULL | `registry_sync`, `deep_scan`, `health_check`, `code_analysis` |
| `status` | text NOT NULL DEFAULT 'pending' | `pending`, `running`, `completed`, `failed` |
| `payload` | jsonb | Parameters |
| `result` | jsonb | Resultaat |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz | |
| `created_at` | timestamptz DEFAULT NOW() | |
| `error` | text | Foutmelding bij failure |

### Nieuwe tabel: `sync_status`

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | text PK | `registry_sync`, `deep_scan`, `health_check` |
| `last_run_at` | timestamptz | Wanneer laatst gedraaid |
| `status` | text NOT NULL | `success`, `failed`, `running` |
| `duration_ms` | integer | Duur in ms |
| `items_processed` | integer | Aantal items verwerkt |
| `next_run_at` | timestamptz | Volgende geplande run |

### Database Trigger

```sql
-- Na sync complete → queue health check
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
```

---

## Edge Functions

### 1. `sync-trigger` (pg_cron: elke 6u)

```
1. Maak job_queue entry (type=registry_sync, status=pending)
2. POST naar https://command-center-app-nine.vercel.app/api/sync
   met x-api-key header
3. Update job_queue status (completed/failed)
4. Update sync_status record
```

### 2. `health-check` (getriggerd na sync)

Checks:

| Check | Severity | Conditie |
|-------|----------|----------|
| Unhealthy project | critical | project_metrics.health = 'unhealthy' OF errors > 10 |
| Stale project | warning | Geen registry_items wijziging in >30 dagen |
| Dependency issues | warning | Major version achterstand in project_dependencies |
| Orphan assets | info | registry_items zonder project koppeling |
| Sync failure | critical | Vorige sync job status = 'failed' |
| Cluster issues | info | system_clusters met >20 members zonder structuur |

Logica:
```
1. Lees projecten + metrics + dependencies
2. Draai elke check
3. Vergelijk met bestaande open alerts (voorkom duplicaten)
4. INSERT nieuwe alerts / UPDATE bestaande
5. Auto-resolve alerts waar conditie niet meer geldt
6. Update sync_status
```

### 3. `alert-digest` (pg_cron: dagelijks 7:00)

```
1. Tel open alerts per severity
2. Maak samenvatting entry in alerts tabel (type=daily_digest)
3. Eventueel: auto-resolve alerts ouder dan 7 dagen als situatie verbeterd
```

### pg_cron Schedules

```sql
-- Elke 6 uur sync
SELECT cron.schedule('sync-every-6h', '0 */6 * * *',
  $$ SELECT net.http_post(...sync-trigger...) $$);

-- Dagelijks 7:00 digest
SELECT cron.schedule('daily-digest', '0 7 * * *',
  $$ SELECT net.http_post(...alert-digest...) $$);
```

---

## Dashboard UI

### Nieuwe componenten

| Component | Locatie | Functie |
|-----------|---------|---------|
| `NotificationBell.tsx` | `components/shell/` | Bell icoon in header met badge count, dropdown met laatste 5 alerts |
| `CommandPanel.tsx` | `components/shell/` | Cmd+J palette: sync, scan, analyse, health check triggers |
| `SyncStatus.tsx` | `components/shell/` | Footer indicator: "Gesynchroniseerd 2u geleden" met status dot |
| `AttentionSection.tsx` | `components/dashboard/` | Homepage sectie met critical + warning alerts |
| `AlertsList.tsx` | `components/alerts/` | Alerts pagina met filters en bulk acties |
| `useRealtimeAlerts.ts` | `hooks/` | Supabase Realtime hook voor live alert updates |

### Nieuwe pagina

| Pagina | Route | Functie |
|--------|-------|---------|
| Alerts | `/alerts` | Filter chips (severity), status tabs, per-alert detail + actie suggestie |

### Bestaande wijzigingen

| Component | Wijziging |
|-----------|-----------|
| `AppShell.tsx` | NotificationBell + SyncStatus toevoegen |
| `MainNav.tsx` | "Alerts" nav item toevoegen |
| Homepage `page.tsx` | AttentionSection bovenaan toevoegen |
| `QuickActions.tsx` | "Sync Now" en "Health Check" knoppen toevoegen |

---

## Claude Code Integration

### Session Hook

```json
{
  "event": "stop",
  "command": "curl -s -X POST https://command-center-app-nine.vercel.app/api/sync -H 'x-api-key: $SYNC_API_KEY'"
}
```

### Dashboard Refresh

Handmatige trigger via:
- QuickActions FAB → "Sync Now"
- Command Panel (Cmd+J) → "Sync Registry"

---

## Bestanden Overzicht

| Type | Bestanden | Aantal |
|------|-----------|--------|
| SQL migratie | `supabase/migrations/` | 1 |
| Edge Functions | `supabase/functions/{sync-trigger,health-check,alert-digest}/index.ts` | 3 |
| API routes | `app/api/alerts/route.ts`, `app/api/jobs/route.ts` | 2 |
| Pagina | `app/(dashboard)/alerts/page.tsx` | 1 |
| Components | `NotificationBell`, `CommandPanel`, `SyncStatus`, `AttentionSection`, `AlertsList` | 5 |
| Hooks | `useRealtimeAlerts.ts` | 1 |
| Lib | `lib/alerts.ts`, `lib/jobs.ts` | 2 |
| Claude Code | Hook config | 1 |
| **Totaal** | | **~16** |
