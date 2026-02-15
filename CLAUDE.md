# Command Center v2

## Project
Centraal command center dashboard voor Shadow's Claude Code setup.
- **Live:** https://command-center-app-nine.vercel.app
- **Supabase:** Project ID `ikpmlhmbooaxfrlpzcfa`

## Tech Stack
- **Framework:** Next.js 14 (App Router, Server Components)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Drag & Drop:** @dnd-kit
- **Code Analysis:** ts-morph (TypeScript Compiler API)
- **MCP Protocol:** @modelcontextprotocol/sdk
- **Deployment:** Vercel

## Design System
Shadow Huisstijl is toegepast:
- ALLEEN zinc palette (GEEN blauwe, groene, paarse accenten)
- Glassmorphism + monochrome glow voor hover
- Inter (body), DM Sans (headings optioneel), monospace voor code
- Bron: `~/.claude/design-system/HUISSTIJL.md`

## Directory Structuur
```
command-center-v2/
├── command-center-app/src/       # Next.js dashboard
│   ├── app/
│   │   ├── (dashboard)/          # Pages: home, activity, registry, tasks, settings
│   │   │   └── projects/[slug]/  # Project detail met tabs (Overview/Code/Dependencies/Health)
│   │   └── api/
│   │       ├── sync/             # Registry sync + inbox
│   │       ├── tasks/            # Task CRUD
│   │       ├── search/           # Global search
│   │       ├── activity/         # Activity log (GET + POST)
│   │       └── projects/[slug]/  # Project metadata + memories + code intelligence
│   │           ├── memories/     # CRUD voor project memories
│   │           ├── symbols/      # GET code symbols (functies, classes, etc.)
│   │           ├── diagnostics/  # GET compiler fouten/warnings
│   │           ├── dependencies/ # GET npm packages
│   │           └── metrics/      # GET code metrics (LOC, files, health)
│   ├── components/
│   │   ├── dashboard/            # StatCard, ProjectCard, QuickActionBar
│   │   ├── kanban/               # KanbanBoard, KanbanColumn, TaskCard, AddTaskModal
│   │   ├── code-intel/           # ProjectTabs, CodeTab, DependenciesTab, HealthTab
│   │   ├── memories/             # MemoryList
│   │   ├── search/               # SearchDialog, SearchProvider
│   │   ├── shell/                # AppShell, MainNav, ProjectSwitcher, ShellLayout
│   │   ├── sync/                 # InboxPanel
│   │   ├── activity/             # ActivityList (client filters)
│   │   └── ui/                   # Toast, Skeleton, NotificationBadge
│   ├── lib/
│   │   ├── supabase/client.ts    # Browser Supabase client
│   │   ├── registry.ts           # Server-side registry + activity queries
│   │   ├── tasks.ts              # Server-side task queries
│   │   ├── projects.ts           # Server-side project + memory queries
│   │   └── code-intel.ts         # Server-side code intelligence queries
│   └── types/index.ts            # Alle TypeScript interfaces
│
├── cc-v2-mcp/                    # Code Intelligence MCP server
│   └── src/
│       ├── index.ts              # MCP server entry point (7 tools)
│       ├── analyzer/
│       │   ├── index.ts          # analyzeProject() orchestrator
│       │   ├── project.ts        # ts-morph project loader + tsconfig detection
│       │   ├── symbols.ts        # AST symbol extraction (functions, classes, interfaces, etc.)
│       │   ├── references.ts     # Cross-reference mapping
│       │   ├── diagnostics.ts    # TypeScript compiler diagnostics
│       │   ├── dependencies.ts   # package.json parser
│       │   └── metrics.ts        # LOC, files, language breakdown
│       └── lib/
│           ├── types.ts          # AnalysisResult, SymbolRecord, etc.
│           ├── supabase.ts       # Supabase client
│           └── storage.ts        # storeAnalysis() → Supabase upsert
│
├── supabase/migrations/          # Alle database migraties
└── docs/
    ├── plans/                    # Design docs, implementatie plannen, test plannen
    └── reports/                  # Technische rapporten
```

## Conventies
- Server Components by default (pages zijn async server components)
- 'use client' alleen voor interactieve UI (filters, modals, drag-drop)
- Supabase server queries via SERVICE_ROLE_KEY (bypass RLS)
- API routes authenticeren met `x-api-key` header
- Tailwind v4: custom CSS in `@layer components` blok voor behoud door Lightning CSS

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Publieke Supabase key
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase key (bypass RLS)
- `SYNC_API_KEY` — Authenticatie voor sync API routes

## Supabase Schema

