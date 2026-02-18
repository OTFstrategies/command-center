# Observer + Actor System — Test- en Kwaliteitsplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Uitputtend testen van alle Observer + Actor componenten om correctheid, robuustheid en betrouwbaarheid te garanderen.

**Architecture:** API-driven tests via curl/fetch tegen de live Vercel deployment + Supabase, aangevuld met code-review agents voor statische analyse. Geen lokale test framework nodig — alles wordt getest tegen de live omgeving.

**Tech Stack:** curl, Supabase REST API, Vercel deployment, subagents voor parallelle verificatie

---

## Sectie 1: Overzicht en Testdoelen

### Wat wordt getest?

Het Observer + Actor systeem bestaat uit 16 componenten verdeeld over 4 lagen:

| Laag | Componenten | Doel |
|------|-------------|------|
| **Database** | 3 tabellen (alerts, job_queue, sync_status) + RLS policies | Data-opslag en beveiliging |
| **API Routes** | 3 routes (alerts, jobs, sync) met 7 HTTP handlers | Data-toegang en business logic |
| **Edge Functions** | 3 functies (health-check, sync-trigger, alert-digest) | Achtergrond-automatisering |
| **UI Components** | 7 componenten (NotificationBell, SyncStatus, CommandPanel, AlertsList, AttentionSection, useRealtimeAlerts hook) | Gebruikersinterface |

### Testdoelen

| # | Doel | Succes-criterium |
|---|------|------------------|
| 1 | **Correctheid** | Alle API routes geven correcte HTTP statuscodes en JSON structuren terug |
| 2 | **Dataflow** | Data stroomt correct: health-check → alerts → API → UI componenten |
| 3 | **Robuustheid** | Systeem degradeert graceful bij ontbrekende tabellen, netwerk-fouten, lege data |
| 4 | **Beveiliging** | Sync API accepteert alleen geldige API keys; RLS policies werken correct |
| 5 | **Idempotentie** | Dubbele health-checks maken geen dubbele alerts (deduplicatie werkt) |
| 6 | **Auto-resolve** | Alerts worden automatisch opgelost als het onderliggende probleem verdwijnt |
| 7 | **Job tracking** | Sync script creëert jobs, update statussen, en registreert duur |
| 8 | **Edge Functions** | Alle 3 functions zijn bereikbaar, geven correcte JSON terug |
| 9 | **Type safety** | Alle gedeelde types worden correct geïmporteerd en gebruikt |

---

## Sectie 2: Test-Angles met Rationale

### Angle 1: API Functionele Tests
**Wat:** Alle HTTP endpoints aanroepen met geldige en ongeldige input.
**Waarom:** Dit is de ruggengraat van het systeem. Als de API's niet werken, werkt niets.
**Scope:** 7 handlers over 3 routes (alerts GET/PATCH, jobs GET/POST/PATCH, sync POST/GET)

### Angle 2: Edge Function Verificatie
**Wat:** Alle 3 Supabase Edge Functions aanroepen en output valideren.
**Waarom:** Deze draaien automatisch via pg_cron. Als ze falen, merkt niemand het tot het te laat is.
**Scope:** health-check, sync-trigger, alert-digest

### Angle 3: Deduplicatie & Auto-Resolve Logic
**Wat:** Testen dat dubbele alerts niet worden aangemaakt, en dat opgeloste problemen automatisch alerts resolven.
**Waarom:** Zonder deduplicatie overspoelt het systeem met herhaalde alerts. Zonder auto-resolve blijven opgeloste problemen als "open" staan.
**Scope:** health-check Edge Function deduplicatie en auto-resolve logica

### Angle 4: Data Integriteit
**Wat:** Controleren dat data correct wordt opgeslagen, inclusief entity_versions bij sync.
**Waarom:** De sync route schrijft naar 5 tabellen (registry_items, activity_log, project_changelog, entity_versions, projects). Als één schrijfactie faalt, raakt de data inconsistent.
**Scope:** sync route POST, entity_versions, project auto-create

