# Command Center Intelligence Map — Design Document

**Datum:** 16 februari 2026
**Auteur:** Shadow + Claude
**Status:** Goedgekeurd

---

## 1. Wat bouwen we?

Een **Intelligence Map** — een visueel, interactief overzicht van Shadow's hele AI-ecosysteem. Niet een dashboard met cijfers, maar een levende kaart die:

1. **Toont** — Alle 160+ items (projecten, agents, commands, skills, plugins, APIs, instructies) als punten op een interactieve kaart
2. **Verbindt** — Alle relaties als lijnen, automatisch ontdekt door een volledige scan
3. **Ontdekt** — Inzichten die je zelf niet zag: onverbonden items, knooppunten, ontbrekende onderdelen, patronen

### Succescriteria

> "Ik ontdek dingen die ik niet wist."

De kaart moet inzichten genereren: onverwachte verbindingen, gaten, patronen die Shadow zelf niet zag. Het dashboard maakt hem slimmer.

### Doelgroep

Iedereen: Shadow zelf, zijn team, en externe partijen. Alles is in menselijke taal — geen technisch jargon.

---

## 2. Architectuur

### Drie Lagen

```
Laag 1: Volledige Scan (nieuw)
├── Scant ~/.claude/ structuur
├── Detecteert items, relaties, hierarchie
├── Genereert clusters en inzichten
└── Slaat op in Supabase

Laag 2: API (uitgebreid)
├── POST /api/sync/deep-scan (nieuw)
├── GET /api/map/data (nieuw)
├── Bestaande API routes (behouden)
└── Nieuwe /deep-scan command

Laag 3: Dashboard (vernieuwd)
├── /map pagina (nieuw) — Intelligence Map
├── /projects/[slug] (vernieuwd) — Project Dossier
├── Bestaande pagina's (behouden)
└── Nieuwe features (kosten, gebruik, tijdlijn, etc.)
```

### Tech Stack

- **Visualisatie:** react-force-graph-2d (WebGL, performant met 160+ nodes)
- **Layout:** d3-force (automatische positionering met cluster-grouping)
- **Animaties:** Framer Motion (spring transitions, Huisstijl-consistent)
- **Framework:** Next.js 14 (App Router, Server Components)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS v4 + Huisstijl design system

---

## 3. Data Model

### 3.1 Nieuwe tabel: `entity_relationships`

Het hart van de Intelligence Map. Elke lijn op de kaart is een rij.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| source_type | text NOT NULL | "agent", "command", "project", etc. |
| source_id | text NOT NULL | Naam/ID van het eerste item |
| target_type | text NOT NULL | "agent", "command", "project", etc. |
| target_id | text NOT NULL | Naam/ID van het tweede item |
| relationship | text NOT NULL | Soort verband (zie tabel hieronder) |
| direction | text DEFAULT 'source_to_target' | Richting |
| strength | int DEFAULT 1 | Sterkte 1-3 |
| auto_detected | boolean DEFAULT true | Automatisch gevonden of handmatig |
| metadata | jsonb DEFAULT '{}' | Extra context |
| created_at | timestamptz DEFAULT now() | |

**Relatie-types:**

| Relatie | Betekenis | Voorbeeld |
|---------|-----------|-----------|
| invokes | A roept B aan | agent -> command |
| belongs_to | A is onderdeel van B | command -> plugin |
| parent_of | A bevat B (hierarchie) | miro-start -> miro-flowcharts |
| depends_on | A heeft B nodig | project -> supabase service |
| shares_service | A en B gebruiken dezelfde dienst | veha-hub <-> veha-app |
| applies_to | A wordt toegepast op B | huisstijl -> veha-app |
| produces | A maakt B | hs-docs agent -> L4 procedure |
| deployed_on | A draait op B | command-center -> Vercel |

### 3.2 Nieuwe tabel: `asset_hierarchy`

