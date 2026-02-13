# CC v2 Code Intelligence — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement the accompanying implementation plan.

**Datum:** 13 februari 2026
**Status:** Goedgekeurd door Shadow
**Branch:** feat/code-intelligence (aan te maken)

---

## 1. Aanleiding & Gap Analyse

### Serena vs CC v2 — Definitieve vergelijking

Shadow gebruikte Serena als MCP plugin voor code intelligence. Na uitgebreide analyse is besloten Serena volledig te vervangen door CC v2. Dit document beschrijft hoe.

**Wat CC v2 al vervangt (COMPLEET):**

| Serena Feature | CC v2 Equivalent | Status |
|----------------|------------------|--------|
| `write_memory` / `read_memory` / `list_memories` / `delete_memory` | `/memory` command + Memories API | GEDEKT |
| `activate_project` | ProjectSwitcher + `?project=` filter | GEDEKT |
| `onboarding` / `check_onboarding_performed` | `/onboard` command + PATCH API | GEDEKT |
| `get_current_config` | Settings page + sync status | GEDEKT |
| `remove_project` | Niet nodig (auto-discovered) | GEDEKT |
| `read_file` / `create_text_file` / `list_dir` / `find_file` | Claude Code native: Read, Write, Glob | GEDEKT |
| `delete_lines` / `replace_lines` / `insert_at_line` | Claude Code native: Edit | GEDEKT |
| `search_for_pattern` | Claude Code native: Grep | GEDEKT |
| `execute_shell_command` | Claude Code native: Bash | GEDEKT |
| `think_about_*` | Claude native reasoning | GEDEKT |
| `switch_modes` | Niet van toepassing | N.V.T. |
| Web dashboard | Vercel deployed CC v2 | BETER |

**Wat nog gebouwd moet worden (GAPS):**

| Serena Feature | Te bouwen | Verbetering t.o.v. Serena |
|----------------|-----------|--------------------------|
| `get_symbols_overview` | `query_symbols` MCP tool | + Cloud persistent, + cross-project |
| `find_symbol` | `query_symbols` met filters | + Zoeken over ALLE projecten |
| `find_referencing_symbols` | `find_references` MCP tool | + Persistente cache in Supabase |
| `rename_symbol` | Niet nodig (Claude Edit tool) | Claude's Edit is al beter |
| `replace_symbol_body` | Niet nodig (Claude Edit tool) | Claude's Edit is al beter |
| — (nieuw) | `get_diagnostics` MCP tool | Type errors per project |
| — (nieuw) | `get_dependencies` MCP tool | Package tracking cross-project |
| — (nieuw) | `get_metrics` MCP tool | Code metrics dashboard |
| — (nieuw) | `project_health` MCP tool | Gecombineerd health overzicht |

---

## 2. Doel

CC v2 wordt het **centrale hub voor zowel Shadow (mens) als Claude (AI)**:

- **Shadow** ziet visueel overzicht: project health, metrics, dependencies, diagnostics
- **Claude** krijgt native MCP tools: gestructureerde code data, instant queries, cross-project intelligence
- **Data** persistent in Supabase cloud: overleeft sessies, toegankelijk overal

---

## 3. Architectuur

### Systeemoverzicht

```
Claude Code session
    |
    v
CC v2 Code Intelligence MCP Server (lokaal, Node.js)
    |-- ts-morph (TypeScript compiler API)
    |-- Supabase client (VEHA Hub)
    |
    |--- analyze_project  --> ts-morph full analysis --> Supabase opslag
    |--- query_symbols    --> Supabase query (cached) of live ts-morph
    |--- find_references  --> Supabase query (cached) of live ts-morph
    |--- get_diagnostics  --> Supabase query of live tsc
    |--- get_dependencies --> Supabase query (uit package.json)
    |--- get_metrics      --> Supabase query
    |--- project_health   --> Gecombineerd overzicht
    |
    v
Supabase (VEHA Hub, ikpmlhmbooaxfrlpzcfa)
    |-- project_symbols
    |-- project_references
    |-- project_diagnostics
    |-- project_dependencies
    |-- project_metrics
    |
    v
CC v2 Dashboard (Next.js, Vercel)
    |-- Project Detail > Code tab
    |-- Project Detail > Dependencies tab
    |-- Project Detail > Health tab
    |-- Homepage > Code Health stat card
```

### Waarom ts-morph

ts-morph is een Node.js library die de volledige TypeScript compiler wraps. Het levert **exact dezelfde type-aware intelligence** als een LSP server:

- `SourceFile.getClasses()`, `.getFunctions()`, `.getInterfaces()` — symbol extractie
- `Node.findReferences()` — semantische reference tracking (type-aware, niet tekst-match)
- `Node.getType().getText()` — volledige type informatie
- `Project.getPreEmitDiagnostics()` — alle type errors en warnings

Voordelen boven een raw LSP server:
- Geen apart serverproces (stabieler)
- Geen JSON-RPC protocol overhead
- Zelfde TypeScript compiler internally (geen kwaliteitsverlies)
- Eenvoudigere error handling

### Waarom MCP Server (niet HTTP API)

Serena werkte als MCP server — Claude kreeg native tools. Dit design hergebruikt dat model:
- Claude roept `query_symbols` aan als tool, niet via `fetch()`
- Geen omwegen via Bash of custom commands
- Native integratie in Claude Code's tool ecosystem
- Claude is al gewend aan dit model (Serena-ervaring)

---

## 4. Data Model (Supabase)

### `project_symbols`

Alle code symbols per project met volledige type informatie.

```sql
CREATE TABLE project_symbols (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL,           -- project slug
    file_path TEXT NOT NULL,         -- relatief pad (src/lib/registry.ts)
    name TEXT NOT NULL,              -- symbol naam (getAgents)
    kind TEXT NOT NULL,              -- function, class, interface, variable, enum, type, method, property
    signature TEXT,                  -- volledige signature (function getAgents(project?: string): Promise<Agent[]>)
    return_type TEXT,                -- return type (Promise<Agent[]>)
    line_start INTEGER NOT NULL,
    line_end INTEGER NOT NULL,
    parent TEXT,                     -- parent symbol (null voor top-level, class naam voor methods)
    exported BOOLEAN DEFAULT false,
    is_async BOOLEAN DEFAULT false,
    parameters JSONB,               -- [{name: "project", type: "string", optional: true}]
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_symbols_project ON project_symbols(project);
CREATE INDEX idx_project_symbols_project_file ON project_symbols(project, file_path);
CREATE INDEX idx_project_symbols_project_kind ON project_symbols(project, kind);
CREATE INDEX idx_project_symbols_name ON project_symbols(name);
```

### `project_references`

Waar wordt elk symbol gebruikt — semantisch, niet tekst-match.

```sql
CREATE TABLE project_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL,
    symbol_name TEXT NOT NULL,       -- welk symbol
    symbol_file TEXT NOT NULL,       -- waar het symbol gedefinieerd is
    ref_file TEXT NOT NULL,          -- waar de referentie staat
    ref_line INTEGER NOT NULL,
    ref_kind TEXT NOT NULL,          -- import, call, type_reference, assignment, extends, implements
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_references_project ON project_references(project);
CREATE INDEX idx_project_references_symbol ON project_references(project, symbol_name);
CREATE INDEX idx_project_references_file ON project_references(project, ref_file);
```

### `project_diagnostics`

Type errors, warnings, en andere compiler diagnostics.

```sql
CREATE TABLE project_diagnostics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL,
    file_path TEXT NOT NULL,
    line INTEGER NOT NULL,
    column INTEGER,
    severity TEXT NOT NULL,          -- error, warning, suggestion
    message TEXT NOT NULL,
    code INTEGER,                    -- TypeScript error code (TS2345, etc.)
    source TEXT DEFAULT 'typescript',
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_diagnostics_project ON project_diagnostics(project);
CREATE INDEX idx_project_diagnostics_severity ON project_diagnostics(project, severity);
```

### `project_dependencies`

Package dependencies uit package.json / pyproject.toml.

```sql
CREATE TABLE project_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL,
    name TEXT NOT NULL,              -- package naam (@supabase/supabase-js)
    version TEXT NOT NULL,           -- versie uit lockfile of manifest (^2.39.0)
    dep_type TEXT NOT NULL,          -- production, dev, peer, optional
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project, name)
);

CREATE INDEX idx_project_dependencies_project ON project_dependencies(project);
CREATE INDEX idx_project_dependencies_name ON project_dependencies(name);
```

### `project_metrics`

Geaggregeerde code metrics per project.

```sql
CREATE TABLE project_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL UNIQUE,
    total_files INTEGER NOT NULL,
    total_loc INTEGER NOT NULL,
    languages JSONB NOT NULL,        -- {"TypeScript": 5000, "CSS": 1200, "JSON": 300}
    total_symbols INTEGER,
    total_exports INTEGER,
    total_diagnostics_error INTEGER DEFAULT 0,
    total_diagnostics_warning INTEGER DEFAULT 0,
    total_dependencies INTEGER,
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_metrics_project ON project_metrics(project);
```