### Angle 5: Beveiliging
**Wat:** Testen dat ongeautoriseerde requests worden geweigerd.
**Waarom:** De sync API accepteert data die direct in de database wordt geschreven. Zonder auth is dit een open deur.
**Scope:** sync POST zonder/met foute API key, RLS policies voor anon vs service_role

### Angle 6: Graceful Degradation
**Wat:** Testen dat UI componenten niet crashen als backend-data ontbreekt of fouten geeft.
**Waarom:** Het dashboard moet altijd bruikbaar blijven, ook als een tabel leeg is of een API faalt.
**Scope:** useRealtimeAlerts hook, SyncStatus component, CommandPanel, AttentionSection

### Angle 7: Job Tracking Pipeline
**Wat:** Volledige flow testen: job aanmaken → status bijwerken → sync_status updaten.
**Waarom:** Job tracking is het observatiesysteem. Als dit niet klopt, weet je niet of syncs slagen.
**Scope:** jobs POST → PATCH, sync-registry.mjs integratie

### Angle 8: Type Consistency
**Wat:** Statische analyse dat alle imports, exports en type-definities consistent zijn.
**Waarom:** Gebroken type imports veroorzaken build failures of runtime fouten.
**Scope:** types/index.ts, lib/alerts.ts, lib/jobs.ts, alle importerende componenten

### Angle 9: Edge Cases & Boundary Conditions
**Wat:** Lege arrays, null waarden, ontbrekende velden, extreem grote payloads.
**Waarom:** De meeste bugs zitten in onverwachte input. Dit vangt de randgevallen.
**Scope:** Alle API routes met grenswaarde-input

---

## Sectie 3: Gedetailleerde Teststappen per Angle

### Angle 1: API Functionele Tests

#### Task 1.1: Alerts GET — Ophalen van alerts

**Stappen:**

**Step 1: GET alerts counts**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?counts=true"
```
Verwacht: `{"total":N,"critical":N,"warning":N,"info":N,"new":N}` — alle velden numeriek, HTTP 200

**Step 2: GET alerts lijst**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts"
```
Verwacht: `{"alerts":[...]}` — array van objecten met id, type, severity, title, status, created_at

**Step 3: GET alerts met status filter**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?status=new"
```
Verwacht: Alle teruggegeven alerts hebben `status: "new"`

**Step 4: GET alerts met severity filter**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?severity=warning"
```
Verwacht: Alle teruggegeven alerts hebben `severity: "warning"`

**Step 5: GET alerts met gecombineerde filters**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?status=new&severity=info"
```
Verwacht: Alle alerts zijn zowel `status: "new"` als `severity: "info"`

---

#### Task 1.2: Alerts PATCH — Status wijzigen

**Step 1: Ophalen van een alert ID om mee te werken**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?status=new" | jq '.alerts[0].id'
```
Verwacht: Een UUID string

**Step 2: Eén alert acknowledgen**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{"id":"<ID>","status":"acknowledged"}'
```
Verwacht: `{"success":true}`

**Step 3: Verifieer dat de status is gewijzigd**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?status=acknowledged" | jq '.alerts[] | select(.id=="<ID>")'
```
Verwacht: Alert met nieuwe status

**Step 4: PATCH zonder status (fout-scenario)**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{"id":"some-id"}'
```
Verwacht: HTTP 400, `{"error":"status required"}`

**Step 5: PATCH zonder id EN zonder ids (fout-scenario)**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}'
```
Verwacht: HTTP 400, `{"error":"id or ids required"}`

---

#### Task 1.3: Jobs GET — Ophalen van jobs en sync status

**Step 1: GET recente jobs**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/jobs"
```
Verwacht: `{"jobs":[...]}` — array van objecten met id, type, status, created_at

**Step 2: GET sync statussen**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/jobs?view=status"
```
Verwacht: `{"statuses":[...]}` — array met entries voor registry_sync, health_check, deep_scan

---

#### Task 1.4: Jobs POST — Job aanmaken

**Step 1: Geldige job aanmaken**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"type":"health_check"}'
```
Verwacht: `{"success":true,"job":{"id":"...","type":"health_check","status":"pending",...}}`

**Step 2: Ongeldig type (fout-scenario)**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"type":"invalid_type"}'
```
Verwacht: HTTP 400, error met "Invalid type. Valid: registry_sync, deep_scan, health_check, code_analysis"

