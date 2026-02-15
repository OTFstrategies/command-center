# Introductieprompt — Claude Code Perfect Setup

Kopieer alles hieronder en plak het als eerste bericht in Claude Code op de nieuwe PC.

---

## START KOPIEER HIERONDER ---

Je gaat mijn volledige Claude Code ontwikkelomgeving opzetten op deze nieuwe PC. Dit is een grote, gestructureerde taak die in 8 fases verloopt. Alles staat beschreven in `MASTERPLAN-WSL2-MIGRATIE.md` in dit project.

### Wie ben ik

Ik ben Shadow, een MKB-directeur. Ik codeer NIET — jij bent mijn complete development team. Ik geef opdrachten, jij voert uit. Communiceer in het Nederlands (technische termen mogen Engels).

### Wat we gaan doen

We migreren mijn complete Claude Code setup van een Windows PC naar WSL2 (Ubuntu) op deze nieuwe PC. Het ontwerp is een **3-laags architectuur**:

1. **USER laag** (`~/.claude/`) — Persoonlijke regels, commands, agents, skills, design system
2. **PROJECTS laag** (`~/projects/`) — Alle actieve projecten met gedeelde configs
3. **DESTINATIONS** (`~/veha/`, `~/user/`, `~/projects/done/`) — Afgeronde projecten en documenten

### Wat er al gedaan is

Op de vorige PC is een grondige inventarisatie en analyse gedaan:
- 20 project directories geinventariseerd en gecategoriseerd
- 66 bestaande commands, 20 agents, 2 skills, 2 APIs, 5 instruction sets gedocumenteerd
- Command Center v2 codebase volledig geanalyseerd (sync pipeline, API routes, MCP server, dashboard)
- Kritieke issues geidentificeerd (Name/Slug mismatch, MCP .env, Supabase data migratie)
- Alles verwerkt in het masterplan

### Het masterplan

Lees **MASTERPLAN-WSL2-MIGRATIE.md** in dit project. Dit bevat:

| Phase | Wat | Status |
|-------|-----|--------|
| **0. WSL2 Installatie** | Ubuntu, Node.js, Git, Claude Code, GitHub CLI | **GEDAAN** (we zitten er nu in) |
| **1. Directory Structuur** | 3-laags mappenstructuur aanmaken | TE DOEN |
| **2. CLAUDE.md Merge** | Bestaande 385 regels + nieuwe regels → ~600 regels | TE DOEN |
| **3. Project Migratie** | 5 git clones, standaard bestanden, archivering | TE DOEN |
| **4. Commands & Agents** | 13 nieuwe commands aanmaken, registry updaten (66→79) | TE DOEN |
| **5. MCP & Credentials** | Keys, .env files, MCP server config | TE DOEN |
| **6. Hooks** | Branch protection, Prettier, TypeScript pre-commit hooks | TE DOEN |
| **7. CC v2 Integratie** | Supabase data migratie, sync, dashboard verificatie | TE DOEN |
| **8. Validatie** | 24-punt checklist, go-live | TE DOEN |

### Hoe je te werk gaat

1. **Lees eerst het volledige masterplan** — begrijp alle 8 phases voordat je begint
2. **Voer uit vanaf Phase 1** — Phase 0 (WSL2 installatie) is al gedaan
3. **Werk sequentieel** — elke phase hangt af van de vorige
4. **Voer zoveel mogelijk automatisch uit** — vraag alleen bij:
   - Destructieve acties (bestanden verwijderen, mappen hernoemen)
   - De open vragen aan het einde van het masterplan (project categorisatie)
   - Als je iets niet zeker weet
5. **Log je voortgang** — geef na elke phase een korte samenvatting van wat er gedaan is

### Bestaande setup om te kopieren

De vorige PC had een rijke `~/.claude/` setup. De belangrijkste bestanden worden:
- **~/.claude/CLAUDE.md** — Moet NIEUW geschreven worden (merge van oud + nieuw, zie Phase 2)
- **~/.claude/commands/** — 50 bestaande .md bestanden + 13 nieuwe (zie Phase 4)
- **~/.claude/registry/** — 6 JSON bestanden (commands, agents, skills, apis, prompts, instructions)
- **~/.claude/agents/** — 15+ agent definities
- **~/.claude/design-system/** — Shadow Huisstijl (HUISSTIJL.md, tokens, animations)
- **~/.claude/plugins/local/** — veha-manager, security-os, revision-guardian
- **~/.claude/settings.json** — 36 plugins configuratie

De inhoud van de bestaande commands, agents, en configs staat in de registries en moet opnieuw aangemaakt worden. Het masterplan beschrijft de 13 NIEUWE commands volledig (met inhoud). De bestaande 50+ commands moeten van de oude PC gekopieerd worden — dat doen we via git clone van de projecten die ze bevatten, of door ze opnieuw aan te maken.

### Projecten die gecloned moeten worden

| GitHub Remote | Lokale Naam | Beschrijving |
|--------------|-------------|-------------|
| `OTFstrategies/command-center-v2` | `command-center` | CC v2 dashboard (Next.js + Supabase) — DIT PROJECT |
| `OTFstrategies/HSF-House-of-Process` | `proceshuis-hsf` | Proceshuis voor HSF |
| `OTFstrategies/House-of-process-VEHA` | `proceshuis-veha` | Proceshuis voor VEHA |
| `OTFstrategies/veha-app` | `veha-app` | VEHA applicatie |
| `OTFstrategies/veha-hub` | `veha-hub` | VEHA hub |

### Kritieke aandachtspunten

1. **Name/Slug mismatch** — Het CC v2 dashboard gebruikt twee identifier-systemen (NAME voor registry, SLUG voor code intelligence). Na het renamen van directories moet er een SQL migratie in Supabase uitgevoerd worden. Zie sectie 7.3 en 7.7 van het masterplan.

2. **MCP server .env** — De Code Intelligence MCP server (`cc-v2-mcp/`) laadt zijn eigen `.env` uit zijn directory, NIET uit de project root. Dit bestand moet apart aangemaakt worden met Supabase keys.

3. **Design System** — Shadow's huisstijl gebruikt ALLEEN zinc palette (GEEN blauw, groen, paars). Inter body font, DM Sans headings, JetBrains Mono code. Glassmorphism + monochrome glow.

4. **Credentials** — NOOIT in git. Gebruik .env bestanden (in .gitignore) of `~/.bashrc` exports.

### Open vragen (vraag mij deze als je eraan toekomt)

1. Agent OS fork — actief houden of archiveren?
2. bryntum-analysis — archiveren?
3. prompt-library-mcp — archiveren of ontwikkelen?
4. VEHA_Doc_Generator + v95-omega-prime — samenvoegen met hs-docs?
5. Niet-git directories — naar ~/user/documenten/?
6. GitHub email voor git config?

### Begin nu

Lees MASTERPLAN-WSL2-MIGRATIE.md en start met Phase 1 (Directory Structuur aanmaken). Geef na het lezen een korte samenvatting van je begrip van het plan, en begin dan met uitvoeren.

## EINDE KOPIEER ---
