# Command Center v2 — Status

**Laatste update:** 2026-02-19 14:00
**Branch:** master
**Deploy:** https://command-center-app-nine.vercel.app
**Supabase:** Project ID `ikpmlhmbooaxfrlpzcfa`

---

## Huidige Staat

Volledig operationeel dashboard met 9 pagina's, 23 API routes, 56 componenten en een MCP server voor code intelligence. Intelligence Map compleet. Observer + Actor systeem **volledig actief**. **Hooks-infrastructuur actief** — auto-sync bij sessie-einde, usage tracking bij /commands, project discovery bij sessie-start.

---

## Deze Sessie (2026-02-19)

### Uitgevoerd — CC Middelpunt Upgrade

- **Database migratie:** activity_log actions verruimd (6→8 types), entity_versions `created_at` toegevoegd, usage_statistics unique constraint, projecten `slug`+`name` kolommen
- **3 Claude Code hooks aangemaakt en geregistreerd:**
  - `session-end-sync.sh` (Stop) — auto-sync registry naar CC bij sessie-einde
  - `track-usage.sh` (UserPromptSubmit) — registreert /command invocaties
  - `discover-projects.sh` (SessionStart) — scant ~/projects/ en meldt nieuwe projecten
  - `check-branch-protection.sh` (PreToolUse) — formeel geregistreerd in settings.json
- **Project discovery endpoint:** `/api/projects/discover` — ontvangt hook-data, auto-creëert projecten
- **Sync route verbeterd:** per-item activity logging (created/deleted per item, niet alleen totaal)
- **Sync script:** CLI activity tracking na sync (types, items, duur)
- **Dagstart command herschreven:** CC-geïntegreerd dagrapport met live data
- **Alles gedeployed naar Vercel** via PR #8

---

## Pagina's (9)

| Pagina         | Route              | Functie                                                                                    |
| -------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| Dashboard      | `/`                | Stats, project cards, recent changes, quick actions, attention alerts                      |
| Registry       | `/registry`        | Alle assets (apis, prompts, skills, agents, commands, instructions)                        |
| Tasks          | `/tasks`           | Kanban board met drag-and-drop                                                             |
| Alerts         | `/alerts`          | Alert management met severity/status filters en bulk acties                                |
| Activity       | `/activity`        | Audit trail met filters                                                                    |
| Map            | `/map`             | Intelligence Map - visueel ecosysteem overzicht                                            |
| Project Detail | `/projects/[slug]` | 7-tabs dossier (Overzicht, Functies, Onderdelen, Verbindingen, Code, Dependencies, Health) |
| Settings       | `/settings`        | Project instellingen                                                                       |
| Auth Callback  | `/auth/callback`   | Supabase auth redirect                                                                     |

---

## Observer + Actor System — VOLLEDIG ACTIEF

| Component            | Status     | Details                                              |
| -------------------- | ---------- | ---------------------------------------------------- |
| Database tabellen    | **Actief** | alerts, job_queue, sync_status (3 migraties gepusht) |
| RLS policies         | **Actief** | SELECT/INSERT/UPDATE policies voor alle 3 tabellen   |
| Realtime             | **Actief** | alerts tabel subscription via WebSocket              |
| Edge Functions       | **Actief** | health-check, sync-trigger, alert-digest (deployed)  |
| pg_cron              | **Actief** | Health check elke 6u, digest dagelijks 7:00 UTC      |
| NotificationBell     | **Live**   | Realtime badge + dropdown in sidebar                 |
| SyncStatus           | **Live**   | Polling elke 60s, groene/amber/rode stip             |
| CommandPanel         | **Live**   | Cmd+J, 4 acties (deep scan + health check werkend)   |
| AttentionSection     | **Live**   | Homepage critical/warning alerts                     |
| Alerts pagina        | **Live**   | /alerts met filters en bulk acties                   |
| Graceful degradation | **Live**   | Components handlen missing tables + network errors   |
| entity_versions      | **Live**   | Sync vult Timeline data                              |
| Job tracking         | **Live**   | Sync script maakt + update job_queue entries         |
| Stale sync detectie  | **Actief** | Health-check waarschuwt bij >24u geen sync           |

### Testresultaten (2026-02-18)

| Metric         | Waarde |
| -------------- | ------ |
| Totaal tests   | 48     |
| Geslaagd       | 40     |
| Waarschuwingen | 8      |
| Gefaald        | 0      |

Zie `docs/plans/2026-02-18-observer-actor-test-plan.md` voor alle details.

---

## Intelligence Map Features (compleet)

| Feature              | Component                   | Status |
| -------------------- | --------------------------- | ------ |
| Cockpit View         | `CockpitView.tsx`           | Live   |
| Force Graph          | `FullGraphView.tsx` (WebGL) | Live   |
| Tijdlijn             | `TimelineView.tsx`          | Live   |
| Vergelijking         | `ComparisonView.tsx`        | Live   |
| Kosten Dashboard     | `CostsDashboard.tsx`        | Live   |
| Gebruiksstatistieken | `UsagePanel.tsx`            | Live   |
| Bladwijzers          | `BookmarksBar.tsx`          | Live   |
| Export (link + PNG)  | `ExportMenu.tsx`            | Live   |
| Filters              | `FilterBar.tsx`             | Live   |
| Insights             | `InsightsPanel.tsx`         | Live   |
| Risicoanalyse        | `RiskAnalysis.tsx`          | Live   |
| Detail Panel         | `DetailPanel.tsx`           | Live   |
| Help Overlay         | `HelpOverlay.tsx`           | Live   |
| Since Last Visit     | `SinceLastVisit.tsx`        | Live   |
| Quick Actions        | `QuickActions.tsx`          | Live   |