**Step 3: Zonder type (fout-scenario)**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{}'
```
Verwacht: HTTP 400, `{"error":"type required"}`

---

#### Task 1.5: Jobs PATCH — Job status bijwerken

**Step 1: Job ID ophalen**
Gebruik de job ID uit Task 1.4 Step 1.

**Step 2: Job naar running zetten**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"id":"<ID>","status":"running"}'
```
Verwacht: `{"success":true,"id":"<ID>","status":"running"}`

**Step 3: Job naar completed zetten met result**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"id":"<ID>","type":"health_check","status":"completed","result":{"total_items":5},"duration_ms":123}'
```
Verwacht: `{"success":true}`, sync_status voor health_check is bijgewerkt

**Step 4: PATCH zonder id (fout-scenario)**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```
Verwacht: HTTP 400, `{"error":"id and status required"}`

**Step 5: Verifieer sync_status update**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/jobs?view=status" | jq '.statuses[] | select(.id=="health_check")'
```
Verwacht: `status: "success"`, `duration_ms: 123`, `items_processed: 5`

---

### Angle 2: Edge Function Verificatie

#### Task 2.1: Health Check Edge Function

**Step 1: Aanroepen**
```bash
curl -s -X POST "https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
```
Verwacht: `{"success":true,"new_alerts":N,"auto_resolved":N,"duration_ms":N}` — alle velden aanwezig

**Step 2: Verifieer dat sync_status is bijgewerkt**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/jobs?view=status" | jq '.statuses[] | select(.id=="health_check")'
```
Verwacht: `status: "success"` of `"running"`, `last_run_at` is recent

**Step 3: CORS preflight test**
```bash
curl -s -X OPTIONS "https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check" \
  -H "Origin: https://command-center-app-nine.vercel.app" -I
```
Verwacht: `Access-Control-Allow-Origin: *`

---

#### Task 2.2: Alert Digest Edge Function

**Step 1: Aanroepen**
```bash
curl -s -X POST "https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/alert-digest" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
```
Verwacht: `{"success":true,"open_alerts":N,"auto_resolved":N}`

**Step 2: Verifieer dat daily_digest alert is aangemaakt (als er open alerts waren)**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?status=new" | jq '.alerts[] | select(.type=="daily_digest")'
```
Verwacht: Als er open alerts waren → daily_digest alert aanwezig met correct severity

---

#### Task 2.3: Sync Trigger Edge Function

**Step 1: Aanroepen (let op: deze doet een GET naar /api/sync)**
```bash
curl -s -X POST "https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/sync-trigger" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
```
Verwacht: `{"success":true,"sync":{...},"health":{...},"duration_ms":N}`

**Step 2: Verifieer dat een job_queue entry is aangemaakt**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/jobs" | jq '.jobs[0]'
```
Verwacht: Recente job met type "registry_sync"

---

### Angle 3: Deduplicatie & Auto-Resolve

#### Task 3.1: Deduplicatie test

**Step 1: Eerste health-check → tel nieuw aangemaakte alerts**
```bash
curl -s -X POST "https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" | jq '.new_alerts'
```
Noteer: aantal N1

**Step 2: Tweede health-check direct erna → verwacht 0 nieuwe**
```bash
curl -s -X POST "https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" | jq '.new_alerts'
```
Verwacht: `0` (alle alerts bestonden al)

**Beoordeling:** Als N2 > 0 terwijl er geen nieuwe problemen zijn, faalt de deduplicatie.

---

#### Task 3.2: Auto-resolve test

