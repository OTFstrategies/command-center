# Command Center — Onboarding voor Claude Sessies

> **Lees dit als je voor het eerst werkt aan of met Command Center.**
> Dit document legt uit wat het systeem is, hoe `~/.claude/` is ingericht, hoe alles samenhangt met Claude Code, en wat jouw rol is als Claude in dit ecosysteem.

---

## 1. Wat is Command Center?

Command Center is Shadow's **absoluut middelpunt** voor zijn complete Claude Code setup. Het visualiseert, beheert en bewaakt alles wat Shadow met Claude Code heeft gebouwd en doet: agents, commands, skills, prompts, API-configuraties, instructies, projecten en hun onderlinge relaties.

Denk aan het als een **vliegtuigcockpit** — Shadow ziet in een oogopslag:
- Welke assets hij heeft (100+ agents, commands, skills)
- Hoe ze samenhangen (338+ relaties, 12+ clusters)
- Of alles gezond is (automatische health checks elke 6 uur)
- Wat er recent is veranderd (changelog, alerts, sync status)
- Hoe zijn code erbij staat (symbolen, dependencies, health scores)

**Kernprincipe:** Alles wat Claude Code produceert of wijzigt, moet uiteindelijk zichtbaar zijn in Command Center. Geen onzichtbare assets, geen vergeten projecten, geen losse eindjes.

**Live URL:** https://command-center-app-nine.vercel.app
**Supabase Project:** `ikpmlhmbooaxfrlpzcfa`

---

## 2. De Drie Systeemrollen