Boomstructuur van geneste items (commands, plugin-onderdelen).

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| asset_type | text NOT NULL | "command", "agent", "skill" |
| asset_name | text NOT NULL | Naam van het item |
| parent_name | text | Directe parent |
| root_name | text | Wortel van de boom |
| depth | int NOT NULL | Niveau (0 = root) |
| path | text NOT NULL | Volledig pad: "miro-start / flowcharts / process / linear" |
| sort_order | int DEFAULT 0 | Sorteervolgorde |
| created_at | timestamptz DEFAULT now() | |

### 3.3 Nieuwe tabel: `system_clusters`

Automatisch gedetecteerde groepen op de kaart.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| name | text NOT NULL | "VEHA Ecosysteem" |
| slug | text UNIQUE NOT NULL | "veha" |
| description | text | "4 projecten, 10 tools, gedeelde Supabase" |
| icon | text | "building" |
| member_count | int DEFAULT 0 | Aantal items in cluster |
| health | text DEFAULT 'unknown' | "healthy", "needs-attention", "unhealthy" |
| insights | jsonb DEFAULT '[]' | Cluster-specifieke inzichten |
| position_x | float | Positie op de kaart |
| position_y | float | Positie op de kaart |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

### 3.4 Nieuwe tabel: `map_insights`

Automatisch gegenereerde observaties.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| type | text NOT NULL | "orphan", "hub", "gap", "pattern", "scale", "health" |
| severity | text NOT NULL | "info", "attention", "warning" |
| title | text NOT NULL | "3 agents zonder project" |
| description | text NOT NULL | Uitgebreide beschrijving |
| affected_items | jsonb DEFAULT '[]' | Lijst van betrokken items |
| action_label | text | "Koppel aan project" |
| action_type | text | "link", "create", "cleanup" |
| resolved | boolean DEFAULT false | Is het opgelost? |
| generated_at | timestamptz DEFAULT now() | |

### 3.5 Nieuwe tabel: `entity_versions`

Versie geschiedenis per item.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| entity_type | text NOT NULL | "project", "agent", "command", etc. |
| entity_id | text NOT NULL | Naam/ID |
| version | text NOT NULL | "1.3" |
| change_type | text NOT NULL | "added", "modified", "removed" |
| title | text NOT NULL | "Code Intelligence tabs toegevoegd" |
| description | text | Langere beschrijving |
| items_changed | jsonb DEFAULT '[]' | Bestanden/items die veranderden |
| detected_at | timestamptz DEFAULT now() | |
| detected_by | text DEFAULT 'deep-scan' | "deep-scan", "sync", "manual" |

### 3.6 Nieuwe tabel: `project_api_routes`

Interne API endpoints per project.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| project | text NOT NULL | "command-center" |
| path | text NOT NULL | "/api/sync" |
| method | text NOT NULL | "GET", "POST", "PUT", "DELETE" |
| auth_type | text DEFAULT 'none' | "api-key", "bearer", "none" |
| params | jsonb DEFAULT '{}' | Parameters (path, query, body) |
| response_type | text DEFAULT 'json' | |
| file_path | text | "src/app/api/sync/route.ts" |
| line_start | int | Regelnummer |
| tables_used | text[] DEFAULT '{}' | Database tabellen die het gebruikt |
| analyzed_at | timestamptz DEFAULT now() | |

### 3.7 Nieuwe tabel: `service_costs`

Kosten per dienst per project.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| service | text NOT NULL | "supabase", "vercel", "anthropic" |
| project | text | Project (null = globaal) |
| plan | text | "free", "pro", "team" |
| monthly_cost | decimal DEFAULT 0 | Maandelijkse kosten in euro |
| usage_metric | text | "api_calls", "storage_gb", "tokens" |
| usage_value | decimal DEFAULT 0 | Hoeveelheid gebruikt |
| period | text NOT NULL | "2026-02" |
| detected_at | timestamptz DEFAULT now() | |

### 3.8 Nieuwe tabel: `usage_statistics`