---

## 5. MCP Server Tools

### `analyze_project`

Voert volledige ts-morph analyse uit op een project en slaat resultaten op in Supabase.

**Input:**
- `project_path` (string) — Absoluut pad naar project root
- `project_slug` (string, optioneel) — Slug voor Supabase opslag (auto-detect uit pad)

**Proces:**
1. Detecteer tsconfig.json locatie
2. Initialiseer ts-morph `Project` met tsconfig
3. Itereer over alle source files
4. Extract: symbols, references, diagnostics
5. Parse package.json voor dependencies
6. Bereken metrics (LOC, bestanden, talen)
7. Wis oude data voor dit project in Supabase
8. Bulk insert nieuwe data
9. Return samenvatting

**Output:**
```json
{
    "project": "command-center-v2",
    "files_analyzed": 47,
    "symbols_found": 312,
    "exports": 89,
    "diagnostics": { "error": 0, "warning": 15 },
    "dependencies": { "production": 12, "dev": 8 },
    "loc": 8500,
    "duration_ms": 3200
}
```

### `query_symbols`

Zoek symbols over één of alle projecten.

**Input:**
- `project` (string, optioneel) — Filter op project
- `kind` (string, optioneel) — Filter op type: function, class, interface, etc.
- `name` (string, optioneel) — Zoek op naam (exact of fuzzy)
- `file_path` (string, optioneel) — Filter op bestand
- `exported_only` (boolean, optioneel) — Alleen exports
- `limit` (number, optioneel) — Max resultaten (default 50)

**Output:**
```json
{
    "symbols": [
        {
            "name": "getAgents",
            "kind": "function",
            "signature": "function getAgents(project?: string): Promise<Agent[]>",
            "file_path": "src/lib/registry.ts",
            "line_start": 15,
            "exported": true,
            "project": "command-center-v2"
        }
    ],
    "total": 1
}
```

### `find_references`

Vind alle plekken waar een symbol wordt gebruikt.

**Input:**
- `project` (string) — Project slug
- `symbol_name` (string) — Naam van het symbol
- `symbol_file` (string, optioneel) — Bestand waar symbol gedefinieerd is (voor disambiguatie)

**Output:**
```json
{
    "symbol": "getAgents",
    "defined_in": "src/lib/registry.ts:15",
    "references": [
        { "file": "src/app/(dashboard)/page.tsx", "line": 23, "kind": "call" },
        { "file": "src/app/(dashboard)/registry/page.tsx", "line": 8, "kind": "import" }
    ],
    "total": 2
}
```

### `get_diagnostics`

Haal type errors en warnings op.

**Input:**
- `project` (string, optioneel) — Filter op project
- `severity` (string, optioneel) — Filter: error, warning, suggestion
- `file_path` (string, optioneel) — Filter op bestand

**Output:**
```json
{
    "diagnostics": [
        {
            "file": "src/components/kanban/TaskCard.tsx",
            "line": 42,
            "severity": "warning",
            "message": "Variable 'x' is declared but never used.",
            "code": 6133
        }
    ],
    "summary": { "error": 0, "warning": 15, "suggestion": 3 }
}
```

### `get_dependencies`

Package dependencies per project of cross-project.

**Input:**
- `project` (string, optioneel) — Filter op project
- `name` (string, optioneel) — Zoek package naam
- `dep_type` (string, optioneel) — Filter: production, dev, peer

**Output:**
```json
{
    "dependencies": [
        { "name": "@supabase/supabase-js", "version": "^2.39.0", "type": "production", "used_by": ["command-center-v2", "veha-hub"] }
    ]
}
```

### `get_metrics`

Code metrics per project.

**Input:**
- `project` (string, optioneel) — Filter op project (of alle projecten)

**Output:**
```json
{
    "metrics": [
        {
            "project": "command-center-v2",
            "total_files": 47,
            "total_loc": 8500,
            "languages": { "TypeScript": 7200, "CSS": 800, "JSON": 500 },
            "total_symbols": 312,
            "total_exports": 89,
            "diagnostics": { "error": 0, "warning": 15 },
            "analyzed_at": "2026-02-13T14:30:00Z"
        }
    ]
}
```

### `project_health`

Gecombineerd health overzicht — de "executive summary" tool.

**Input:**
- `project` (string, optioneel) — Project slug of alle projecten

