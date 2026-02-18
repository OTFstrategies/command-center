# Command Center v2 — Status

**Laatste update:** 2026-02-18
**Branch:** master
**Deploy:** https://command-center-app-nine.vercel.app
**Supabase:** Project ID `ikpmlhmbooaxfrlpzcfa`

---

## Huidige Staat

Volledig operationeel dashboard met 7 pagina's, 20 API routes, 51 componenten en een MCP server voor code intelligence. Intelligence Map is compleet met alle 7 features geimplementeerd.

---

## Pagina's (8)

| Pagina | Route | Functie |
|--------|-------|---------|
| Dashboard | `/` | Stats, project cards, recent changes, quick actions |
| Registry | `/registry` | Alle assets (apis, prompts, skills, agents, commands, instructions) |
| Tasks | `/tasks` | Kanban board met drag-and-drop |
| Activity | `/activity` | Audit trail met filters |
| Map | `/map` | Intelligence Map - visueel ecosysteem overzicht |
| Project Detail | `/projects/[slug]` | 7-tabs dossier (Overzicht, Functies, Onderdelen, Verbindingen, Code, Dependencies, Health, API Routes) |
| Settings | `/settings` | Project instellingen |
| Auth Callback | `/auth/callback` | Supabase auth redirect |

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

## API Routes (20)

| Route | Methodes | Functie |
|-------|----------|---------|
| `/api/sync` | GET, POST | Registry sync van `~/.claude/` |
| `/api/sync/inbox` | GET, POST | Inbox staging area |
| `/api/sync/inbox/process` | POST | Inbox items verwerken |
| `/api/sync/deep-scan` | GET, POST | Deep Scan pipeline |
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
c94f494 feat: implement all 7 skipped Intelligence Map features
6689fa4 chore: commit all uncommitted work before PC migration
331a0bc fix: add required fields to auto-create projects in sync route
7b17338 docs: add implementation plan for 7 skipped Intelligence Map features
c25352a feat: add Intelligence Map - visual overview of entire AI ecosystem
```

---

## Bekende Issues

- Tijdlijn view toont lege staat als `entity_versions` tabel nog geen data heeft
- Vergelijkingsweergave vereist data in `projecten` tabel (via deep scan)
- Vercel auto-deploy werkt soms niet bij git push; handmatig `npx vercel --prod` als fallback

---

## Volgende Stappen (suggesties)

- [ ] Bookmark pin/unpin knop toevoegen aan DetailPanel
- [ ] Automatische sync scheduling (cron)
- [ ] entity_versions vullen bij elke sync voor tijdlijn data
- [ ] Nieuwe deep scan draaien na recente wijzigingen
- [ ] Code analyse updaten voor nieuwste bestanden (130 files, 750 symbols, 18.6K LOC)