**Step 1: Tel huidige auto-resolvable alerts**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?status=new" | jq '[.alerts[] | select(.type | test("unhealthy|stale|orphan|sync_failed|sync_stale"))] | length'
```
Noteer: aantal N1

**Step 2: Health-check draaien → kijk naar auto_resolved count**
```bash
curl -s -X POST "https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" | jq '.auto_resolved'
```
Verwacht: Getal ≥ 0, consistent met verwachte resolved alerts

---

### Angle 4: Data Integriteit

#### Task 4.1: Sync route schrijft naar alle tabellen

**Step 1: Registreer huidige teller van entity_versions**
```bash
curl -s "https://ikpmlhmbooaxfrlpzcfa.supabase.co/rest/v1/entity_versions?select=id&order=created_at.desc&limit=1" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
```
Noteer: meest recente ID

**Step 2: Draai sync**
```bash
cd /c/Users/Shadow/Projects/command-center-v2/command-center-app && \
SYNC_API_KEY="<key>" node scripts/sync-registry.mjs
```
Verwacht: "Synced: 6 types, N total items"

**Step 3: Controleer entity_versions zijn gegroeid**
```bash
curl -s "https://ikpmlhmbooaxfrlpzcfa.supabase.co/rest/v1/entity_versions?select=id,entity_id,change_type,title&order=created_at.desc&limit=5" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
```
Verwacht: Nieuwe entries met `detected_by: "sync"` (als er changes waren)

---

### Angle 5: Beveiliging

#### Task 5.1: Sync API key validatie

**Step 1: POST zonder API key**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/sync" \
  -H "Content-Type: application/json" \
  -d '{"type":"api","items":[]}'
```
Verwacht: HTTP 401, `{"error":"Invalid API key"}`

**Step 2: POST met foute API key**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/sync" \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key-12345" \
  -d '{"type":"api","items":[]}'
```
Verwacht: HTTP 401, `{"error":"Invalid API key"}`

**Step 3: POST met geldige API key maar lege payload**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/sync" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <VALID_KEY>" \
  -d '{}'
```
Verwacht: HTTP 400, `{"error":"Invalid payload: type and items[] required"}`

---

#### Task 5.2: Jobs/Alerts routes zijn publiek toegankelijk (by design)

**Step 1: GET alerts zonder auth**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/alerts?counts=true"
```
Verwacht: HTTP 200 (deze routes zijn publiek, want het dashboard heeft ze nodig)

**Step 2: PATCH alerts zonder auth**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{"id":"non-existent-id","status":"resolved"}'
```
Verwacht: HTTP 200 `{"success":true}` (geen auth check op PATCH — noteer als potentieel risico)

---

### Angle 6: Graceful Degradation

#### Task 6.1: Statische code review

Laat een subagent de volgende patronen verifiëren in de code:

| Component | Verwacht patroon | Bestand |
|-----------|-----------------|---------|
| useRealtimeAlerts | `if (!res.ok)` check → `setUnreadCount(0)` | `hooks/useRealtimeAlerts.ts:23-25` |
| useRealtimeAlerts | `catch` block → `setUnreadCount(0)` | `hooks/useRealtimeAlerts.ts:29-31` |
| SyncStatus | `catch { // silently fail }` | `components/shell/SyncStatus.tsx:18-19` |
| CommandPanel | `.catch(() => {})` op job creation calls | `components/shell/CommandPanel.tsx:46,58,84,116` |
| AttentionSection | `.filter()` op lege array geeft `[]` | `components/dashboard/AttentionSection.tsx:10-12` |
| AlertsList | `initialAlerts` kan lege array zijn | `components/alerts/AlertsList.tsx:17` |
| Home page | `getAlerts` gecalled met `catch` in Promise.all | `app/(dashboard)/page.tsx:34-40` |

---

### Angle 7: Job Tracking Pipeline

#### Task 7.1: End-to-end job lifecycle

**Step 1: Job aanmaken**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"type":"registry_sync"}'
```
Noteer: job ID

**Step 2: Verifieer job is pending**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/jobs" | jq '.jobs[] | select(.id=="<ID>")'
```
Verwacht: `status: "pending"`, `started_at: null`, `completed_at: null`

**Step 3: Job naar running**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"id":"<ID>","status":"running"}'
```
Verwacht: `{"success":true}`

**Step 4: Verifieer started_at is gezet**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/jobs" | jq '.jobs[] | select(.id=="<ID>") | .started_at'
```
Verwacht: ISO timestamp (niet null)

