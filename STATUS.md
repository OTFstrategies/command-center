# Command Center v2 — Status

**Laatste update:** 2026-02-18
**Branch:** master
**Deploy:** https://command-center-app-nine.vercel.app
**Supabase:** Project ID `ikpmlhmbooaxfrlpzcfa`

---

## Huidige Staat

Volledig operationeel dashboard met 9 pagina's, 22 API routes, 56 componenten en een MCP server voor code intelligence. Intelligence Map compleet. Observer + Actor systeem geimplementeerd (code deployed, Supabase infra pending activatie).

---

## Pagina's (9)

| Pagina | Route | Functie |
|--------|-------|---------|
| Dashboard | `/` | Stats, project cards, recent changes, quick actions, attention alerts |
| Registry | `/registry` | Alle assets (apis, prompts, skills, agents, commands, instructions) |
| Tasks | `/tasks` | Kanban board met drag-and-drop |
| Alerts | `/alerts` | Alert management met severity/status filters en bulk acties |
| Activity | `/activity` | Audit trail met filters |
| Map | `/map` | Intelligence Map - visueel ecosysteem overzicht |
| Project Detail | `/projects/[slug]` | 7-tabs dossier (Overzicht, Functies, Onderdelen, Verbindingen, Code, Dependencies, Health) |
| Settings | `/settings` | Project instellingen |
| Auth Callback | `/auth/callback` | Supabase auth redirect |

---

## Observer + Actor System

| Component | Status | Details |
|-----------|--------|---------|
| Database tabellen | Code ready | alerts, job_queue, sync_status (SQL migration klaar) |
| RLS policies | Code ready | Migration klaar, moet in Supabase gedraaid worden |
| Realtime | Code ready | alerts tabel subscription |
| Edge Functions | Code ready | health-check, sync-trigger, alert-digest |
| pg_cron | Code ready | Health check elke 6u, digest elke ochtend 7:00 |
| NotificationBell | Live | Realtime badge + dropdown in sidebar |
| SyncStatus | Live | Polling elke 60s, groene/amber/rode stip |
| CommandPanel | Live | Cmd+J, 4 acties (deep scan + health check werkend) |
| AttentionSection | Live | Homepage critical/warning alerts |
| Alerts pagina | Live | /alerts met filters en bulk acties |
| Graceful degradation | Live | Components handlen missing tables |
| entity_versions | Live | Sync vult Timeline data |
| Job tracking | Live | Sync script maakt job_queue entries |
| Stale sync detectie | Code ready | Health-check waarschuwt bij >24u geen sync |

### Supabase Activatie (handmatig)

Volgende stappen om het systeem volledig te activeren:

1. **SQL Migration draaien** → Supabase SQL Editor → `20260218200000_observer_actor.sql` + `20260218200200_observer_actor_rls.sql`
2. **Edge Functions deployen** → `supabase functions deploy health-check/sync-trigger/alert-digest`
3. **pg_cron activeren** → Extensions enablen + cron schedules SQL

---

## Intelligence Map Features (compleet)

| Feature | Component | Status |
|---------|-----------|--------|
| Cockpit View | `CockpitView.tsx` | Live |
| Force Graph | `FullGraphView.tsx` (WebGL) | Live |
| Tijdlijn | `TimelineView.tsx` | Live |
| Vergelijking | `ComparisonView.tsx` | Live |
| Kosten Dashboard | `CostsDashboard.tsx` | Live |
| Gebruiksstatistieken | `UsagePanel.tsx` | Live |
| Bladwijzers | `BookmarksBar.tsx` | Live |
| Export (link + PNG) | `ExportMenu.tsx` | Live |
| Filters | `FilterBar.tsx` | Live |
| Insights | `InsightsPanel.tsx` | Live |
| Risicoanalyse | `RiskAnalysis.tsx` | Live |
| Detail Panel | `DetailPanel.tsx` | Live |
| Help Overlay | `HelpOverlay.tsx` | Live |
| Since Last Visit | `SinceLastVisit.tsx` | Live |
| Quick Actions | `QuickActions.tsx` | Live |

---

## API Routes (22)

| Route | Methodes | Functie |
|-------|----------|---------|
| `/api/sync` | GET, POST | Registry sync van `~/.claude/` + entity_versions |
| `/api/sync/inbox` | GET, POST | Inbox staging area |
| `/api/sync/inbox/process` | POST | Inbox items verwerken |
| `/api/sync/deep-scan` | GET, POST | Deep Scan pipeline |
| `/api/alerts` | GET, PATCH | Alert CRUD + counts + bulk status updates |
| `/api/jobs` | GET, POST, PATCH | Job queue + sync statussen + status updates |
| `/api/tasks` | GET, POST | Task CRUD |
| `/api/tasks/[id]` | PATCH, DELETE | Task update/delete |
| `/api/search` | GET | Global search (Cmd+K) |
| `/api/activity` | GET, POST | Activity log |
| `/api/projects/[slug]` | GET | Project metadata |
| `/api/projects/[slug]/memories` | GET, POST | Project memories |
| `/api/projects/[slug]/memories/[name]` | DELETE | Memory verwijderen |
| `/api/projects/[slug]/symbols` | GET | Code symbols |
| `/api/projects/[slug]/diagnostics` | GET | Compiler diagnostics |
| `/api/projects/[slug]/dependencies` | GET | npm packages |
| `/api/projects/[slug]/metrics` | GET | Code metrics |
| `/api/costs` | GET, POST | Kosten per dienst/project |
| `/api/usage` | GET, POST | Gebruiksstatistieken |
| `/api/comparison` | GET | Project vergelijking |
| `/api/bookmarks` | GET, POST, DELETE | Bladwijzers |
| `/api/export` | GET, POST | Deelbare links |

---

## MCP Server (`cc-v2-mcp/`)

7 tools voor TypeScript code analyse via ts-morph:

| Tool | Functie |
|------|---------|
| `analyze_project` | Volledige analyse → Supabase |
| `query_symbols` | Zoek functies, classes, interfaces |
| `find_references` | Cross-references vinden |
| `get_diagnostics` | TypeScript fouten/warnings |
| `get_dependencies` | npm packages ophalen |
| `get_metrics` | LOC, files, symbols, exports |
| `project_health` | Health score berekening |

---

## Deep Scan Data

Laatst gedraaid: 2026-02-16

| Metriek | Aantal |
|---------|--------|
| Inventory items | 232+ |
| Relaties | 338 |
| Hierarchies | 90+ |
| Clusters | 12 |
| Inzichten | 58+ |

---

## Recente Commits

```
1dfdd28 feat: Observer + Actor activatie - types, graceful degradation, data pipeline, RLS
5fec692 feat: implement Observer + Actor system for live alerts and actionable dashboard
117dce5 docs: update STATUS.md with complete project overview
c94f494 feat: implement all 7 skipped Intelligence Map features
6689fa4 chore: commit all uncommitted work before PC migration
```

---

## Bekende Issues

- Vergelijkingsweergave vereist data in `projecten` tabel (via deep scan)
- Vercel auto-deploy werkt soms niet bij git push; handmatig `npx vercel --prod` als fallback
- CSS @import warning in build (pre-existing, cosmetisch)

---

## Volgende Stappen

- [ ] **Supabase infra activeren** — SQL migration + Edge Functions + pg_cron (zie Activatie sectie)
- [ ] Claude Code session hook configureren voor auto-sync
- [ ] Nieuwe deep scan draaien na recente wijzigingen
- [ ] Test framework opzetten (Vitest + React Testing Library)
- [ ] Alert email notificaties
- [ ] Usage statistics automatisch vullen