Gebruiksstatistieken per item.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| entity_type | text NOT NULL | "command", "agent", "project" |
| entity_id | text NOT NULL | Naam/ID |
| metric | text NOT NULL | "invocations", "sessions", "tokens_used" |
| value | int DEFAULT 0 | Hoeveelheid |
| period | text NOT NULL | "2026-02" |
| last_used | timestamptz | Laatst gebruikt |
| created_at | timestamptz DEFAULT now() | |

### 3.9 Nieuwe tabel: `user_visits`

Bijhouden wanneer gebruiker het dashboard bezocht.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| user_id | text DEFAULT 'shadow' | |
| page | text NOT NULL | "/map", "/projects/veha-hub" |
| visited_at | timestamptz DEFAULT now() | |

### 3.10 Nieuwe tabel: `shared_views`

Deelbare snapshots voor externe partijen.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| type | text NOT NULL | "map", "project", "comparison" |
| token | text UNIQUE NOT NULL | Unieke share token |
| data_snapshot | jsonb NOT NULL | Bevroren kopie van data |
| expires_at | timestamptz NOT NULL | Vervaldatum (24h) |
| created_at | timestamptz DEFAULT now() | |

### 3.11 Nieuwe tabel: `user_bookmarks`

Persoonlijke bladwijzers.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| user_id | text DEFAULT 'shadow' | |
| entity_type | text NOT NULL | |
| entity_id | text NOT NULL | |
| label | text | Eigen label |
| sort_order | int DEFAULT 0 | |
| created_at | timestamptz DEFAULT now() | |

### 3.12 Bestaande tabellen uitbreiden

**`registry_items` + 2 kolommen:**
- `cluster_slug` text — koppeling naar system_clusters
- `node_size` int DEFAULT 1 — visuele grootte (berekend uit verbindingen)

**`projecten` + 4 kolommen:**
- `ecosystem` text — "veha", "core", etc.
- `services` jsonb DEFAULT '[]' — gekoppelde diensten
- `project_path` text — pad op filesystem
- `claude_md_summary` text — samenvatting van CLAUDE.md

---

## 4. Volledige Scan Pipeline

### 5 Fasen

**Fase 1: Item Inventarisatie**
Scant alle bekende mappen in ~/.claude/ en registreert elk item.

Bronnen: registry/*.json, commands/*.md, agents/*/, skills/*/SKILL.md, plugins/local/*/, plugins/cache/*/, apis/*/, instructions/*/, projects/*/, design-system/

**Fase 2: Hierarchie Detectie**
Detecteert parent/child relaties via naming conventions en bestandsstructuur.

Regels:
- Command naming: `miro-flowcharts-process-linear` -> parent `miro-flowcharts-process` -> root `miro-start`
- Agent folders: `agents/agent-os/spec-writer.md` -> parent `agent-os`
- Plugin contents: `plugins/local/security-os/skills/` -> parent `security-os`

**Fase 3: Relatie Detectie**
Scant bestanden op kruisverwijzingen en gedeelde resources.

Methodes:
- Gedeeld `project` veld in registry items
- Supabase project ID in configs/CLAUDE.md
- Vercel project referenties
- Design system referenties
- Agent tool-lijsten die command namen bevatten
- Plugin mappen met agents/commands/skills
- Identieke tags

**Fase 4: Cluster Detectie**
Groepeert items automatisch op basis van relaties.

Algoritme:
1. Items met gedeeld project veld
2. Items in dezelfde plugin
3. Items met dezelfde naamprefix (veha-*, hs-*, miro-*, security-*)
4. Items die dezelfde service delen
5. Bereken cluster naam, grootte, gezondheid

**Fase 5: Inzicht Generatie**
Analyseert het netwerk en genereert observaties met actie-aanbevelingen.

| Type | Detectie | Actie |
|------|----------|-------|
| orphan | Node met 0 relaties | "Koppel aan project" |
| hub | Node met >5 relaties | "Controleer afhankelijkheden" |
| gap | Cluster zonder verwacht item-type | "Maak ontbrekend onderdeel aan" |
| pattern | Terugkerende structuren | Informatief |
| scale | Item >3x gemiddelde children | Informatief |
| isolated_cluster | Cluster zonder externe verbindingen | "Overweeg integratie" |
| single_point | Kritiek item waar alles van afhangt | "Overweeg redundantie" |