---

## API Routes (22)

| Route                                  | Methodes          | Functie                                          |
| -------------------------------------- | ----------------- | ------------------------------------------------ |
| `/api/sync`                            | GET, POST         | Registry sync van `~/.claude/` + entity_versions |
| `/api/sync/inbox`                      | GET, POST         | Inbox staging area                               |
| `/api/sync/inbox/process`              | POST              | Inbox items verwerken                            |
| `/api/sync/deep-scan`                  | GET, POST         | Deep Scan pipeline                               |
| `/api/alerts`                          | GET, PATCH        | Alert CRUD + counts + bulk status updates        |
| `/api/jobs`                            | GET, POST, PATCH  | Job queue + sync statussen + status updates      |
| `/api/tasks`                           | GET, POST         | Task CRUD                                        |
| `/api/tasks/[id]`                      | PATCH, DELETE     | Task update/delete                               |
| `/api/search`                          | GET               | Global search (Cmd+K)                            |
| `/api/activity`                        | GET, POST         | Activity log                                     |
| `/api/projects/discover`               | POST              | Project discovery (hook-driven)                  |
| `/api/projects/[slug]`                 | GET               | Project metadata                                 |
| `/api/projects/[slug]/memories`        | GET, POST         | Project memories                                 |
| `/api/projects/[slug]/memories/[name]` | DELETE            | Memory verwijderen                               |
| `/api/projects/[slug]/symbols`         | GET               | Code symbols                                     |
| `/api/projects/[slug]/diagnostics`     | GET               | Compiler diagnostics                             |
| `/api/projects/[slug]/dependencies`    | GET               | npm packages                                     |
| `/api/projects/[slug]/metrics`         | GET               | Code metrics                                     |
| `/api/costs`                           | GET, POST         | Kosten per dienst/project                        |
| `/api/usage`                           | GET, POST         | Gebruiksstatistieken                             |
| `/api/comparison`                      | GET               | Project vergelijking                             |
| `/api/bookmarks`                       | GET, POST, DELETE | Bladwijzers                                      |
| `/api/export`                          | GET, POST         | Deelbare links                                   |

---

## MCP Server (`cc-v2-mcp/`)

7 tools voor TypeScript code analyse via ts-morph:

| Tool               | Functie                            |
| ------------------ | ---------------------------------- |
| `analyze_project`  | Volledige analyse → Supabase       |
| `query_symbols`    | Zoek functies, classes, interfaces |
| `find_references`  | Cross-references vinden            |
| `get_diagnostics`  | TypeScript fouten/warnings         |
| `get_dependencies` | npm packages ophalen               |
| `get_metrics`      | LOC, files, symbols, exports       |
| `project_health`   | Health score berekening            |

---

## Deep Scan Data

Laatst gedraaid: 2026-02-16

| Metriek         | Aantal |
| --------------- | ------ |
| Inventory items | 232+   |
| Relaties        | 338    |
| Hierarchies     | 90+    |
| Clusters        | 12     |
| Inzichten       | 58+    |

---

## Recente Commits

```
0c34e90 docs: add Observer + Actor test and quality plan with full results
efd5139 feat: activate pg_cron schedules for automated health checks and daily digests
6568ac6 docs: update STATUS.md with Observer + Actor system status
1dfdd28 feat: Observer + Actor activatie - types, graceful degradation, data pipeline, RLS
5fec692 feat: implement Observer + Actor system for live alerts and actionable dashboard
3b3560d docs: add Observer + Actor implementation plan (20 tasks)
```

---

## Bekende Issues

- Vergelijkingsweergave vereist data in `projecten` tabel (via deep scan)
- Vercel auto-deploy werkt soms niet bij git push; handmatig `npx vercel --prod` als fallback
- CSS @import warning in build (pre-existing, cosmetisch)
- Homepage Promise.all zonder try/catch — crasht als DB volledig onbereikbaar (laag risico)
- Alerts/Jobs PATCH endpoints hebben geen auth — alleen URL-kennis nodig (laag risico)
- ~~activity_log tabel is leeg~~ — **OPGELOST:** sync schrijft nu per-item entries + hooks loggen sessie/usage events
- ~~entity_versions mist `created_at` kolom~~ — **OPGELOST:** kolom toegevoegd via migratie

---

## Volgende Stappen

- [x] ~~Claude Code session hook configureren voor auto-sync~~ — DONE (4 hooks actief)
- [x] ~~activity_log vullen vanuit sync pipeline~~ — DONE (per-item logging)
- [x] ~~entity_versions `created_at` kolom toevoegen~~ — DONE (migratie)
- [x] ~~Usage statistics automatisch vullen~~ — DONE (track-usage hook)
- [ ] Nieuwe deep scan draaien na recente wijzigingen
- [ ] Error boundary toevoegen aan homepage (Promise.all crash preventie)
- [ ] Auth toevoegen aan alerts/jobs PATCH endpoints
- [ ] Alert email notificaties