```
┌──────────────────────────────────────────────────────────────┐
│                    Shadow (Product Owner)                      │
│                Geeft opdrachten, checkt resultaten              │
└──────────────────────────┬───────────────────────────────────┘
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
│ ~/.claude/  │  │ cc-mcp/         │  │ command-center-  │
│ registry/   │  │                  │  │ app/             │
└──────┬──────┘  └────────┬─────────┘  └────────┬─────────┘
       │                  │                     │
       │    sync          │    analyse          │    lees
       ▼                  ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                     Supabase (PostgreSQL)                      │
│  registry_items · alerts · job_queue · project_symbols · ...  │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Claude Code CLI (Producent)

Dit is waar jij als Claude draait. Claude Code is de **producent** van het ecosysteem:

| Actie | Wat het doet | Waar het landt |
|-------|-------------|----------------|
| `/save-to-cc` | Slaat een nieuw asset op (agent, command, skill, etc.) | `~/.claude/registry/*.json` + bestand |
| `/sync-cc` | Synchroniseert registry naar database | Supabase via `/api/sync` |
| `/memory` | Schrijft project-specifieke notities | Supabase `project_memories` |
| `/onboard` | Detecteert project info en registreert het | `~/.claude/registry/` |
| `/deep-scan` | Scant het hele `~/.claude/` ecosysteem | Supabase (4 map-tabellen) |
| `/session-status` | Update STATUS.md in project root | Lokaal bestand |

**Source of truth:** `~/.claude/registry/*.json` — dit zijn de 6 JSON bestanden (agents, commands, skills, prompts, apis, instructions) die alle geregistreerde assets bevatten.

### 2.2 MCP Server (Analyseur)

De MCP server (`cc-mcp/`) analyseert TypeScript projecten via de ts-morph compiler API. 7 tools die jij als Claude direct kunt aanroepen:

| MCP Tool | Wat het doet |
|----------|-------------|
| `analyze_project` | Volledige code-analyse: symbolen + references + diagnostics + dependencies + metrics. Slaat op in Supabase. |
| `query_symbols` | Zoek functies, classes, interfaces met filters op kind, naam, bestand |
| `find_references` | Vind alle plekken waar een symbool wordt gebruikt |
| `get_diagnostics` | TypeScript compiler fouten en warnings ophalen |
| `get_dependencies` | npm packages ophalen per type (production/dev/peer/optional) |
| `get_metrics` | Totaalcijfers: bestanden, regels code, symbolen, exports, errors |
| `project_health` | Health score: healthy / needs-attention / unhealthy |

### 2.3 Dashboard (Overzicht)

De Next.js web applicatie die alles visueel maakt. Shadow opent dit in zijn browser om te zien wat er speelt. Het dashboard **leest** data uit Supabase — het produceert zelf geen assets.

---

## 3. ~/.claude/ Inrichting — De Kern van Command Center

De `~/.claude/` directory is het fundament van het hele ecosysteem. Hoe deze is ingericht bepaalt wat Command Center kan zien, tracken en bewaken.

### 3.1 Directory Classificatie

Elke map en elk bestand in `~/.claude/` valt in een van vier categorieen:

```
~/.claude/
│
├── ══════════ ASSETS (getrackt door CC) ══════════════════════
│
├── commands/                  # 62+ slash commands (.md bestanden)
│   ├── agent-os.md            #   → Hoofd-entry voor Agent OS workflow
│   ├── agent-os/              #   → 6 sub-commands (create-tasks, implement, etc.)
│   ├── miro-start.md          #   → Hoofd-entry voor Miro diagrammen
│   ├── miro-flowcharts*.md    #   → 12 flowchart templates
│   ├── miro-architecture*.md  #   → 12 architectuur templates
│   ├── miro-frameworks*.md    #   → 12 framework templates
│   ├── hs-*.md                #   → 6 Handboek Staalconstructies commands
│   ├── sync-cc.md             #   → Registry sync trigger
│   ├── save-to-cc.md          #   → Asset opslaan in CC
│   ├── memory.md              #   → Project memory schrijven
│   ├── onboard.md             #   → Project onboarding
│   ├── session-status.md      #   → Sessie status rapportage
│   ├── setup-huisstijl.md     #   → Design system installatie
│   ├── design-os.md           #   → Product planning workflow
│   ├── vibe-sync.md           #   → Kanban synchronisatie
│   └── connect-project/       #   → Project koppelen aan CC
│
├── agents/                    # 10+ agent definities
│   ├── agent-os/              #   → 8 sub-agents (spec-writer, implementer, etc.)
│   ├── hs-docs/               #   → Handboek Staalconstructies agent
│   ├── Form-maker/            #   → RMONI formulier agent (bevat agent-os fork)
│   └── veha-marketing-agent.md
│
├── skills/                    # Herbruikbare multi-step workflows
│   └── miro-patterns/         #   → 40 Miro diagram patronen
│       ├── SKILL.md            #     Hoofd-instructie
│       ├── examples/           #     JSON voorbeelden
│       └── references/         #     Kleur/layout/shape catalogi
│
├── apis/                      # API configuraties per dienst
│   ├── anthropic/config.md    #   → Anthropic API setup
│   └── supabase/veha-hub.json #   → Supabase VEHA Hub config
│
├── instructions/              # Workflow regels en project-specifieke instructies
│   ├── per-project/           #   → command-center-v2.md
│   ├── workflows/             #   → deployment-protocol.md
│   └── research/              #   → LLM gedragspatroon onderzoek
│
├── prompts/                   # Prompt templates
│   ├── design-style-shadow.md #   → Shadow's design stijl prompt
│   ├── system/                #   → System prompts
│   ├── project/               #   → Project-specifieke prompts
│   └── templates/             #   → Herbruikbare templates
│
├── design-system/             # Shadow's Huisstijl (verplicht voor elk UI-project)
│   ├── HUISSTIJL.md           #   → Volledige design regels
│   ├── tokens/index.css       #   → CSS tokens (zinc, glassmorphism, glow)
│   ├── animations/            #   → Framer Motion + GSAP presets
│   ├── components/            #   → shadcn/ui configuratie
│   ├── lib/utils.ts           #   → cn() utility
│   └── examples/              #   → Voorbeeldcode
│
│
├── ══════════ REGISTRY (source of truth voor CC) ════════════
│
├── registry/
│   ├── commands.json          # 72 geregistreerde commands
│   ├── agents.json            # 20 geregistreerde agents
│   ├── skills.json            # 2 geregistreerde skills
│   ├── apis.json              # 2 geregistreerde API configs
│   ├── instructions.json      # 5 geregistreerde instructie sets
│   ├── prompts.json           # 1 geregistreerd prompt template
│   └── logs.json              # Sync log (intern gebruik)
│
│
├── ══════════ INTEGRATIE (CC triggers & automatisering) ══════
│
├── hookify.command-center-agent.local.md      # Auto-detectie: nieuwe agent
├── hookify.command-center-api.local.md        # Auto-detectie: nieuwe API config
├── hookify.command-center-command.local.md     # Auto-detectie: nieuwe slash command
├── hookify.command-center-instruction.local.md # Auto-detectie: nieuwe instructie
├── hookify.command-center-prompt.local.md      # Auto-detectie: nieuw prompt template
├── hookify.command-center-skill.local.md       # Auto-detectie: nieuwe skill
├── hooks/                                      # Git-style hooks (beschikbaar voor auto-sync)
│
│
├── ══════════ PLUGINS (uitbreidingen) ════════════════════════
│
├── plugins/
│   ├── local/                 # 4 zelfgebouwde plugins
│   │   ├── revision-guardian/ #   → Document revisie bewaking
│   │   ├── security-os/       #   → Security scanning & tooling
│   │   ├── veha-generators/   #   → VEHA document generatoren
│   │   └── veha-manager/      #   → VEHA project management
│   ├── cache/                 # Geinstalleerde marketplace plugins (auto-managed)
│   └── marketplaces/          # Plugin bronnen (auto-managed)
│
│
├── ══════════ CONFIGURATIE ═══════════════════════════════════
│
├── CLAUDE.md                  # Globale instructies (jij leest dit elke sessie)
├── settings.json              # Plugins + permissions (bypassPermissions)
├── settings.local.json        # Per-machine allow-regels
│
│
└── ══════════ SYSTEEM (genegeerd door CC) ════════════════════

    ├── cache/                 # Claude Code interne cache
    ├── debug/                 # Debug bestanden
    ├── telemetry/             # Usage telemetry
    ├── session-env/           # Sessie omgevingsvariabelen
    ├── shell-snapshots/       # Shell state snapshots
    ├── todos/                 # Todo lijsten (per sessie)
    ├── paste-cache/           # Clipboard cache
    ├── file-history/          # File edit history
    ├── downloads/             # Downloaded bestanden
    ├── usage-data/            # Usage data
    ├── statsig/               # Feature flags
    ├── logs/                  # Interne logs
    ├── backups/               # Backup bestanden
    ├── plans/                 # Sessie plannen
    ├── projects/              # Per-project Claude state (conversations, etc.)
    ├── security/              # Security state
    ├── stats-cache.json       # Stats cache
    ├── history.jsonl          # Conversation history
    ├── .credentials.json      # Auth credentials
    └── security_warnings_*.json # Per-sessie security warnings
```

### 3.2 Wat Command Center Scant

CC heeft drie manieren om data uit `~/.claude/` te halen. Elk scant andere dingen:

| Pipeline | Wat het leest | Wat het negeert | Wanneer |
|----------|--------------|-----------------|---------|
| **Registry Sync** | `registry/*.json` (6 bestanden) | Alles behalve registry | Op `/sync-cc` |
| **Deep Scan** | commands, agents, skills, apis, instructions, prompts, plugins, design-system, projects | cache, debug, telemetry, session-env, todos, node_modules, .git | Op `/deep-scan` |
| **MCP Server** | Project broncode (buiten ~/.claude/) | ~/.claude/ zelf | Op `analyze_project` |

### 3.3 Registry Structuur

Elk registry bestand volgt hetzelfde formaat. Dit is wat de sync naar Supabase stuurt:

```json
{
  "description": "Beschrijving van dit type",
  "items": [
    {
      "id": "uniek-id",
      "name": "Weergavenaam",
      "path": "relatief/pad/naar/bestand",
      "description": "Wat dit asset doet (1 zin)",
      "created": "2026-02-01",
      "project": "project-naam of 'global'",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

**Regels:**
- `id` moet uniek zijn binnen het type
- `path` is relatief ten opzichte van `~/.claude/`
- `project` koppelt het asset aan een project in CC (of `"global"` voor ecosysteem-breed)
- `tags` worden gebruikt door Deep Scan voor relatie-detectie
- Elk registry bestand correspondeert met een asset-directory (commands.json ↔ commands/)

### 3.4 Hookify Integratie

Zes hookify-regels zorgen ervoor dat CC automatisch op de hoogte wordt gebracht wanneer je een nieuw asset aanmaakt. Ze detecteren patronen in bestanden en waarschuwen je:

| Hookify Regel | Detecteert | Regex Pattern |
|---------------|-----------|---------------|
| `command-center-command` | Slash commands | `/[a-z]+-[a-z]+`, `command:`, `subcommands:` |
| `command-center-agent` | Agent definities | `"Deze agent..."`, `tools: [...]`, `persona` |
| `command-center-skill` | Skill definities | `SKILL.md`, `multi-step`, `workflow` |
| `command-center-prompt` | Prompt templates | `"You are..."`, `role: "system"` |
| `command-center-api` | API configuraties | `API_KEY`, `sk-`, `Bearer`, `endpoint` |
| `command-center-instruction` | Instructie sets | `"Altijd eerst..."`, `coding standards` |

**Flow bij detectie:**
```
Je maakt iets herbruikbaars
    │
    ▼
Hookify detecteert patroon
    │
    ▼
Waarschuwing: "Wil je dit opslaan in Command Center?"
    │
    ├── Ja → /save-to-cc → bestand + registry update → /sync-cc
    ├── Nee → lokaal houden
    └── Later → review lijst
```

### 3.5 Lokale Plugins

Vier zelfgebouwde plugins breiden Claude Code uit met domein-specifieke functionaliteit:

| Plugin | Inhoud | Domein |
|--------|--------|--------|
| **revision-guardian** | Agents, hooks, skills voor document revisie bewaking | Kwaliteitscontrole |
| **security-os** | Agents, commands, config, hooks, scripts voor security | Beveiliging |
| **veha-generators** | Skills voor VEHA document generatie | VEHA bedrijf |
| **veha-manager** | Agents, commands voor VEHA project management | VEHA bedrijf |

Plugins worden getrackt door Deep Scan (als onderdeel van het ecosysteem) en verschijnen als clusters op de Intelligence Map.

### 3.6 Design System (Huisstijl)

Het design system is **verplicht voor elk UI-project** en wordt door Deep Scan herkend als apart systeem:

- **Detectie:** Deep Scan zoekt naar "Huisstijl" of "design-system" in project CLAUDE.md bestanden
- **Relatie:** Projecten die het gebruiken krijgen een `applies` relatie met het design system
- **Cluster:** Alle projecten met Huisstijl vormen samen een cluster op de Intelligence Map

**Kernregels:**
- ALLEEN zinc palette (GEEN blauwe, groene, paarse accenten)
- DM Sans headings, Inter body, JetBrains Mono code
- Glassmorphism voor depth, monochrome glow voor hover
- Spring animaties (Framer Motion) voor interactie
- Installatie: `/setup-huisstijl` in elk nieuw project

### 3.7 Settings Configuratie

`settings.json` bepaalt welke plugins actief zijn en hoe permissies werken:

```json
{
  "permissions": { "defaultMode": "bypassPermissions" },
  "enabledPlugins": {
    "revision-guardian@local": true,
    "security-os@local": true,
    "veha-generators@local": false,
    "veha-manager@local": false,
    "context7@claude-plugins-official": true,
    "feature-dev@claude-plugins-official": true,
    "supabase@claude-plugins-official": true,
    "playwright@claude-plugins-official": true,
    "vercel@claude-plugins-official": true,
    "...en 20+ andere marketplace plugins"
  }
}
```

---

## 4. Data Flow — Van Lokaal naar Dashboard

Drie parallelle pipelines vullen het dashboard:

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

**Draaien:** `cd command-center-app && SYNC_API_KEY="<key>" npm run sync`

### Pipeline 2: Code Intelligence (MCP)

```
Claude Code roept aan: analyze_project("/pad/naar/project")
        │
        ▼
cc-mcp → ts-morph laadt tsconfig.json + bronbestanden
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
npx tsx scripts/deep-scan.ts       ← Draait lokaal
        │
        ▼
~/.claude/ wordt gescand in 5 fases:
        │
        ├── Phase 1: scanInventory()        → 232+ items
        │   Leest: registry/, commands/, agents/, skills/, apis/,
        │   instructions/, prompts/, plugins/local/, design-system/
        │
        ├── Phase 2: detectHierarchies()    → 90+ tree structures
        │   Methodes: slash-naming, dash-naming, agent folders, plugin nesting
        │
        ├── Phase 3: detectRelationships()  → 338+ relaties
        │   9 typen: belongs_to, shares_service, applies, parent_of,
        │   part_of, invokes, references, related_to, depends_on
        │
        ├── Phase 4: detectClusters()       → 12+ groepen
        │   6 strategieen: name prefix, plugin, project, design system,
        │   services, unclustered remainder
        │
        └── Phase 5: generateInsights()     → 58+ inzichten
            8 typen: orphan, hub, gap, scale, isolated, SPOF, pattern, health
        │
        ▼
POST /api/sync/deep-scan → Supabase
        ├── entity_relationships    (wie hangt samen met wie)
        ├── asset_hierarchy         (ouder-kind boomstructuren)
        ├── system_clusters         (auto-gedetecteerde groepen)
        └── map_insights            (aanbevelingen en waarschuwingen)
```

---

## 5. Observer + Actor — Automatische Bewaking

Het Observer + Actor systeem bewaakt het ecosysteem automatisch en genereert alerts.

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
| **CommandPanel** | Cmd+J | 4 acties: Sync Registry, Deep Scan, Health Check, Code Analyse |
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

## 6. Intelligence Map — Het Ecosysteem Visueel

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
| **Risico** | Afhankelijkheidsanalyse (single points of failure) |

### Deep Scan Relatie-Detectie

De Intelligence Map is zo krachtig als de relaties die Deep Scan detecteert:

| Relatie Type | Hoe gedetecteerd | Sterkte |
|-------------|-----------------|---------|
| `belongs_to` | Items met zelfde `project` veld | 2 |
| `shares_service` | Gedeelde Supabase/Vercel/etc. in .env of package.json | 1-3 |
| `applies` | Project CLAUDE.md noemt "Huisstijl" of "design-system" | 2 |
| `parent_of` | Hierarchie uit naamgeving (slash/dash) of mapstructuur | 3 |
| `part_of` | Item hoort bij een plugin | 3 |
| `invokes` | Agent .md bevat `/command-naam` patronen | 2 |
| `references` | Agent noemt andere agent bij naam | 1 |
| `related_to` | Gedeelde tags (groepen van 2-10 items) | 1 |
| `depends_on` | Externe dienst in package.json (Supabase, React, Next.js) | 2 |

---

## 7. Project Dossier — Per Project

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

## 8. Alle Beschikbare Commands

### Command Center Commands

| Command | Functie |
|---------|---------|
| `/sync-cc` | Registry synchroniseren naar Supabase |
| `/save-to-cc` | Asset opslaan in Command Center |
| `/memory` | Project-specifieke notitie schrijven |
| `/onboard` | Project detecteren en registreren |
| `/session-status` | STATUS.md updaten bij sessie-einde |
| `/connect-project` | Project koppelen aan CC |

### Workflow Commands

| Command | Functie |
|---------|---------|
| `/agent-os` | Spec-driven development starten (8 sub-agents) |
| `/agent-os/write-spec` | Specificatie schrijven |
| `/agent-os/shape-spec` | Specificatie verfijnen |
| `/agent-os/plan-product` | Product planning |
| `/agent-os/create-tasks` | Taken genereren |
| `/agent-os/implement-tasks` | Taken implementeren |
| `/agent-os/orchestrate-tasks` | Taken orchestreren |
| `/design-os` | Product planning workflow |
| `/vibe-sync` | Kanban synchronisatie |
| `/setup-huisstijl` | Design system installeren in project |

### Miro Diagram Commands (40 templates)

| Categorie | Commands | Aantal |
|-----------|---------|--------|
| **Start** | `/miro-start` | 1 |
| **Flowcharts** | `/miro-flowcharts`, `-process` (-linear, -circular, -swimlane), `-decision` (-binary, -multi, -matrix), `-workflow` (-approval, -pipeline, -state) | 12 |
| **Architecture** | `/miro-architecture`, `-system` (-c4, -layers, -microservices), `-component` (-class, -container, -module), `-data` (-erd, -flow, -pipeline) | 12 |
| **Frameworks** | `/miro-frameworks`, `-kanban` (-basic, -extended, -wip), `-matrix` (-eisenhower, -priority, -risk), `-roadmap` (-timeline, -swimlane, -now-next-later) | 12 |

### Domein-Specifieke Commands

| Command | Functie |
|---------|---------|
| `/hs-scan` | Handboek Staalconstructies scannen |
| `/hs-extract` | HS data extractie |
| `/hs-combine` | HS data combineren |
| `/hs-docs` | HS documentatie |
| `/hs-l4` | HS Level 4 verwerking |
| `/hs-l5` | HS Level 5 verwerking |

---

## 9. Jouw Rol als Claude

### Kernprincipes

1. **Shadow codeert niet.** Jij bent zijn complete development team. Hij geeft opdrachten, jij voert uit.
2. **Command Center is het absolute middelpunt.** Alles wat je maakt of wijzigt, moet uiteindelijk zichtbaar zijn in het dashboard.
3. **De registry is de source of truth.** `~/.claude/registry/*.json` bepaalt wat er in het dashboard staat.
4. **Hookify waarschuwt je.** Als je iets herbruikbaars maakt, krijg je een trigger — volg die op.

### Workflow bij Asset Creatie

Elke keer dat je iets herbruikbaars maakt:

```
1. Maak het bestand aan in de juiste ~/.claude/ directory
2. Registreer in ~/.claude/registry/[type].json
3. Draai /sync-cc om het naar het dashboard te pushen
4. (Optioneel) Draai /deep-scan als relaties zijn veranderd
```

### Trigger Systeem

Als je iets herbruikbaars aanmaakt, **vraag Shadow of het opgeslagen moet worden**:

| Type | Detectie | Opslaglocatie | Registry |
|------|----------|---------------|----------|
| API configuratie | API key, endpoint, credentials | `~/.claude/apis/[service]/` | `apis.json` |
| Prompt template | System prompt, persona, instructies | `~/.claude/prompts/` | `prompts.json` |
| Skill definitie | SKILL.md, multi-step workflow | `~/.claude/skills/` | `skills.json` |
| Agent definitie | Agent met rol en tools | `~/.claude/agents/` | `agents.json` |
| Instructie set | Coding standards, workflow regels | `~/.claude/instructions/` | `instructions.json` |
| Slash command | `/command-naam` | `~/.claude/commands/` | `commands.json` |

### MCP Tools

Je hebt directe toegang tot de Code Intelligence MCP server:

```
analyze_project(path)       → Volledige analyse starten
query_symbols(project)      → Symbolen zoeken
find_references(project)    → Cross-references
get_diagnostics(project)    → Fouten/warnings
get_dependencies(project)   → npm packages
get_metrics(project)        → Code metrics
project_health(project)     → Health score
```

### Wat je NIET moet doen

- **Geen bestanden verwijderen** zonder toestemming
- **Geen database migraties** zonder toestemming
- **Geen deployments** zonder het deployment protocol te volgen
- **Geen .env bestanden aanpassen** zonder toestemming
- **Geen scope creep** — vraag eerst als je denkt "het zou ook handig zijn om..."

---

## 10. Technisch Overzicht

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

### Directory Structuur

```
command-center/
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
├── cc-mcp/                        # Code Intelligence MCP server
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

### Database Schema (28 tabellen)

**Registry & Dashboard:**
`registry_items` · `projecten` · `project_changelog` · `kanban_tasks` · `activity_log` · `project_memories` · `inbox_pending`

**Intelligence Map & Deep Scan:**
`entity_relationships` · `asset_hierarchy` · `system_clusters` · `map_insights` · `entity_versions` · `project_api_routes` · `service_costs` · `usage_statistics` · `user_visits` · `shared_views` · `user_bookmarks`

**Code Intelligence (MCP):**
`project_symbols` · `project_references` · `project_diagnostics` · `project_dependencies` · `project_metrics`

**Observer + Actor:**
`alerts` · `job_queue` · `sync_status`

---

## 11. Conventies

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

## 12. Snelle Referentie

### Dagelijkse taken

| Ik wil... | Doe dit... |
|-----------|-----------|
| Zien wat er in CC staat | Open https://command-center-app-nine.vercel.app |
| Registry synchroniseren | `/sync-cc` of `cd command-center-app && SYNC_API_KEY="<key>" npm run sync` |
| Deep Scan draaien | `/deep-scan` of `cd command-center-app && npx tsx scripts/deep-scan.ts` |
| Project analyseren | MCP tool: `analyze_project("/pad/naar/project")` |
| Health check forceren | Cmd+J → "Health Check" in dashboard |
| Memory schrijven | `/memory` of `POST /api/projects/[slug]/memories` |
| Asset opslaan | `/save-to-cc` → registreer → `/sync-cc` |
| Deployen | `cd command-center-app && vercel --prod` |
| Status checken | Lees `STATUS.md` in project root |

### Belangrijke bestanden

| Bestand | Wat het is |
|---------|-----------|
| `~/.claude/CLAUDE.md` | Globale instructies (geldt voor ALLE projecten) |
| `CLAUDE.md` (in project root) | Project-specifieke instructies |
| `STATUS.md` | Huidige staat + sessie-log |
| `~/.claude/registry/*.json` | Source of truth voor alle assets |
| `command-center-app/src/types/index.ts` | Alle TypeScript interfaces |
| `command-center-app/src/lib/` | Server-side data queries |
| `command-center-app/scripts/sync-registry.mjs` | Sync script |
| `cc-mcp/src/index.ts` | MCP server met 7 tools |
| `supabase/functions/health-check/index.ts` | Health check logica |
| `.env.local` | Environment variables (nooit committen) |