**Step 5: Job naar completed**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"id":"<ID>","type":"registry_sync","status":"completed","result":{"total_items":100},"duration_ms":500}'
```
Verwacht: `{"success":true}`

**Step 6: Verifieer completed_at en sync_status update**
```bash
curl -s "https://command-center-app-nine.vercel.app/api/jobs?view=status" | jq '.statuses[] | select(.id=="registry_sync")'
```
Verwacht: `status: "success"`, `duration_ms: 500`, `items_processed: 100`

---

### Angle 8: Type Consistency

#### Task 8.1: TypeScript build check

**Step 1: TypeScript compile check**
```bash
cd /c/Users/Shadow/Projects/command-center-v2/command-center-app && npx tsc --noEmit
```
Verwacht: 0 errors

**Step 2: Next.js production build**
```bash
cd /c/Users/Shadow/Projects/command-center-v2/command-center-app && npm run build
```
Verwacht: Build succesvol, geen type errors

---

#### Task 8.2: Import chain verificatie

Laat een subagent verifiëren:

| Import | Van | Naar | Verwacht |
|--------|-----|------|----------|
| `Alert` | `@/types` | `lib/alerts.ts` | ✓ re-exported |
| `AlertCounts` | `@/types` | `lib/alerts.ts` | ✓ re-exported |
| `Job` | `@/types` | `lib/jobs.ts` | ✓ re-exported |
| `SyncStatusRecord` | `@/types` | `lib/jobs.ts` | ✓ aliased als SyncStatus |
| `Alert` | `@/types` | `AlertsList.tsx` | ✓ direct import |
| `Alert` | `@/types` | `AttentionSection.tsx` | ✓ direct import |

---

### Angle 9: Edge Cases & Boundary Conditions

#### Task 9.1: Lege en null waarden

**Step 1: Bulk update met lege ids array**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{"ids":[],"status":"resolved"}'
```
Verwacht: Zou `{"error":"id or ids required"}` moeten geven (code checkt `ids.length > 0`)

**Step 2: Job PATCH met onbekend id**
```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"id":"00000000-0000-0000-0000-000000000000","status":"completed"}'
```
Verwacht: HTTP 200 (Supabase update op niet-bestaand ID raakt 0 rijen, geen error)

**Step 3: Sync met ongeldig type**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/sync" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <VALID_KEY>" \
  -d '{"type":"hacker","items":[{"name":"test"}]}'
```
Verwacht: Verwerkt het als valide (sync route valideert type NIET — noteer als bevinding)

**Step 4: Sync met item zonder verplichte velden**
```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/sync" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <VALID_KEY>" \
  -d '{"type":"api","items":[{"id":"test","name":"test","path":"/test","created":"2026-01-01","project":"test"}]}'
```
Verwacht: HTTP 200 (minimale geldige payload)

---

## Sectie 4: Subagent-Rollen, Verantwoordelijkheden en Onderlinge Controle

### Rolverdeling

| Subagent | Type | Verantwoordelijkheid | Angles |
|----------|------|---------------------|--------|
| **API-Tester** | Bash | Alle curl-based functionele tests uitvoeren | 1, 5, 9 |
| **Edge-Tester** | Bash | Edge Functions aanroepen en output valideren | 2, 3 |
| **Code-Reviewer** | Explore + Read | Statische code analyse, import chains, graceful degradation patronen | 6, 8 |
| **Pipeline-Tester** | Bash | End-to-end job lifecycle + sync integratie | 4, 7 |

### Parallellisatie

```
Ronde 1 (parallel):
├── API-Tester     → Tasks 1.1, 1.2, 1.3, 1.4, 1.5 (Angle 1)
├── Code-Reviewer  → Tasks 6.1, 8.1, 8.2 (Angles 6, 8)
└── Edge-Tester    → Tasks 2.1, 2.2, 2.3 (Angle 2)