### API

**POST /api/sync/deep-scan**
- Input: `{ basePath: "~/.claude/" }`
- Output: `{ items_found, relationships_detected, hierarchies_built, clusters_formed, insights_generated, duration_ms }`

**Nieuw command: `/deep-scan`**
- Leest ~/.claude/ structuur
- Stuurt naar POST /api/sync/deep-scan
- Toont samenvatting

---

## 5. Intelligence Map UI

### Pagina: `/map`

Twee modi:
1. **Cockpit modus** (standaard) — 5-7 systeem-blokken als kaarten met glassmorphism, verbindingslijnen met labels
2. **Volledige kaart modus** — Alle 160+ nodes zichtbaar, zoom/pan/drag, react-force-graph-2d

Toggle bovenaan om te wisselen. Beide modi tonen dezelfde data, alleen het zoomniveau verschilt.

### Node Types

| Type | Vorm | Grootte | Zinc tint |
|------|------|---------|-----------|
| Project | Cirkel | 24px | zinc-100 |
| Agent | Zeshoek | 16px | zinc-300 |
| Command | Vierkant | 12px | zinc-400 |
| Skill | Ruit | 12px | zinc-500 |
| Plugin | Afgerond vierkant | 16px | zinc-200 |
| API/Service | Driehoek | 16px | zinc-600 |
| Instructie | Streepje | 10px | zinc-500 |
| Design System | Ster | 16px | zinc-100 + glow |

### Edge Types

| Relatie | Lijn | Kleur |
|---------|------|-------|
| parent_of | Dik, solid | zinc-400 |
| invokes | Medium, pijl | zinc-500 |
| belongs_to | Dun, dashed | zinc-600 |
| depends_on | Medium, pijl | zinc-300 |
| shares_service | Dun, dotted, tweezijdig | zinc-500 |
| applies_to | Dun, dashed, pijl | zinc-400 |

### Interactie

| Actie | Resultaat |
|-------|----------|
| Hover node | Glow effect, directe verbindingen lichten op, rest vervaagt |
| Klik node | Detail panel schuift in rechts (spring animatie) |
| Dubbel-klik project | Navigeert naar Project Dossier |
| Hover edge | Edge wordt dikker, tooltip toont relatie-type |
| Scroll | Zoom in/uit |
| Drag achtergrond | Pan |
| Drag node | Verplaats (positie onthouden) |

### Componenten op de Map pagina

1. **Filter bar** — Zoek, type filter, cluster filter, relatie-type filter
2. **Inzichten panel** (rechts) — Automatische observaties met acties, gesorteerd op ernst
3. **Detail panel** (rechts, slide-in) — Volledig dossier van geselecteerde node
4. **Cockpit blokken** — Glassmorphism kaarten per systeem (cockpit modus)
5. **"Sinds je laatste bezoek"** — Notificatie banner bovenaan
6. **Kosten overzicht** — Sectie onderaan of in sidebar
7. **Gebruiksstatistieken** — Meest/minst gebruikte items
8. **Tijdlijn** — Groei van ecosysteem over tijd
9. **Risico analyse** — Kritieke afhankelijkheden en single points of failure
10. **Bladwijzers** — Gepinde items
11. **Vergelijking** — Twee projecten naast elkaar
12. **Export** — PDF, PNG, deelbare link

---

## 6. Project Dossier

### Pagina: `/projects/[slug]` (vernieuwd)

Twee weergave-modi: **Tabs** of **Scroll** (toggle bovenaan).

### 8 Secties/Tabs

**1. Overzicht**
- Identiteitskaart (naam, pad, ecosysteem, diensten, gezondheid, CLAUDE.md samenvatting)
- Mini netwerk kaart (dit project + directe verbindingen)
- Aandachtspunten met actie-knoppen
- Recente activiteit