### Registry & Dashboard
| Tabel | Doel |
|-------|------|
| `registry_items` | Alle assets (apis, prompts, skills, agents, commands, instructions) |
| `projecten` | Geregistreerde projecten met metadata |
| `project_changelog` | Wijzigingslog per project (door sync gegenereerd) |
| `kanban_tasks` | Taken met status, prioriteit, project-koppeling |
| `activity_log` | Alle events (created, used, synced) |
| `project_memories` | Markdown documenten per project |
| `inbox_pending` | Onverwerkte sync-verzoeken |

### Code Intelligence
| Tabel | Doel | Volume |
|-------|------|--------|
| `project_symbols` | Functies, classes, interfaces, types, enums, methods, properties | ~419 per project |
| `project_references` | Cross-references tussen symbolen (imports, calls) | ~427 per project |
| `project_diagnostics` | TypeScript compiler fouten en warnings | 0 bij gezonde code |
| `project_dependencies` | npm packages met versie en type (prod/dev/peer/optional) | ~21 per project |
| `project_metrics` | Geaggregeerde metrics (1 rij per project): files, LOC, languages, symbols, exports, errors, warnings, deps | 1 per project |

## Code Intelligence

### MCP Server (`cc-v2-mcp/`)
Een Model Context Protocol server die TypeScript projecten analyseert via ts-morph.

**7 MCP Tools:**
| Tool | Wat het doet |
|------|-------------|
| `analyze_project` | Volledige analyse: symbols + references + diagnostics + dependencies + metrics → opslaan in Supabase |
| `query_symbols` | Zoek symbolen met filters op kind, name, exported, limit |
| `find_references` | Vind alle plekken waar een symbool wordt gebruikt |
| `get_diagnostics` | TypeScript compiler fouten/warnings ophalen |
| `get_dependencies` | npm dependencies ophalen per type |
| `get_metrics` | Totaalcijfers: files, LOC, symbols, exports, errors, deps |
| `project_health` | Health score: healthy / needs-attention / unhealthy |

**Gebruik:** Bij vragen over code, symbolen, dependencies of projectgezondheid → gebruik deze MCP tools. Ze lezen uit Supabase (na eerdere analyse) of draaien een nieuwe analyse.

### Data Flow
```
analyze_project(pad)
  → ts-morph laadt tsconfig.json + bronbestanden
  → extractSymbols() + extractReferences() + extractDiagnostics()
  → extractDependencies() (package.json)
  → calculateMetrics()
  → storeAnalysis() → DELETE oude data + INSERT nieuwe data in Supabase
  → Dashboard leest via lib/code-intel.ts → toont in Code/Dependencies/Health tabs
```

### Dashboard Tabs (Project Detail)
| Tab | Component | Data |
|-----|-----------|------|
| Overview | Bestaand | Changelog, memories, assets, tech stack |
| Code | `CodeTab.tsx` | Symbolen gegroepeerd per bestand, filter chips per kind |
| Dependencies | `DependenciesTab.tsx` | Packages gegroepeerd op type (production/dev/peer/optional) |
| Health | `HealthTab.tsx` | Health badge, metrics grid, diagnostics, taalverdeling |

## Sync Pipeline
Registry data flow: `~/.claude/registry/*.json` → `scripts/sync-registry.mjs` → `POST /api/sync` → Supabase
- **Handmatig:** `SYNC_API_KEY="<key>" npm run sync` vanuit `command-center-app/`
- **Via Claude Code:** `/sync-cc` command
- Het script leest alle registry JSON bestanden en pusht per type naar de sync API
- De API vervangt alle items van dat type, genereert changelog entries, en maakt projecten aan

## Systeemrollen

| Systeem | Rol | Data |
|---------|-----|------|
| **Claude CLI** | Runtime — produceert en gebruikt assets (agents, commands, skills, etc.) | `~/.claude/registry/*.json` (source of truth) |
| **CC v2 MCP Server** | Analyse — scant TypeScript projecten, slaat resultaten op | `cc-v2-mcp/` → Supabase code intelligence tabellen |
| **Command Center v2** | Dashboard + data store — visueel overzicht, project memories, code intelligence | Supabase (mirror via sync + memories + metadata + analyse) |

- Claude CLI is de **producent** (`/save-to-cc` slaat assets op, `/memory` schrijft memories, `/onboard` detecteert project info)
- CC v2 MCP is de **analyseur** (`analyze_project` scant code, `query_symbols` doorzoekt resultaten)
- CC v2 Dashboard is het **centrale overzicht** (`/sync-cc` synchroniseert registry, memories via API, code tabs tonen analyse)
- Geen Serena meer — CC v2 vervangt alle Serena management-functionaliteit

## Project Memories
Project memories zijn markdown documenten per project, opgeslagen in Supabase `project_memories` tabel.
- **Schrijven:** `/memory` command of `POST /api/projects/[slug]/memories`
- **Lezen:** Dashboard project detail pagina of `GET /api/projects/[slug]/memories`
- **Verwijderen:** `DELETE /api/projects/[slug]/memories/[name]`