Ronde 2 (parallel, na Ronde 1):
├── API-Tester     → Tasks 5.1, 5.2, 9.1 (Angles 5, 9)
├── Edge-Tester    → Tasks 3.1, 3.2 (Angle 3)
└── Pipeline-Tester → Tasks 4.1, 7.1 (Angles 4, 7)
```

### Onderlinge Controle

| Controle | Wie checkt wie | Wat |
|----------|----------------|-----|
| API → Edge | API-Tester valideert data die Edge-Tester heeft aangemaakt | Alerts aangemaakt door health-check moeten zichtbaar zijn via `/api/alerts` |
| Edge → Pipeline | Edge-Tester controleert dat Pipeline-Tester's jobs correct in sync_status staan | Job completion moet sync_status bijwerken |
| Code → API | Code-Reviewer rapporteert potentiële issues die API-Tester moet valideren | Bijv. ontbrekende type validatie → API-Tester test met foute types |

---

## Sectie 5: Rapportageformaat

### Hoe de resultaten worden gerapporteerd

Na elke test-ronde krijg je een rapport in deze structuur:

#### Samenvatting (Dashboard)

```
╔══════════════════════════════════════════════╗
║  TESTRESULTATEN — Observer + Actor System    ║
╠══════════════════════════════════════════════╣
║  Totaal tests:    XX                         ║
║  ✅ Geslaagd:     XX                         ║
║  ⚠️ Waarschuwing: XX                         ║
║  ❌ Gefaald:      XX                         ║
║                                              ║
║  Algeheel oordeel: GOED / LET OP / ACTIE    ║
╚══════════════════════════════════════════════╝
```

#### Per Angle — In Begrijpelijke Taal

Elke angle wordt gerapporteerd met:

| Onderdeel | Uitleg |
|-----------|--------|
| **Wat is getest** | In één zin, zonder jargon |
| **Resultaat** | ✅ / ⚠️ / ❌ |
| **Wat betekent dit voor jou** | Praktische impact in dagelijks gebruik |
| **Actie nodig?** | Ja/Nee + wat er moet gebeuren |

**Voorbeeld:**

> **Angle 1: API Functionele Tests**
>
> **Wat is getest:** Of alle knoppen en schermen van het dashboard correct data ophalen en wijzigingen opslaan.
>
> **Resultaat:** ✅ Geslaagd (12/12 tests)
>
> **Wat betekent dit voor jou:** Alles wat je ziet op het dashboard (alerts, jobs, sync status) komt correct uit de database en wordt correct bijgewerkt als je actie onderneemt.
>
> **Actie nodig?** Nee.

**Voorbeeld bij probleem:**

> **Angle 5: Beveiliging**
>
> **Wat is getest:** Of onbevoegden data kunnen wijzigen in je systeem.
>
> **Resultaat:** ⚠️ Waarschuwing (3/4 tests geslaagd)
>
> **Wat betekent dit voor jou:** De sync route (die je registry data opslaat) is goed beveiligd met een API key. Maar de alerts en jobs routes hebben geen beveiliging — iedereen die de URL kent kan alerts markeren als opgelost.
>
> **Actie nodig?** Op termijn: auth toevoegen aan PATCH endpoints. Risico is laag omdat alleen Shadow de URL kent.

#### Bevindingen Tabel

| # | Bevinding | Ernst | Impact | Aanbeveling |
|---|-----------|-------|--------|-------------|
| 1 | Sync route valideert type niet | Laag | Kan ongeldige types in DB schrijven | Type whitelist toevoegen |
| 2 | PATCH alerts heeft geen auth | Laag | Iedereen kan alerts resolven | Auth toevoegen als prioriteit stijgt |
| ... | ... | ... | ... | ... |

---

## Uitvoering

### Geschatte duur
- Ronde 1: ~5-8 minuten (4 parallel agents)
- Ronde 2: ~5-8 minuten (3 parallel agents)
- Rapportage: ~3 minuten
- **Totaal: ~15-20 minuten**

### Pre-requisites
- Vercel deployment is live en bereikbaar
- Supabase project is actief met tabellen
- SYNC_API_KEY beschikbaar
- SUPABASE_SERVICE_ROLE_KEY beschikbaar voor Edge Function calls

---

*Plan klaar voor uitvoering. Kies subagent-driven (deze sessie) of parallel session.*
