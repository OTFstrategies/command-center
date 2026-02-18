# Command Center v2 — Onboarding voor Claude Sessies

> **Lees dit als je voor het eerst werkt aan of met Command Center v2.**
> Dit document legt uit wat het systeem is, hoe het samenhangt met Claude Code, en wat jouw rol is als Claude in dit ecosysteem.

---

## 1. Wat is Command Center?

Command Center v2 is Shadow's **centraal dashboard** voor zijn complete Claude Code setup. Het visualiseert, beheert en bewaakt alles wat Shadow met Claude Code heeft gebouwd: agents, commands, skills, prompts, API-configuraties, instructies en projecten.

Denk aan het als een **vliegtuigcockpit** — Shadow ziet in één oogopslag:
- Welke assets hij heeft (100+ agents, commands, skills)
- Hoe ze samenhangen (338 relaties, 12 clusters)
- Of alles gezond is (automatische health checks elke 6 uur)
- Wat er recent is veranderd (changelog, alerts, sync status)

**Live URL:** https://command-center-app-nine.vercel.app
**Supabase Project:** `ikpmlhmbooaxfrlpzcfa`

---

## 2. De Drie Systeemrollen

Het ecosysteem bestaat uit drie onderdelen die elk een eigen rol hebben:

```
┌─────────────────────────────────────────────────────────────┐
│                    Shadow (Product Owner)                     │
│                   Geeft opdrachten, checkt resultaten         │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Claude Code │  │  MCP Server      │  │  Dashboard       │
│ (Producent) │  │  (Analyseur)     │  │  (Overzicht)     │
│             │  │                  │  │                  │
│ Maakt en    │  │ Analyseert code  │  │ Toont alles      │
│ gebruikt    │  │ via TypeScript   │  │ visueel in een   │
│ assets      │  │ compiler API     │  │ web dashboard    │
│             │  │                  │  │                  │
│ ~/.claude/  │  │ cc-v2-mcp/      │  │ command-center-  │
│ registry/   │  │                  │  │ app/             │
└──────┬──────┘  └────────┬─────────┘  └────────┬─────────┘
       │                  │                     │
       │    sync          │    analyse          │    lees
       ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase (PostgreSQL)                     │
│  registry_items · alerts · job_queue · project_symbols · ... │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Claude Code CLI (Producent)

Dit is waar jij als Claude draait. Claude Code is de **producent** van het ecosysteem:

| Actie | Wat het doet | Waar het landt |
|-------|-------------|----------------|
| `/save-to-cc` | Slaat een nieuw asset op (agent, command, skill, etc.) | `~/.claude/registry/*.json` |
| `/sync-cc` | Synchroniseert registry naar database | Supabase via `/api/sync` |
| `/memory` | Schrijft project-specifieke notities | Supabase `project_memories` |
| `/onboard` | Detecteert project info en registreert het | `~/.claude/registry/` |
| `/deep-scan` | Scant het hele `~/.claude/` ecosysteem | Supabase (4 map-tabellen) |
| `/session-status` | Update STATUS.md in project root | Lokaal bestand |

**Source of truth:** `~/.claude/registry/*.json` — dit zijn de 6 JSON bestanden (agents, commands, skills, prompts, apis, instructions) die alle geregistreerde assets bevatten.

### 2.2 MCP Server (Analyseur)

De MCP server (`cc-v2-mcp/`) analyseert TypeScript projecten via de ts-morph compiler API. Hij biedt 7 tools die jij als Claude direct kunt aanroepen:

| MCP Tool | Wat het doet |
|----------|-------------|
| `analyze_project` | Volledige code-analyse: symbolen + references + diagnostics + dependencies + metrics. Slaat resultaten op in Supabase. |
| `query_symbols` | Zoek functies, classes, interfaces met filters op kind, naam, bestand |
| `find_references` | Vind alle plekken waar een symbool wordt gebruikt |
| `get_diagnostics` | TypeScript compiler fouten en warnings ophalen |
| `get_dependencies` | npm packages ophalen per type (production/dev/peer/optional) |
| `get_metrics` | Totaalcijfers: bestanden, regels code, symbolen, exports, errors |
| `project_health` | Health score: healthy / needs-attention / unhealthy |

**Gebruik:** Roep `analyze_project` aan met een projectpad. De resultaten verschijnen daarna in het dashboard onder de Code, Dependencies en Health tabs.

### 2.3 Dashboard (Overzicht)

De Next.js web applicatie die alles visueel maakt. Shadow opent dit in zijn browser om te zien wat er speelt. Het dashboard **leest** data uit Supabase — het produceert zelf geen assets.

---

## 3. Data Flow — Van Lokaal naar Dashboard

Er zijn drie parallelle data-pipelines die het dashboard vullen:

### Pipeline 1: Registry Sync

```
~/.claude/registry/*.json          ← 6 JSON bestanden (source of truth)
        │
        ▼
scripts/sync-registry.mjs          ← Node.js script, draait lokaal
        │  POST per type (agent, command, skill, prompt, api, instruction)
        ▼
POST /api/sync                     ← Vercel API route, beveiligd met x-api-key
        │
        ├── DELETE + INSERT → registry_items       (alle assets)
        ├── INSERT → project_changelog             (wat is er veranderd)
        ├── INSERT → entity_versions               (voor Timeline view)
        ├── INSERT → activity_log                  (audit trail)
        └── UPSERT → projecten                     (auto-create projecten)
```

**Hoe te draaien:**
```bash
cd command-center-app
SYNC_API_KEY="<key>" npm run sync
```

### Pipeline 2: Code Intelligence (MCP)

```
Claude Code roept aan: analyze_project("/pad/naar/project")
        │
        ▼
cc-v2-mcp → ts-morph laadt tsconfig.json + bronbestanden
        │
        ├── extractSymbols()      → project_symbols      (~419 per project)
        ├── extractReferences()   → project_references    (~427 per project)
        ├── extractDiagnostics()  → project_diagnostics   (0 bij gezonde code)
        ├── extractDependencies() → project_dependencies  (~21 per project)
        ├── extractApiRoutes()    → project_api_routes    (Next.js routes)
        └── calculateMetrics()    → project_metrics       (1 rij per project)
```

### Pipeline 3: Deep Scan (Ecosysteem)

```
npx tsx scripts/deep-scan.ts       ← Draait lokaal (niet op Vercel)
        │
        ▼
~/.claude/ wordt gescand in 5 fases:
        │
        ├── Phase 1: scanInventory()        → 232+ items
        ├── Phase 2: detectHierarchies()    → 90+ tree structures
        ├── Phase 3: detectRelationships()  → 338+ relaties
        ├── Phase 4: detectClusters()       → 12+ groepen
        └── Phase 5: generateInsights()     → 58+ inzichten
        │
        ▼
POST /api/sync/deep-scan → Supabase
        │
        ├── entity_relationships    (wie hangt samen met wie)
        ├── asset_hierarchy         (ouder-kind boomstructuren)
        ├── system_clusters         (auto-gedetecteerde groepen)
        └── map_insights            (aanbevelingen en waarschuwingen)
```

---

## 4. Observer + Actor — Het Automatiseringssysteem

Het Observer + Actor systeem bewaakt het ecosysteem automatisch en genereert alerts wanneer er iets mis is.

### Observer: 3 Edge Functions

| Edge Function | Trigger | Wat het doet |
|---------------|---------|-------------|
| **health-check** | pg_cron elke 6 uur | 5 checks: unhealthy projects, stale assets, orphans, failed jobs, stale sync. Maakt alerts aan, resolved automatisch opgeloste problemen. |
| **alert-digest** | pg_cron dagelijks 7:00 UTC | Telt open alerts, resolved info-alerts ouder dan 7 dagen, maakt dagelijks overzicht-alert. |
| **sync-trigger** | Op aanroep | Triggert registry sync status check + health-check keten. |

### Actor: Dashboard UI

| Component | Waar | Wat het doet |
|-----------|------|-------------|
| **NotificationBell** | Sidebar | Realtime badge met aantal ongelezen alerts, dropdown met laatste 5 |
| **SyncStatus** | Sidebar | Groene/amber/rode stip met tijd sinds laatste sync |
| **CommandPanel** | Ctrl+J | 4 acties: Sync Registry, Deep Scan, Health Check, Code Analyse |
| **AttentionSection** | Homepage | Toont critical en warning alerts bovenaan |
| **AlertsList** | /alerts | Volledig alert management met filters en bulk acties |

### Automatische Flow

```
pg_cron (elke 6 uur)
    │
    ▼
health-check Edge Function
    │
    ├── Checkt 5 gezondheidsmetrics
    ├── Maakt nieuwe alerts (met deduplicatie)
    ├── Resolved oude alerts automatisch
    └── Update sync_status tabel
    │
    ▼
Supabase Realtime (WebSocket)
    │
    ▼
NotificationBell badge update (live in browser)
```

---

## 5. Intelligence Map — Het Ecosysteem Visueel

De Intelligence Map (`/map`) toont het hele AI-ecosysteem als een interactieve kaart.

### Views

| View | Wat je ziet |
|------|------------|
| **Cockpit** | Grid van cluster-kaarten met stats (standaard) |
| **Kaart** | Force-directed graph met WebGL — nodes zijn assets, lijnen zijn relaties |
| **Tijdlijn** | Chronologisch overzicht van veranderingen (uit entity_versions) |
| **Vergelijk** | Twee projecten naast elkaar vergelijken |

### Zijpanelen

| Paneel | Inhoud |
|--------|--------|
| **Kosten** | Maandelijkse kosten per dienst en project |
| **Gebruik** | Top 10 meest gebruikte assets + ongebruikte items |
| **Inzichten** | Auto-gegenereerde aanbevelingen (orphans, hubs, gaps) |
| **Risico** | Afhankelijkheidsanalyse |

### Data

De Intelligence Map leest uit 4 tabellen die door Deep Scan worden gevuld:

| Tabel | Inhoud | Volume |
|-------|--------|--------|
| `entity_relationships` | Alle relaties (source → target, type, sterkte) | 338+ |
| `asset_hierarchy` | Boomstructuren (parent-child, depth) | 90+ |
| `system_clusters` | Groepen (naam, health, member_count) | 12 |
| `map_insights` | Inzichten (type, severity, affected items) | 58+ |

---

## 6. Project Dossier — Per Project

Elk project heeft een detail-pagina (`/projects/[slug]`) met 7 tabs:

| Tab | Bron | Inhoud |
|-----|------|--------|
| **Overzicht** | Sync + Deep Scan | Identity card, changelog, memories, tech stack, aandachtspunten |
| **Functies** | Deep Scan | Auto-detected capabilities per categorie |
| **Onderdelen** | Deep Scan | Hierarchische boom van project-assets |
| **Verbindingen** | Deep Scan | Relaties met andere projecten + gedeelde diensten |
| **Code** | MCP Server | Symbolen gegroepeerd per bestand, filter per kind |
| **Dependencies** | MCP Server | npm packages per type (production/dev/peer/optional) |
| **Health** | MCP Server | Health badge, metrics grid, diagnostics, taalverdeling |

---

## 7. Jouw Rol als Claude

### Wat je moet weten

1. **Shadow codeert niet.** Jij bent zijn complete development team. Hij geeft opdrachten, jij voert uit.
2. **Command Center is het centrale overzicht.** Alles wat je maakt of wijzigt, moet uiteindelijk zichtbaar zijn in het dashboard.
3. **De registry is de source of truth.** `~/.claude/registry/*.json` bepaalt wat er in het dashboard staat.

### Commands die je kent

| Command | Wanneer gebruiken |
|---------|-------------------|
| `/sync-cc` | Na het toevoegen/wijzigen van assets in de registry |
| `/memory` | Om project-specifieke kennis op te slaan die tussen sessies bewaard moet blijven |
| `/onboard` | Bij het eerste bezoek aan een nieuw project |
| `/save-to-cc` | Wanneer je iets herbruikbaars hebt gemaakt (agent, command, skill, etc.) |
| `/deep-scan` | Na grote wijzigingen aan het ecosysteem |
| `/session-status` | Bij het afsluiten van een sessie |

### MCP Tools die je hebt

Je hebt directe toegang tot de Code Intelligence MCP server. Gebruik deze tools wanneer Shadow vraagt over code-kwaliteit, projectgezondheid, of technische details:

```
analyze_project(path)       → Volledige analyse starten
query_symbols(project)      → Symbolen zoeken
find_references(project)    → Cross-references
get_diagnostics(project)    → Fouten/warnings
get_dependencies(project)   → npm packages
get_metrics(project)        → Code metrics
project_health(project)     → Health score
```

### Trigger Systeem

Als je iets herbruikbaars aanmaakt, **vraag Shadow of het opgeslagen moet worden** in Command Center:

| Type | Detectie | Opslaglocatie |
|------|----------|---------------|
| API configuratie | API key, endpoint, credentials | `~/.claude/apis/[service]/` |
| Prompt template | Herbruikbaar systeem/user prompt | `~/.claude/prompts/` |
| Skill definitie | SKILL.md of herbruikbare instructies | `~/.claude/skills/` |
| Agent definitie | Agent met specifieke rol | `~/.claude/agents/` |
| Instructie set | Project/workflow regels | `~/.claude/instructions/` |
| Slash command | Nieuwe /command | `~/.claude/commands/` |

Na opslag: registreer in `~/.claude/registry/[type].json` en draai `/sync-cc`.

### Wat je NIET moet doen

- **Geen bestanden verwijderen** zonder toestemming
- **Geen database migraties** zonder toestemming
- **Geen deployments** zonder het deployment protocol te volgen
- **Geen .env bestanden aanpassen** zonder toestemming
- **Geen scope creep** — vraag eerst als je denkt "het zou ook handig zijn om..."

---

## 8. Technisch Overzicht

### Tech Stack

| Onderdeel | Technologie |
|-----------|-------------|
| Framework | Next.js 14 (App Router, Server Components) |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS v4, Shadow Huisstijl (zinc-only palette) |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit |
| Code Analyse | ts-morph (TypeScript Compiler API) |
| MCP Protocol | @modelcontextprotocol/sdk |
| Graph | react-force-graph-2d (WebGL) |
| Animaties | Framer Motion |
| Deployment | Vercel |
| Automatisering | Supabase Edge Functions + pg_cron |
| Realtime | Supabase Realtime (WebSocket) |

### Design System

Shadow's Huisstijl is strikt:
- **ALLEEN** zinc palette (geen blauw, groen, paars)
- Glassmorphism voor depth, monochrome glow voor hover
- Inter (body), DM Sans (headings), JetBrains Mono (code)
- Spring animaties via Framer Motion

### Directory Structuur

```
command-center-v2/
├── command-center-app/            # Next.js dashboard
│   ├── src/
│   │   ├── app/                   # Pages + API routes
│   │   │   ├── (dashboard)/       # 9 pagina's
│   │   │   └── api/               # 22 API routes
│   │   ├── components/            # 56 componenten
│   │   ├── hooks/                 # useRealtimeAlerts
│   │   ├── lib/                   # Server-side queries + deep-scan engine
│   │   └── types/index.ts         # Alle TypeScript interfaces
│   ├── scripts/
│   │   ├── sync-registry.mjs      # Registry sync runner
│   │   └── deep-scan.ts           # Deep scan runner
│   └── .env.local                 # Environment variables
│
├── cc-v2-mcp/                     # Code Intelligence MCP server
│   └── src/
│       ├── index.ts               # 7 MCP tools
│       ├── analyzer/              # ts-morph analyse pipeline
│       └── lib/                   # Types, Supabase client, storage
│
├── supabase/
│   ├── functions/                 # 3 Edge Functions
│   │   ├── health-check/
│   │   ├── sync-trigger/
│   │   └── alert-digest/
│   └── migrations/                # SQL migraties
│
├── docs/
│   ├── plans/                     # Design docs en plannen
│   └── COMMAND-CENTER-ONBOARDING.md  # Dit document
│
├── CLAUDE.md                      # Project instructies voor Claude
└── STATUS.md                      # Huidige staat van het project
```

### Environment Variables

| Variabele | Doel |
|-----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publieke Supabase key (voor client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key (bypass RLS) |
| `SYNC_API_KEY` | Auth token voor sync API routes |

### Database Schema (25 tabellen)

**Registry & Dashboard:**
`registry_items` · `projecten` · `project_changelog` · `kanban_tasks` · `activity_log` · `project_memories` · `inbox_pending`

**Intelligence Map & Deep Scan:**
`entity_relationships` · `asset_hierarchy` · `system_clusters` · `map_insights` · `entity_versions` · `project_api_routes` · `service_costs` · `usage_statistics` · `user_visits` · `shared_views` · `user_bookmarks`

**Code Intelligence (MCP):**
`project_symbols` · `project_references` · `project_diagnostics` · `project_dependencies` · `project_metrics`

**Observer + Actor:**
`alerts` · `job_queue` · `sync_status`

---

## 9. Conventies

| Regel | Toelichting |
|-------|-------------|
| Server Components by default | Pages zijn async server components |
| `'use client'` alleen voor interactie | Filters, modals, drag-drop, realtime |
| Supabase via SERVICE_ROLE_KEY | Server queries bypassen RLS |
| API auth via `x-api-key` header | Alleen voor sync/write routes |
| Tailwind v4 met `@layer components` | Custom CSS in layer blok voor Lightning CSS |
| Relatieve paden in code | Geen hardcoded absolute paden |
| Vercel = standaard deployment | `vercel --prod` of git push |

---

## 10. Snelle Referentie

### Veel voorkomende taken

| Ik wil... | Doe dit... |
|-----------|-----------|
| Zien wat er in CC staat | Open https://command-center-app-nine.vercel.app |
| Registry synchroniseren | `cd command-center-app && SYNC_API_KEY="<key>" npm run sync` |
| Deep Scan draaien | `cd command-center-app && npx tsx scripts/deep-scan.ts` |
| Project analyseren | MCP tool: `analyze_project("/pad/naar/project")` |
| Health check forceren | `curl -X POST https://ikpmlhmbooaxfrlpzcfa.supabase.co/functions/v1/health-check -H "Authorization: Bearer <SERVICE_ROLE_KEY>"` |
| Memory schrijven | `/memory` command of `POST /api/projects/[slug]/memories` |
| Asset opslaan | `/save-to-cc` → registreer in registry JSON → `/sync-cc` |
| Deployen | `cd command-center-app && vercel --prod` |
| Status checken | Lees `STATUS.md` in project root |

### Belangrijke bestanden

| Bestand | Wat het is |
|---------|-----------|
| `CLAUDE.md` | Project instructies (lees dit altijd eerst) |
| `STATUS.md` | Huidige staat + sessie-log |
| `command-center-app/src/types/index.ts` | Alle TypeScript interfaces |
| `command-center-app/src/lib/` | Server-side data queries |
| `command-center-app/scripts/sync-registry.mjs` | Sync script |
| `cc-v2-mcp/src/index.ts` | MCP server met 7 tools |
| `supabase/functions/health-check/index.ts` | Health check logica |
| `.env.local` | Environment variables (nooit committen) |