**2. Functies**
- Wat kan dit project? Gegroepeerd per categorie
- Feature details: welke code/routes/componenten implementeren het
- Feature trace: volg een functie door alle lagen (UI -> API -> Database)

**3. Onderdelen**
- Uitklapbare boomstructuur
- Versie badges per item ("sinds v1.3")
- Gap indicators (ontbrekende verwachte types)
- Inline detail bij klik

**4. Verbindingen**
- Ecosysteem partners (projecten die samenwerken)
- Gedeelde diensten (Supabase, Vercel, Huisstijl)
- Asset koppelingen (agents, commands die dit project bedienen)

**5. Toegangspunten (APIs)**
- Alle interne API routes
- Methode badges, auth status, parameters
- Relaties naar database tabellen
- Expandeerbaar voor details

**6. Code**
- Bestaande Code Intelligence tab (behouden)
- Symbolen per bestand, filter chips per soort

**7. Benodigdheden**
- Bestaande Dependencies tab (behouden)
- Packages gegroepeerd op type

**8. Gezondheid**
- Bestaande Health tab (behouden)
- Health badge, metrics, diagnostics, taalverdeling

### Versie Geschiedenis

Aanwezig in elke sectie/tab. Toont functionele wijzigingen (niet git commits) in een tijdlijn.

---

## 7. Error Handling

| Situatie | Wat de gebruiker ziet |
|----------|----------------------|
| Eerste keer (geen scan) | Uitleg + "Start Volledige Scan" knop |
| Gedeeltelijke data | Items zonder relatielijnen + banner "Scan nog niet volledig" |
| Verouderde data (>7 dagen) | Indicator + "Hernieuw scan" link |
| Scan mislukt | Foutmelding + "Opnieuw proberen" + details |
| Database onbereikbaar | "Tijdelijk niet beschikbaar" + laatste bekende data |
| >300 nodes | Labels verbergen tot zoom >2x |
| >500 nodes | Kleinste nodes verbergen tot zoom >2x |

---

## 8. UX Principes

### Altijd menselijke taal
- "Onderdelen" niet "Assets"
- "Verbindingen" niet "Relationships"
- "Toegangspunten" niet "API Endpoints"
- "Benodigdheden" niet "Dependencies"
- "Fouten & Waarschuwingen" niet "Diagnostics"
- "Regels code" niet "LOC"

### Help overal
- `(?)` knop op elke pagina die uitlegt wat je ziet
- Tooltips op elk icoon, badge, en label
- Eerste keer openen: stap-voor-stap uitleg

### Acties bij inzichten
- Elk inzicht heeft een actieknop
- Niet alleen "dit is zo" maar "dit kun je eraan doen"

### Toegankelijkheid
- Keyboard navigatie (Tab, Enter, Escape)
- Screen reader labels
- WCAG AA kleuren contrast
- Reduced motion support (prefers-reduced-motion)

---

## 9. Tabel Totaaloverzicht

### Nieuwe tabellen (11)

| # | Tabel | Rijen (geschat) |
|---|-------|-----------------|
| 1 | entity_relationships | ~300 |
| 2 | asset_hierarchy | ~80 |
| 3 | system_clusters | ~7 |
| 4 | map_insights | ~15-30 |
| 5 | entity_versions | ~50+ groeiend |
| 6 | project_api_routes | ~20 per project |
| 7 | service_costs | ~10 per maand |
| 8 | usage_statistics | ~100 per maand |
| 9 | user_visits | ~50 per maand |
| 10 | shared_views | ~5 |
| 11 | user_bookmarks | ~10 |

### Uitgebreide tabellen (2)

| Tabel | Nieuwe kolommen |
|-------|----------------|
| registry_items | +cluster_slug, +node_size |
| projecten | +ecosystem, +services, +project_path, +claude_md_summary |

### Bestaande tabellen (ongewijzigd, 12)

registry_items, projecten, project_changelog, kanban_tasks, activity_log, project_memories, inbox_pending, project_symbols, project_references, project_diagnostics, project_dependencies, project_metrics