**Output:**
```json
{
    "health": [
        {
            "project": "command-center-v2",
            "score": "healthy",
            "loc": 8500,
            "errors": 0,
            "warnings": 15,
            "dependencies": 20,
            "last_analyzed": "2026-02-13T14:30:00Z",
            "issues": ["15 TypeScript warnings"]
        }
    ]
}
```

---

## 6. Dashboard UI Wijzigingen

### Project Detail Pagina — Tabs

De huidige project detail pagina (`/projects/[slug]`) wordt uitgebreid met tabs:

| Tab | Inhoud | Bron |
|-----|--------|------|
| **Overview** | Bestaand: info, changelog, assets | Bestaand |
| **Code** | Symbol browser per bestand, filters op type, zoeken | Nieuw |
| **Dependencies** | Package lijst met versie en type | Nieuw |
| **Health** | Diagnostics samenvatting, metrics cards, talen verdeling | Nieuw |
| **Memories** | Bestaande memories lijst | Verplaatst |

### Code Tab

- Links: bestanden lijst met symbol count per bestand
- Rechts: bij klik op bestand, lijst van symbols met signature en type
- Filters: function, class, interface, enum, type, variable
- Zoekbalk: zoek symbol op naam
- Export indicator: badge voor exported symbols

### Dependencies Tab

- Tabel: package naam, versie, type (prod/dev/peer)
- Sortering: op naam of type
- Geen externe API calls (alleen lokaal opgeslagen data)

### Health Tab

- Metrics cards: LOC, bestanden, talen, symbols, exports
- Diagnostics: foutmeldingen gegroepeerd per severity
- Talen verdeling: horizontale balk chart (TypeScript 85%, CSS 10%, JSON 5%)

### Homepage Uitbreiding

- Nieuwe stat card: "Code Health" met totaal errors/warnings over alle geanalyseerde projecten
- Of: health indicator per project card (groen/oranje/rood dot)

---

## 7. Technische Details

### MCP Server Setup

- **Locatie:** `~/.claude/mcp-servers/cc-v2-code-intel/` (of als npm package)
- **Runtime:** Node.js
- **Dependencies:** ts-morph, @supabase/supabase-js, @modelcontextprotocol/sdk
- **Registratie:** In `~/.claude/settings.json` als MCP server
- **Environment:** Supabase URL + service role key

### API Endpoints (voor Dashboard)

Nieuwe GET-only endpoints voor het dashboard:

- `GET /api/projects/[slug]/symbols` — Symbols met filters
- `GET /api/projects/[slug]/references/[name]` — References voor een symbol
- `GET /api/projects/[slug]/diagnostics` — Diagnostics met severity filter
- `GET /api/projects/[slug]/dependencies` — Dependencies
- `GET /api/projects/[slug]/metrics` — Metrics

### Taalondersteuning

- **Fase 1:** TypeScript / JavaScript (ts-morph)
- **Fase 2:** Python (pyright, optioneel)
- **Later:** Andere talen naar behoefte

---

## 8. Constraints

- **Geen token-based API kosten** — Alle analyse lokaal via ts-morph, geen AI API calls
- **Supabase: VEHA Hub** — Reference ID `ikpmlhmbooaxfrlpzcfa`, Central EU Frankfurt
- **Service role key** — Alle Supabase queries via service role (bypass RLS)
- **Batch analyse** — Data wordt bijgewerkt bij `/analyze` aanroep, niet real-time
- **TypeScript first** — Andere talen zijn uitbreidbaar maar niet in scope voor fase 1

---

## 9. Serena Afscheid

Na implementatie van dit design kan Serena volledig verwijderd worden:

1. Verwijder Serena entry uit `~/.claude/settings.json`
2. Verwijder `~/.serena/serena_config.yml`
3. Verwijder `.serena/` mappen uit projecten
4. Migreer bestaande Serena memories (2 stuks voor CC v2) naar CC v2 memories API
5. Serena is niet langer nodig

---

## 10. Implementatie Roadmap (high-level)

| Fase | Wat | Omvang |
|------|-----|--------|
| 1 | Supabase migraties (5 tabellen + indexes) | Klein |
| 2 | MCP Server scaffolding + ts-morph integratie | Groot |
| 3 | MCP Tools implementatie (7 tools) | Groot |
| 4 | Dashboard API endpoints (5 GET routes) | Medium |
| 5 | Dashboard UI (tabs + 3 nieuwe tabs) | Groot |
| 6 | Plugin registratie + configuratie | Klein |
| 7 | Testen + Serena migratie + opschoning | Medium |

**Gedetailleerd implementatieplan wordt gegenereerd via writing-plans skill.**
