# MASTERPLAN — Claude Code Perfect Setup op WSL2

**Versie:** 2.0
**Datum:** 15 februari 2026
**Status:** CONCEPT — Wacht op goedkeuring Shadow
**Doel:** Volledige migratie van Windows-native Claude Code setup naar WSL2 (Ubuntu) met 3-laags architectuur

---

## Inhoudsopgave

1. [Uitgangspunten & Beslissingen](#1-uitgangspunten--beslissingen)
2. [Huidige Staat (Inventarisatie)](#2-huidige-staat-inventarisatie)
3. [Phase 0 — WSL2 Installatie](#3-phase-0--wsl2-installatie)
4. [Phase 1 — 3-Laags Directory Structuur](#4-phase-1--3-laags-directory-structuur)
5. [Phase 2 — CLAUDE.md Merge](#5-phase-2--claudemd-merge)
6. [Phase 3 — Project Migratie](#6-phase-3--project-migratie)
7. [Phase 4 — Commands, Skills & Agents](#7-phase-4--commands-skills--agents)
8. [Phase 5 — MCP Servers & Credentials](#8-phase-5--mcp-servers--credentials)
9. [Phase 6 — Hooks & Automatisering](#9-phase-6--hooks--automatisering)
10. [Phase 7 — Command Center v2 Integratie](#10-phase-7--command-center-v2-integratie)
11. [Phase 8 — Validatie & Go-Live](#11-phase-8--validatie--go-live)
12. [Risico's & Fallback](#12-risicos--fallback)

---

## 1. Uitgangspunten & Beslissingen

### Beslissingen uit deze sessie

| # | Beslissing | Gekozen Optie | Reden |
|---|-----------|---------------|-------|
| 1 | Platform | **WSL2 installeren** (Ubuntu op Windows 11) | PDF-ontwerp is hierop gebaseerd; vermijdt PowerShell-problemen |
| 2 | Bestaande commands | **Toevoegen naast bestaande 66** | Huidige 66 commands (50 in commands/ + 16 via plugins) blijven, 13 nieuwe uit PDF erbij |
| 3 | Project naamgeving | **Claude geeft betere namen** | Zie naamvoorstel in Phase 3 |
| 4 | Scope | **Alles in 1 plan** | Inclusief CC v2 integratie |
| 5 | Extra projecten | **Eerst inventariseren** | Gedaan — zie sectie 2 |
| 6 | CC integratie | **Onderdeel van dit plan** | Niet apart behandelen |

### Kernprincipes (uit PDF)

1. **Volledige uitvoering** — Voer taken volledig uit, geen halve oplossingen
2. **Aanbevelen met opties** — Bij onduidelijkheid: concrete opties, geen open vragen
3. **WSL2 / Bash only** — Geen PowerShell, geen Windows-paden in code
4. **Relatieve paden** — Nooit absolute paden in configs of code
5. **Vercel = default** — Alle web-apps deployen via Vercel
6. **Geen ongeautoriseerde wijzigingen** — Altijd vragen bij destructieve acties
7. **Nederlandse communicatie** — Technische termen mogen Engels
8. **Log alles** — Elke significante actie naar activity_log

---

## 2. Huidige Staat (Inventarisatie)

### 2.1 Platform

| Item | Huidige Waarde |
|------|---------------|
| OS | Windows 11 Pro 10.0.26200 |
| Shell | PowerShell + Git Bash |
| WSL2 | **Niet geinstalleerd** |
| Claude Code | Geinstalleerd, werkend |
| Node.js | Geinstalleerd (Windows-native) |
| Git | Geinstalleerd (Windows-native) |

### 2.2 ~/.claude/ Structuur (bestaand)

```
C:\Users\Shadow\.claude\
├── CLAUDE.md                    (385 regels — volledig functioneel)
├── settings.json                (36 plugins, bypassPermissions)
├── settings.local.json          (172 permissions)
├── registry/
│   ├── commands.json            (58 commands)
│   ├── agents.json              (20 agents)
│   ├── skills.json
│   ├── apis.json
│   ├── prompts.json
│   └── instructions.json
├── commands/                    (58 .md bestanden)
│   ├── agent-os/                (7 commands)
│   ├── miro/                    (40 commands - volledige toolkit)
│   ├── hs-docs/                 (6 commands)
│   └── [losse commands]         (5: save-to-cc, connect-project, setup-huisstijl, session-status, vibe-sync)
├── agents/
│   ├── agent-os/                (8 agents)
│   └── hs-docs/                 (7 agents)
├── skills/                      (2: miro-patterns, keybindings-help)
├── design-system/               (HUISSTIJL.md + tokens + animations)
├── plugins/local/
│   ├── veha-manager/            (4 commands, 2 agents)
│   ├── security-os/             (8 commands, 3 agents)
│   └── [andere plugins]
└── [28 directories totaal]
```

### 2.3 Projecten (20 directories)

#### Actief (met GitHub remote, recent)

| # | Map Naam | Remote Naam | Package | Laatste Commit | Voorgestelde Naam |
|---|----------|-------------|---------|---------------|-------------------|
| 1 | `command-center-v2` | command-center-v2 | `command-center-v2` | 12 feb 2026 | `command-center` |
| 2 | `my-project-design` | HSF-House-of-Process | `design-os` | 12 feb 2026 | `proceshuis-hsf` |
| 3 | `my-product` | House-of-process-VEHA | `proceshuis-werkplaats` | 10 feb 2026 | `proceshuis-veha` |
| 4 | `veha-app` | veha-app | `veha-app` | 10 feb 2026 | `veha-app` |
| 5 | `veha-hub` | veha-hub | `veha-hub` | 10 feb 2026 | `veha-hub` |

#### Archiveerbaar

| # | Map Naam | Reden | Bestemming |
|---|----------|-------|------------|
| 6 | `command-center` (v1) | Vervangen door v2 | `~/projects/done/` |
| 7 | `design-os` | Basis template, niet actief | `~/projects/done/` |
| 8 | `veha-design` | Oud design, vervangen | `~/projects/done/` |
| 9 | `transcriptie-coder` | Leeg (0 commits) | Verwijderen |

#### Nader te bepalen

| # | Map Naam | Status | Vraag aan Shadow |
|---|----------|--------|-----------------|
| 10 | `agent-os` | Fork van buildermethods | Actief houden of archief? |
| 11 | `bryntum-analysis` | Research, geen remote | Archiveren? |
| 12 | `prompt-library-mcp` | MCP experiment | Integreren of archief? |
| 13 | `VEHA_Doc_Generator` | HS-docs gerelateerd | Samenvoegen met hs-docs? |
| 14 | `v95-omega-prime` | HS procedures | Samenvoegen met hs-docs? |

#### Niet-git directories (documentatie)

| # | Map Naam | Voorgestelde Bestemming |
|---|----------|----------------------|
| 15 | `Artefacts` | `~/user/artefacts/` |
| 16 | `Claude_Offerte project` | `~/user/documenten/` |
| 17 | `HS` | `~/user/documenten/hs/` |
| 18 | `Master folder` | `~/user/documenten/` |
| 19 | `MKB-Taxonomie` | `~/user/documenten/` |
| 20 | `Project Style Agents` | `~/user/documenten/` |

### 2.4 Commands Inventarisatie (66 bestaand)

**50 in `~/.claude/commands/` + ~16 via plugins = 66 in registry**

| Groep | Aantal | Commands |
|-------|--------|----------|
| Agent OS | 7 | `/agent-os`, `/write-spec`, `/shape-spec`, `/create-tasks`, `/implement-tasks`, `/orchestrate-tasks`, `/plan-product` |
| Miro Toolkit | 30 | `/miro-start` + 3 categorieën (flowcharts, architecture, frameworks) × 10 per categorie |
| HS-Docs | 6 | `/hs-docs`, `/hs-extract`, `/hs-scan`, `/hs-combine`, `/hs-l4`, `/hs-l5` |
| VEHA (plugin) | 4 | `/veha-status`, `/veha-huisstijl`, `/veha-build`, `/veha-audit` |
| Security (plugin) | 9 | `/security-scan`, `/security-secrets`, `/security-deps`, `/security-code`, `/security-containers`, `/security-database`, `/security-report`, `/security-fix`, `/security-status` |
| Utilities | 8 | `/save-to-cc`, `/connect-project`, `/setup-huisstijl`, `/session-status`, `/vibe-sync`, `/sync-cc`, `/design-os`, `/onboard` |
| **Subtotaal commands/** | **50** | |
| **Subtotaal plugins** | **~16** | |
| **Totaal in registry** | **66** | |

### 2.5 Agents Inventarisatie (20 bestaand)

| Groep | Aantal | Agents |
|-------|--------|--------|
| Agent OS | 8 | spec-initializer, spec-writer, spec-shaper, spec-verifier, product-planner, tasks-list-creator, implementer, implementation-verifier |
| HS-Docs | 7 | hs-docs (orchestrator), txt-extractor, docx-extractor, hs-scanner, combiner, l4-intake, l5-intake |
| VEHA (plugin) | 2 | style-auditor, cross-project-runner |
| Security (plugin) | 3 | security-scanner, security-fixer, security-reporter |

---

## 3. Phase 0 — WSL2 Installatie

### Doel
Ubuntu 24.04 LTS installeren op WSL2 met alle benodigde development tools.

### Stappen

#### 0.1 WSL2 Activeren
```bash
# In PowerShell als Administrator:
wsl --install -d Ubuntu-24.04
# Herstart Windows als gevraagd
# Setup Ubuntu user: shadow / [wachtwoord kiezen]
```

#### 0.2 Ubuntu Base Packages
```bash
# In WSL2 Ubuntu terminal:
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl wget unzip jq
```

#### 0.3 Node.js via nvm
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22    # LTS
nvm alias default 22
node -v           # Verwacht: v22.x.x
npm -v            # Verwacht: 10.x.x
```

#### 0.4 Claude Code CLI
```bash
npm install -g @anthropic-ai/claude-code
claude --version  # Verificatie
```

#### 0.5 Git Configuratie
```bash
git config --global user.name "Shadow"
git config --global user.email "[Shadow's email]"
git config --global init.defaultBranch main
```

#### 0.6 GitHub CLI
```bash
# Installeer gh CLI:
(type -p wget >/dev/null || sudo apt install wget -y) \
  && sudo mkdir -p -m 755 /etc/apt/keyrings \
  && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && sudo apt update \
  && sudo apt install gh -y

gh auth login  # Interactief: GitHub.com > HTTPS > Login via browser
```

#### 0.7 Verificatie Checklist Phase 0

| Check | Command | Verwacht |
|-------|---------|----------|
| WSL2 actief | `wsl -l -v` (PowerShell) | Ubuntu-24.04, VERSION 2 |
| Node.js | `node -v` | v22.x.x |
| npm | `npm -v` | 10.x.x |
| Claude Code | `claude --version` | Recente versie |
| Git | `git --version` | 2.x.x |
| GitHub CLI | `gh --version` | 2.x.x |
| GitHub auth | `gh auth status` | Logged in |

---

## 4. Phase 1 — 3-Laags Directory Structuur

### Doel
De complete mappenstructuur aanmaken in WSL2 volgens het 3-laags ontwerp.

### 1.1 Laag 1: USER (`~/.claude/`)

Dit is de **persoonlijke laag** — regels, commands, skills, agents die OVERAL gelden.

```bash
# Structuur aanmaken (vanuit ~):
mkdir -p ~/.claude/{registry,commands,agents,skills,prompts/{system,project,templates},apis,instructions/{workflows,per-project},design-system/{tokens,animations,components,lib},plugins/local,hooks}
```

**Resultaat:**
```
~/.claude/
├── CLAUDE.md                    ← Globale instructies (nieuw, gemerged)
├── settings.json                ← Plugin/permission config
├── settings.local.json          ← Lokale permissions
├── registry/                    ← Centrale registratie
│   ├── commands.json
│   ├── agents.json
│   ├── skills.json
│   ├── apis.json
│   ├── prompts.json
│   └── instructions.json
├── commands/                    ← Alle slash commands
│   ├── agent-os/                (7 bestaand)
│   ├── miro/                    (40 bestaand)
│   ├── hs-docs/                 (6 bestaand)
│   ├── save-to-cc.md
│   ├── connect-project.md
│   ├── setup-huisstijl.md
│   ├── session-status.md
│   ├── vibe-sync.md
│   ├── sync-cc.md
│   ├── status.md                (NIEUW)
│   ├── nieuw-project.md         (NIEUW)
│   ├── verplaats-project.md     (NIEUW)
│   ├── project-guardian.md      (NIEUW)
│   ├── boom.md                  (NIEUW)
│   ├── test-project.md          (NIEUW)
│   ├── deploy.md                (NIEUW)
│   ├── cross-project.md         (NIEUW)
│   ├── review-code.md           (NIEUW)
│   ├── dagstart.md              (NIEUW)
│   ├── meta.md                  (NIEUW)
│   ├── opslag.md                (NIEUW)
│   └── help-cc.md               (NIEUW)
├── agents/
│   ├── agent-os/                (8 bestaand)
│   └── hs-docs/                 (7 bestaand)
├── skills/                      (2 bestaand)
├── design-system/               (bestaand)
├── plugins/local/
│   ├── veha-manager/            (bestaand)
│   └── security-os/             (bestaand)
├── apis/
├── prompts/
├── instructions/
└── hooks/
```

### 1.2 Laag 2: PROJECTS (`~/projects/`)

Dit is de **actieve werklaag** — alle projecten waar aan gewerkt wordt.

```bash
# Structuur aanmaken:
mkdir -p ~/projects/{done,.shared}
```

**Per-project standaard bestanden** (worden aangemaakt bij project setup):
```
~/projects/[project-naam]/
├── CLAUDE.md                    ← Project-specifieke instructies
├── STATUS.md                    ← Huidige staat (sessie-updates)
├── LOGBOEK.md                   ← Chronologisch logboek
├── BOOM.md                      ← Mappenstructuur referentie
├── .claude/
│   └── project-guardian.md      ← Per-project guardian agent
├── .env                         ← Environment variables (niet in git!)
├── .env.example                 ← Template voor .env
└── [project bestanden]
```

**Shared configuratie** (`~/projects/.shared/`):
```
~/projects/.shared/
├── prettier.config.js           ← Gedeelde Prettier config
├── tsconfig.shared.json         ← Gedeelde TypeScript base config
├── .editorconfig                ← Editor configuratie
└── hooks/
    ├── pre-commit-prettier.sh   ← Prettier auto-format hook
    └── pre-commit-typecheck.sh  ← TypeScript type-check hook
```

### 1.3 Laag 3: DESTINATIONS

```bash
# Bestemmingen aanmaken:
mkdir -p ~/veha/{apps,docs,configs}
mkdir -p ~/user/{documenten,artefacts}
mkdir -p ~/projects/done
```

**Structuur:**
```
~/veha/                          ← VEHA bedrijfsproducten (afgerond)
├── apps/                        ← Afgeronde VEHA applicaties
├── docs/                        ← VEHA documentatie
└── configs/                     ← VEHA configuraties

~/user/                          ← Persoonlijke bestanden
├── documenten/                  ← Documenten, offertes, etc.
└── artefacts/                   ← Verzamelde materialen

~/projects/done/                 ← Gearchiveerde projecten
```

### 1.4 Verificatie Checklist Phase 1

| Check | Verwacht |
|-------|----------|
| `ls ~/.claude/` | CLAUDE.md, registry/, commands/, agents/, skills/, design-system/, plugins/, etc. |
| `ls ~/projects/` | .shared/, done/ |
| `ls ~/veha/` | apps/, docs/, configs/ |
| `ls ~/user/` | documenten/, artefacts/ |
| `ls ~/projects/.shared/` | prettier.config.js, tsconfig.shared.json, hooks/ |

---

## 5. Phase 2 — CLAUDE.md Merge

### Doel
De huidige CLAUDE.md (385 regels) samenvoegen met de nieuwe regels uit het PDF-ontwerp tot één definitief bestand.

### 2.1 Wat BLIJFT (uit huidige CLAUDE.md)

| Sectie | Regels | Status |
|--------|--------|--------|
| Over De Opdrachtgever | 1-9 | **Behouden** |
| Eerlijkheid & Integriteit | 13-58 | **Behouden** (kernwaarde) |
| Taal & Communicatie | 62-70 | **Behouden** |
| Trigger Systeem | 74-205 | **Behouden** (Command Center opslag) |
| Scope Bewaking | 209-227 | **Behouden** |
| Veiligheid | 231-241 | **Behouden** |
| Werkregels | 245-251 | **Uitbreiden** met anti-friction regels |
| Deployment Protocol | 255-274 | **Behouden** |
| Session Protocol | 278-289 | **Uitbreiden** met nieuwe bestanden |
| Bestaande Systemen | 293-328 | **Updaten** met nieuwe namen |
| Command Center Structuur | 332-355 | **Updaten** met 3-laags structuur |
| OKRDST | 360-368 | **Behouden** |
| Snelle Referentie | 373-384 | **Uitbreiden** met nieuwe commands |

### 2.2 Wat wordt TOEGEVOEGD (uit PDF-ontwerp)

| Nieuwe Sectie | Beschrijving |
|--------------|-------------|
| **8 Anti-Friction Regels** | Samenvoegen met bestaande Werkregels |
| **3-Laags Architectuur** | Overzicht van USER/PROJECTS/DESTINATIONS |
| **Per-Project Bestanden** | STATUS.md, LOGBOEK.md, BOOM.md, project-guardian.md |
| **Storage Protocol** | Beslisboom voor opslag van assets |
| **Relocation Protocol** | Hoe projecten verplaatsen naar bestemmingen |
| **Testing Protocol** | Pre-deploy testing stappen |
| **Cross-Project Protocol** | Hoe cross-project acties uitvoeren |
| **Meta Session** | Permanente "Controlekamer" sessie |
| **Nieuwe Commands Referentie** | 13 nieuwe commands in snelle referentie |

### 2.3 Merge Strategie

De nieuwe CLAUDE.md wordt opgebouwd in deze volgorde:

```markdown
# Claude Code Team Instructies

## Over De Opdrachtgever              ← BESTAAND (ongewijzigd)
## Eerlijkheid & Integriteit          ← BESTAAND (ongewijzigd)
## Taal & Communicatie                ← BESTAAND (ongewijzigd)

## Architectuur — 3 Lagen             ← NIEUW
  - USER laag (~/.claude/)
  - PROJECTS laag (~/projects/)
  - DESTINATIONS (~/veha/, ~/user/, ~/projects/done/)

## Werkregels & Anti-Friction          ← BESTAAND + UITGEBREID
  - Bestaande 3 werkregels
  - + 8 anti-friction regels uit PDF
  - + Relatieve paden regel
  - + WSL2/Bash only regel

## Per-Project Bestanden               ← NIEUW
  - STATUS.md format
  - LOGBOEK.md format
  - BOOM.md format
  - project-guardian.md format

## Trigger Systeem                     ← BESTAAND (ongewijzigd)
## Scope Bewaking                      ← BESTAAND (ongewijzigd)
## Veiligheid                          ← BESTAAND (ongewijzigd)

## Protocollen                         ← NIEUW
  - Storage Protocol (beslisboom)
  - Relocation Protocol
  - Deployment Protocol               ← BESTAAND (verplaatst hierheen)
  - Testing Protocol
  - Cross-Project Protocol

## Session Protocol                    ← BESTAAND + UITGEBREID
  - + Meta Session concept
  - + Project sessions

## Bestaande Systemen                  ← BESTAAND + UPDATED
  - Agent OS, Miro, HS-Docs, etc.
  - + Nieuwe project namen

## Command Center Structuur            ← BESTAAND + UPDATED
  - 3-laags overzicht
  - Registry formaat

## Snelle Referentie                   ← BESTAAND + UITGEBREID
  - + 13 nieuwe commands
```

### 2.4 Geschatte Omvang
- Huidige CLAUDE.md: ~385 regels
- Na merge: ~550-600 regels
- Netto toevoeging: ~200 regels (nieuwe secties + uitbreidingen)

---

## 6. Phase 3 — Project Migratie

### Doel
Alle projecten van Windows (`C:\Users\Shadow\Projects\`) naar WSL2 (`~/projects/`) verplaatsen met correcte naamgeving.

### 3.1 Actieve Projecten — Git Clone (vers)

**Waarom clone i.p.v. copy?** Schone git-historie, geen Windows line-ending issues, geen `.git` corruptie door cross-filesystem copy.

| # | GitHub Remote | Nieuwe WSL2 Locatie | Actie |
|---|--------------|---------------------|-------|
| 1 | `OTFstrategies/command-center-v2` | `~/projects/command-center/` | `git clone` + rename |
| 2 | `OTFstrategies/HSF-House-of-Process` | `~/projects/proceshuis-hsf/` | `git clone` + rename |
| 3 | `OTFstrategies/House-of-process-VEHA` | `~/projects/proceshuis-veha/` | `git clone` + rename |
| 4 | `OTFstrategies/veha-app` | `~/projects/veha-app/` | `git clone` |
| 5 | `OTFstrategies/veha-hub` | `~/projects/veha-hub/` | `git clone` |

**Clone commando's:**
```bash
cd ~/projects

# 1. Command Center
git clone git@github.com:OTFstrategies/command-center-v2.git command-center

# 2. Proceshuis HSF
git clone git@github.com:OTFstrategies/HSF-House-of-Process.git proceshuis-hsf

# 3. Proceshuis VEHA
git clone git@github.com:OTFstrategies/House-of-process-VEHA.git proceshuis-veha

# 4. VEHA App
git clone git@github.com:OTFstrategies/veha-app.git

# 5. VEHA Hub
git clone git@github.com:OTFstrategies/veha-hub.git
```

**Na clone — per project:**
```bash
cd ~/projects/[project]
npm install                    # Dependencies installeren
cp .env.example .env           # Als .env.example bestaat
```

### 3.2 Per-Project Setup

Elk actief project krijgt de standaard bestanden. Hieronder het template:

#### CLAUDE.md (per-project)
Blijft project-specifiek. Elk project heeft al een CLAUDE.md — die wordt meegenomen via git clone.

#### STATUS.md Template
```markdown
# [Project Naam] — Status

**Laatste update:** [datum]
**Branch:** main
**Deploy:** [URL of N.v.t.]

## Huidige Staat
[Beschrijving van waar het project staat]

## Laatste Sessie
- [Wat er gedaan is]

## Open Items
- [ ] [Item 1]
- [ ] [Item 2]

## Bekende Issues
- [Issue beschrijving]
```

#### LOGBOEK.md Template
```markdown
# [Project Naam] — Logboek

## [Datum]
### Sessie: [korte beschrijving]
- **Duur:** ~[x] minuten
- **Gedaan:**
  - [Actie 1]
  - [Actie 2]
- **Beslissingen:**
  - [Beslissing]
- **Volgende keer:**
  - [Vervolgactie]
```

#### BOOM.md Template
```markdown
# [Project Naam] — Mappenstructuur

Gegenereerd op: [datum]

\```
[output van tree command]
\```

## Toelichting
- `src/` — [beschrijving]
- `lib/` — [beschrijving]
```

#### .claude/project-guardian.md Template
```markdown
# Project Guardian — [Project Naam]

## Rol
Bewaakt de kwaliteit en consistentie van dit project.

## Checks bij elke sessie
- [ ] STATUS.md is actueel
- [ ] Geen ongecommitte wijzigingen
- [ ] Build slaagt (`npm run build`)
- [ ] Geen TypeScript errors (`npx tsc --noEmit`)

## Project-specifieke regels
- [Regel 1 specifiek voor dit project]
- [Regel 2]

## Afhankelijkheden
- [Externe service of API]
- [Andere projecten]
```

### 3.3 Archiveerbare Projecten

```bash
# Kopieer naar done/ (vanuit Windows via /mnt/c/)
mkdir -p ~/projects/done

# Alleen als Shadow bevestigt:
cp -r /mnt/c/Users/Shadow/Projects/command-center ~/projects/done/command-center-v1
cp -r /mnt/c/Users/Shadow/Projects/design-os ~/projects/done/design-os
cp -r /mnt/c/Users/Shadow/Projects/veha-design ~/projects/done/veha-design
```

### 3.4 Documentatie Directories

```bash
# Documentatie naar ~/user/
cp -r "/mnt/c/Users/Shadow/Projects/Artefacts" ~/user/artefacts/
cp -r "/mnt/c/Users/Shadow/Projects/Claude_Offerte project" ~/user/documenten/offerte/
cp -r "/mnt/c/Users/Shadow/Projects/HS" ~/user/documenten/hs/
cp -r "/mnt/c/Users/Shadow/Projects/Master folder" ~/user/documenten/master/
cp -r "/mnt/c/Users/Shadow/Projects/MKB-Taxonomie" ~/user/documenten/mkb-taxonomie/
cp -r "/mnt/c/Users/Shadow/Projects/Project Style Agents" ~/user/documenten/style-agents/
```

### 3.5 Nader te Bepalen Projecten

Deze projecten hebben input van Shadow nodig:

| Project | Mijn Aanbeveling | Reden |
|---------|-----------------|-------|
| `agent-os` | **Actief houden** in `~/projects/agent-os/` | Upstream fork, nuttig als referentie |
| `bryntum-analysis` | **Archiveren** naar `~/projects/done/` | Research, geen actieve ontwikkeling |
| `prompt-library-mcp` | **Archiveren** → `~/projects/done/` | Experiment, MCP concept kan later terugkomen |
| `VEHA_Doc_Generator` | **Samenvoegen** met hs-docs assets | HS-docs gerelateerd materiaal |
| `v95-omega-prime` | **Samenvoegen** met hs-docs assets | HS procedures content |

### 3.6 Verificatie Checklist Phase 3

| Check | Command | Verwacht |
|-------|---------|----------|
| Alle actieve projecten gecloned | `ls ~/projects/` | command-center, proceshuis-hsf, proceshuis-veha, veha-app, veha-hub |
| Git werkt per project | `cd ~/projects/command-center && git status` | Clean working tree |
| Dependencies geinstalleerd | `cd ~/projects/command-center && npm run build` | Build succeeds |
| Standaard bestanden aanwezig | `ls ~/projects/command-center/STATUS.md` | File exists |
| Archief correct | `ls ~/projects/done/` | command-center-v1, design-os, veha-design |

---

## 7. Phase 4 — Commands, Skills & Agents

### Doel
De 13 nieuwe commands uit het PDF-ontwerp toevoegen naast de bestaande 66, plus eventuele nieuwe skills en agents.

### 4.1 Nieuwe Commands (13)

Elk command is een `.md` bestand in `~/.claude/commands/`.

#### 4.1.1 `/status`
**Bestand:** `~/.claude/commands/status.md`
**Doel:** Toon huidige project status, git state, open taken
```markdown
Toon de huidige status van het actieve project:

1. Lees STATUS.md en geef een samenvatting
2. Toon `git status` (kort)
3. Toon `git log --oneline -5` (laatste 5 commits)
4. Tel open taken in tasks als die er zijn
5. Check of build slaagt (`npm run build` dry-run)

Output als overzichtelijke tabel.
```

#### 4.1.2 `/nieuw-project`
**Bestand:** `~/.claude/commands/nieuw-project.md`
**Doel:** Start een nieuw project met volledige setup
```markdown
Maak een nieuw project aan in ~/projects/ met alle standaard bestanden:

1. Vraag: Project naam (kebab-case)
2. Vraag: Type (next.js / node / python / docs)
3. Vraag: Beschrijving (1 zin)

Maak aan:
- ~/projects/[naam]/CLAUDE.md (met project context)
- ~/projects/[naam]/STATUS.md (initieel)
- ~/projects/[naam]/LOGBOEK.md (eerste entry)
- ~/projects/[naam]/BOOM.md (initieel)
- ~/projects/[naam]/.claude/project-guardian.md

Als type next.js:
- npx create-next-app@latest met TypeScript, Tailwind, App Router
- /setup-huisstijl uitvoeren
- .env.example aanmaken

Git init + eerste commit.
Voeg toe aan Command Center registry als Shadow dat wil.
```

#### 4.1.3 `/verplaats-project`
**Bestand:** `~/.claude/commands/verplaats-project.md`
**Doel:** Verplaats een project naar een bestemming (relocation protocol)
```markdown
Verplaats het huidige project naar een bestemming:

1. Toon opties:
   a. ~/veha/apps/ (VEHA bedrijfsproduct - afgerond)
   b. ~/user/ (persoonlijk project - afgerond)
   c. ~/projects/done/ (archief - niet meer nodig)

2. Vraag bevestiging met project naam

3. Uitvoeren:
   - Update STATUS.md met "VERPLAATST naar [bestemming]"
   - Laatste entry in LOGBOEK.md
   - `git add -A && git commit -m "chore: prepare for relocation"`
   - Verplaats directory
   - Update Command Center registry (verwijder uit actieve projecten)

4. Bevestig verplaatsing
```

#### 4.1.4 `/project-guardian`
**Bestand:** `~/.claude/commands/project-guardian.md`
**Doel:** Voer project guardian checks uit
```markdown
Voer de project guardian checks uit voor het huidige project:

1. Lees .claude/project-guardian.md
2. Voer elke check uit:
   - STATUS.md actueel? (check datum)
   - Ongecommitte wijzigingen? (`git status`)
   - Build slaagt? (`npm run build`)
   - TypeScript errors? (`npx tsc --noEmit`)
   - Linter errors? (als eslint geconfigureerd)

3. Rapporteer resultaten als checklist met pass/fail
4. Bied aan om problemen te fixen
```

#### 4.1.5 `/boom`
**Bestand:** `~/.claude/commands/boom.md`
**Doel:** Genereer/update BOOM.md met mappenstructuur
```markdown
Genereer of update BOOM.md voor het huidige project:

1. Scan de mappenstructuur (exclude: node_modules, .git, .next, dist, build)
2. Voeg toelichting toe per belangrijke map
3. Schrijf naar BOOM.md met datum

Format:
\```
project-naam/
├── src/
│   ├── app/          # Next.js App Router pagina's
│   ├── components/   # React componenten
│   └── lib/          # Utilities en helpers
├── public/           # Statische bestanden
└── package.json
\```
```

#### 4.1.6 `/test-project`
**Bestand:** `~/.claude/commands/test-project.md`
**Doel:** Test het project volgens testing protocol
```markdown
Voer het testing protocol uit voor het huidige project:

1. **Build test:** `npm run build`
2. **Type check:** `npx tsc --noEmit`
3. **Lint check:** `npm run lint` (als geconfigureerd)
4. **Unit tests:** `npm test` (als geconfigureerd)
5. **E2E tests:** `npx playwright test` (als geconfigureerd)

Rapporteer per stap: PASS / FAIL / SKIP (niet geconfigureerd)
Bij FAIL: toon foutmelding en bied aan om te fixen.
```

#### 4.1.7 `/deploy`
**Bestand:** `~/.claude/commands/deploy.md`
**Doel:** Deploy naar Vercel volgens deployment protocol
```markdown
Deploy het huidige project naar Vercel:

1. Pre-flight checks:
   - [ ] Build slaagt lokaal
   - [ ] Geen TypeScript errors
   - [ ] Geen console.log in productie code
   - [ ] Environment variables op Vercel geconfigureerd

2. Als checks falen: rapporteer en STOP

3. Als checks slagen:
   - Vraag: Preview of Production?
   - Preview: `npx vercel` (preview URL tonen)
   - Production: vraag bevestiging → `npx vercel --prod`

4. Na deploy:
   - Log naar activity_log
   - Update STATUS.md met deploy datum
   - Toon live URL
```

#### 4.1.8 `/cross-project`
**Bestand:** `~/.claude/commands/cross-project.md`
**Doel:** Voer een actie uit over meerdere projecten
```markdown
Voer een actie uit over meerdere projecten in ~/projects/:

1. Vraag: Welke actie?
   a. Git status overzicht (alle projecten)
   b. Dependency update (`npm update`)
   c. Guardian check (alle projecten)
   d. Custom command

2. Vraag: Welke projecten?
   a. Alle actieve projecten
   b. Alleen VEHA projecten (veha-app, veha-hub, proceshuis-veha)
   c. Specifieke selectie

3. Voer uit per project en rapporteer resultaten als tabel:

| Project | Status | Details |
|---------|--------|---------|
| command-center | OK | Clean, build passes |
| veha-app | WARN | 2 uncommitted files |
```

#### 4.1.9 `/review-code`
**Bestand:** `~/.claude/commands/review-code.md`
**Doel:** Review recente code wijzigingen
```markdown
Review de recente code wijzigingen in het huidige project:

1. Toon `git diff HEAD~1` of `git diff --staged`
2. Analyseer wijzigingen op:
   - Huisstijl compliance (zinc palette, geen kleuren)
   - TypeScript best practices
   - Security issues (OWASP top 10)
   - Performance problemen
   - Ontbrekende error handling

3. Rapporteer bevindingen per categorie:
   - KRITIEK: moet gefixed worden
   - WAARSCHUWING: zou beter kunnen
   - INFO: suggestie

4. Bied aan om kritieke issues te fixen
```

#### 4.1.10 `/dagstart`
**Bestand:** `~/.claude/commands/dagstart.md`
**Doel:** Start-of-day overzicht
```markdown
Geef een dagstart overzicht:

1. Datum en tijd
2. Per actief project in ~/projects/:
   - Laatste commit (datum + message)
   - Open branches
   - STATUS.md samenvatting (eerste 3 regels)
3. Command Center status (als bereikbaar)
4. Suggestie: "Waar wil je vandaag aan werken?"

Format als overzichtelijke tabel.
```

#### 4.1.11 `/meta`
**Bestand:** `~/.claude/commands/meta.md`
**Doel:** Open de Meta/Controlekamer sessie
```markdown
Dit is de Meta sessie — de "Controlekamer" voor het gehele systeem.

In deze sessie kun je:
1. **Overzicht** — Status van alle projecten
2. **Planning** — Welk project krijgt prioriteit
3. **Onderhoud** — Cross-project updates, dependency checks
4. **Review** — Command Center data reviewen
5. **Configuratie** — CLAUDE.md of settings aanpassen

Dit is GEEN project-sessie. Hier werk je aan het systeem zelf.
Start met: "Toon overzicht van alle projecten en hun status."
```

#### 4.1.12 `/opslag`
**Bestand:** `~/.claude/commands/opslag.md`
**Doel:** Handmatig storage protocol triggeren
```markdown
Voer het storage protocol uit voor het huidige item:

1. Vraag: Wat wil je opslaan?
   - Command (.md → ~/.claude/commands/)
   - Agent (.md → ~/.claude/agents/)
   - Skill (.md → ~/.claude/skills/)
   - Prompt (.md → ~/.claude/prompts/)
   - API config (.json → ~/.claude/apis/)
   - Instructie (.md → ~/.claude/instructions/)

2. Vraag: Naam en beschrijving
3. Sla op in juiste locatie
4. Update registry JSON
5. Bevestig met pad + registry entry
```

#### 4.1.13 `/help-cc`
**Bestand:** `~/.claude/commands/help-cc.md`
**Doel:** Toon Command Center help
```markdown
Toon een overzicht van het Claude Code Command Center:

## Beschikbare Commands
Lees ~/.claude/registry/commands.json en toon als tabel:
| Command | Groep | Beschrijving |

## Beschikbare Agents
Lees ~/.claude/registry/agents.json en toon als tabel:
| Agent | Project | Beschrijving |

## Beschikbare Skills
Lees ~/.claude/registry/skills.json en toon als tabel.

## Architectuur
- USER laag: ~/.claude/ (persoonlijk)
- PROJECTS laag: ~/projects/ (actief werk)
- DESTINATIONS: ~/veha/, ~/user/, ~/projects/done/

## Sneltoetsen
| Actie | Command |
|-------|---------|
| Project status | /status |
| Dagstart | /dagstart |
| Nieuw project | /nieuw-project |
| Deploy | /deploy |
| Help | /help-cc |
```

### 4.2 Commands Registratie

Na het aanmaken van alle 13 commands, update `~/.claude/registry/commands.json`:

```json
{
  "description": "Alle geregistreerde slash commands",
  "items": [
    // ... bestaande 66 items ...
    {
      "id": "cmd-status",
      "name": "status",
      "path": "commands/status.md",
      "description": "Toon huidige project status, git state, open taken",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["status", "overzicht"]
    },
    {
      "id": "cmd-nieuw-project",
      "name": "nieuw-project",
      "path": "commands/nieuw-project.md",
      "description": "Start een nieuw project met volledige setup",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["project", "setup", "init"]
    },
    {
      "id": "cmd-verplaats-project",
      "name": "verplaats-project",
      "path": "commands/verplaats-project.md",
      "description": "Verplaats project naar bestemming (relocation protocol)",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["project", "verplaats", "archief"]
    },
    {
      "id": "cmd-project-guardian",
      "name": "project-guardian",
      "path": "commands/project-guardian.md",
      "description": "Voer project guardian checks uit",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["quality", "checks", "guardian"]
    },
    {
      "id": "cmd-boom",
      "name": "boom",
      "path": "commands/boom.md",
      "description": "Genereer BOOM.md met mappenstructuur",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["documentatie", "structuur"]
    },
    {
      "id": "cmd-test-project",
      "name": "test-project",
      "path": "commands/test-project.md",
      "description": "Test project volgens testing protocol",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["testing", "quality"]
    },
    {
      "id": "cmd-deploy",
      "name": "deploy",
      "path": "commands/deploy.md",
      "description": "Deploy naar Vercel volgens deployment protocol",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["deploy", "vercel"]
    },
    {
      "id": "cmd-cross-project",
      "name": "cross-project",
      "path": "commands/cross-project.md",
      "description": "Voer actie uit over meerdere projecten",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["cross-project", "batch"]
    },
    {
      "id": "cmd-review-code",
      "name": "review-code",
      "path": "commands/review-code.md",
      "description": "Review recente code wijzigingen",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["review", "quality"]
    },
    {
      "id": "cmd-dagstart",
      "name": "dagstart",
      "path": "commands/dagstart.md",
      "description": "Start-of-day overzicht van alle projecten",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["dagstart", "overzicht"]
    },
    {
      "id": "cmd-meta",
      "name": "meta",
      "path": "commands/meta.md",
      "description": "Open Meta/Controlekamer sessie voor systeembeheer",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["meta", "controlekamer", "systeem"]
    },
    {
      "id": "cmd-opslag",
      "name": "opslag",
      "path": "commands/opslag.md",
      "description": "Handmatig storage protocol triggeren",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["opslag", "storage", "registry"]
    },
    {
      "id": "cmd-help-cc",
      "name": "help-cc",
      "path": "commands/help-cc.md",
      "description": "Toon Command Center help en overzicht",
      "created": "2026-02-12",
      "project": "global",
      "tags": ["help", "overzicht"]
    }
  ]
}
```

### 4.3 Nieuwe Agents

Uit het PDF-ontwerp komen geen nieuwe agents — de bestaande 20 agents blijven. Wel wordt per actief project een **project-guardian agent** aangemaakt (zie Phase 3).

### 4.4 Bestaande Skills

De 2 bestaande skills (miro-patterns, keybindings-help) blijven ongewijzigd.

### 4.5 Verificatie Checklist Phase 4

| Check | Command | Verwacht |
|-------|---------|----------|
| Alle 13 commands bestaan | `ls ~/.claude/commands/{status,nieuw-project,verplaats-project,project-guardian,boom,test-project,deploy,cross-project,review-code,dagstart,meta,opslag,help-cc}.md` | 13 bestanden |
| Registry bijgewerkt | `cat ~/.claude/registry/commands.json \| jq '.items \| length'` | 79 (66 + 13) |
| Commands werken | `/help-cc` in Claude Code | Overzicht wordt getoond |

---

## 8. Phase 5 — MCP Servers & Credentials

### Doel
MCP servers configureren in WSL2 en credentials veilig opslaan.

### 5.1 MCP Server Configuratie

De MCP servers worden geconfigureerd in `~/.claude/settings.json` (of via Claude Code UI).

#### USER-level MCP Servers

| Server | Doel | Configuratie |
|--------|------|-------------|
| **GitHub** | Repository management, PR's, issues | Via `gh` CLI (al geconfigureerd in Phase 0) |
| **Context7** | Up-to-date documentatie voor libraries | Plugin (al beschikbaar) |
| **Playwright** | Browser testing & screenshots | Plugin (al beschikbaar) |
| **Serena** | Code intelligence, symbol navigatie | Plugin (al beschikbaar) |

#### PROJECT-level MCP Servers

| Server | Doel | Projecten | Configuratie |
|--------|------|-----------|-------------|
| **Supabase** | Database queries, RLS management | command-center | Via Supabase MCP |
| **Vercel** | Deployments, preview URLs | Alle web-apps | Via Vercel CLI |
| **Filesystem** | Lokale bestanden lezen/schrijven | Alle | Via filesystem MCP |

### 5.2 Credentials

**Veiligheidsregel:** Credentials worden NOOIT in bestanden opgeslagen die in git komen.

| Credential | Waar Opslaan | Hoe Gebruiken |
|-----------|-------------|--------------|
| `ANTHROPIC_API_KEY` | `~/.bashrc` (export) | Claude Code CLI |
| GitHub token | `gh auth` (keyring) | Via gh CLI |
| Supabase keys | `~/projects/command-center/.env` | Per-project .env |
| Vercel token | `npx vercel login` (keyring) | Via Vercel CLI |
| `SYNC_API_KEY` | `~/projects/command-center/.env` | Sync script |

**~/.bashrc toevoegingen:**
```bash
# Claude Code
export ANTHROPIC_API_KEY="sk-ant-..."

# Optioneel: default project pad
export CLAUDE_PROJECTS_DIR="$HOME/projects"
```

### 5.3 .env.example Templates

Elk project met environment variables krijgt een `.env.example`:

**command-center/command-center-app/.env.example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SYNC_API_KEY=your-sync-api-key
```

**command-center/cc-v2-mcp/.env** (MCP server — APART van dashboard):
```
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**LET OP:** De MCP server laadt `.env` uit zijn EIGEN directory (`cc-v2-mcp/`), niet uit de project root. Dit bestand moet apart aangemaakt worden naast de dashboard `.env`.

### 5.4 Verificatie Checklist Phase 5

| Check | Command | Verwacht |
|-------|---------|----------|
| Anthropic key werkt | `claude --version` + test prompt | Response ontvangen |
| GitHub auth | `gh auth status` | Logged in to github.com |
| Supabase keys | `cat ~/projects/command-center/.env` | Keys aanwezig |
| Vercel auth | `npx vercel whoami` | Account naam |

---

## 9. Phase 6 — Hooks & Automatisering

### Doel
Git hooks en Claude Code hooks configureren voor automatische kwaliteitscontrole.

### 6.1 USER-Level Hooks

#### Branch Protection Hook
**Locatie:** `~/.claude/hooks/` (of via Claude Code settings)
**Doel:** Voorkom directe pushes naar `main`/`master`

```json
// In ~/.claude/settings.json of settings.local.json:
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "check-branch-protection.sh",
        "description": "Blokkeer directe pushes naar main/master"
      }
    ]
  }
}
```

### 6.2 PROJECT-Level Hooks (via .shared/)

#### Prettier Auto-Format
**Locatie:** `~/projects/.shared/hooks/pre-commit-prettier.sh`
```bash
#!/bin/bash
# Auto-format staged files met Prettier
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|css|md)$')
if [ -n "$FILES" ]; then
  echo "$FILES" | xargs npx prettier --write
  echo "$FILES" | xargs git add
fi
```

#### TypeScript Type Check
**Locatie:** `~/projects/.shared/hooks/pre-commit-typecheck.sh`
```bash
#!/bin/bash
# TypeScript type check voor commit
if [ -f "tsconfig.json" ]; then
  npx tsc --noEmit
  if [ $? -ne 0 ]; then
    echo "TypeScript errors gevonden. Fix ze voordat je commit."
    exit 1
  fi
fi
```

### 6.3 Per-Project Git Hooks Setup

```bash
# Per project (eenmalig):
cd ~/projects/[project]
mkdir -p .git/hooks

# Symlink naar shared hooks:
ln -sf ~/projects/.shared/hooks/pre-commit-prettier.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 6.4 Shared Configs

#### prettier.config.js
**Locatie:** `~/projects/.shared/prettier.config.js`
```javascript
module.exports = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
}
```

#### .editorconfig
**Locatie:** `~/projects/.shared/.editorconfig`
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

### 6.5 Verificatie Checklist Phase 6

| Check | Verwacht |
|-------|----------|
| Branch protection hook actief | Push naar main wordt geblokkeerd |
| Prettier hook werkt | Staged files worden geformateerd bij commit |
| TypeScript check hook werkt | Commit faalt bij TS errors |
| Shared configs bestaan | `ls ~/projects/.shared/` toont alle bestanden |

---

## 10. Phase 7 — Command Center v2 Integratie

### Doel
Command Center v2 (Next.js dashboard) bijwerken zodat het de nieuwe structuur weerspiegelt en alle data correct synchroniseert. Op basis van grondige code-analyse zijn specifieke wijzigingen geidentificeerd.

### 7.1 Huidige CC v2 Staat (geverifieerd)

| Onderdeel | Status | Details |
|-----------|--------|---------|
| Live URL | https://command-center-app-nine.vercel.app | Vercel deployment |
| Framework | Next.js 14, App Router, Server Components | TypeScript |
| Database | Supabase (PostgreSQL) | 13 tabellen in gebruik |
| API Routes | 14 route-bestanden, 24 HTTP methods | Auth via `x-api-key` |
| Pagina's | Home, Activity, Registry, Tasks, Settings, Projects/[slug] | 4 project tabs |
| Sync | `~/.claude/registry/*.json` → `sync-registry.mjs` → `POST /api/sync` → Supabase | Platform-agnostisch |
| MCP Server | `cc-v2-mcp/` met 7 tools (analyze, symbols, refs, diagnostics, deps, metrics, health) | ts-morph analyse |
| Design | Shadow Huisstijl (zinc, glassmorphism, Framer Motion) | Consistent |

### 7.2 Analyse Resultaat: Sync Pipeline

**GOED NIEUWS — Sync script is volledig platform-agnostisch:**

```javascript
// sync-registry.mjs gebruikt:
import { homedir } from 'os'       // → /home/shadow op WSL2
import { join } from 'path'         // → forward slashes op Linux
import { readFileSync } from 'fs'   // → platform-onafhankelijk

const REGISTRY_DIR = join(homedir(), '.claude', 'registry')
// WSL2: /home/shadow/.claude/registry  ← automatisch correct
```

**Geen code-wijzigingen nodig voor WSL2.** Het script werkt out-of-the-box.

**Sync API route (`POST /api/sync`) flow:**
1. Ontvangt JSON met `type` + `items[]` via HTTP
2. Valideert `x-api-key` header tegen `SYNC_API_KEY` env var
3. DELETE alle bestaande `registry_items` van dat type
4. INSERT nieuwe items met `randomUUID()` als ID
5. Detecteert changes (added/removed) voor `project_changelog`
6. Auto-create projecten in `projects` tabel als ze niet bestaan
7. Log sync event in `activity_log`

### 7.3 KRITIEK ISSUE: Name vs Slug Mismatch

**Het grootste risico bij de migratie.** Het CC v2 systeem gebruikt twee verschillende identifier-systemen:

| Systeem | Identifier | Voorbeeld | Tabellen |
|---------|-----------|-----------|----------|
| **Registry** | Project NAME (origineel) | `"command-center-v2"` | `registry_items.project`, `project_changelog.project`, `project_memories.project` |
| **Code Intelligence** | Project SLUG (van directory basename) | `"command-center-v2"` | `project_symbols.project`, `project_dependencies.project`, `project_metrics.project` |

**Momenteel werkt dit** omdat de directory naam (`command-center-v2`) en de registry project naam hetzelfde zijn.

**Na migratie breekt dit** als de directory naam verandert:
- Directory `command-center-v2` → `command-center` (WSL2)
- MCP analyzer genereert slug: `path.basename("/home/shadow/projects/command-center")` → `"command-center"`
- Maar registry items hebben nog `project = "command-center-v2"`
- **Gevolg:** Code Intelligence tabs tonen geen data, of data van verkeerd project

#### 7.3.1 Oplossing: Supabase Data Migratie

Na de directory rename moet de Supabase data bijgewerkt worden:

**Stap 1: Registry project namen updaten**
```sql
-- Alle registry_items die "command-center-v2" als project hebben
UPDATE registry_items SET project = 'command-center' WHERE project = 'command-center-v2';
UPDATE project_changelog SET project = 'command-center' WHERE project = 'command-center-v2';
UPDATE project_memories SET project = 'command-center' WHERE project = 'command-center-v2';
UPDATE activity_log SET details = jsonb_set(details, '{project}', '"command-center"')
  WHERE details->>'project' = 'command-center-v2';
```

**Stap 2: Code Intelligence data updaten**
```sql
-- Code intel tabellen gebruiken slug van directory
UPDATE project_symbols SET project = 'command-center' WHERE project = 'command-center-v2';
UPDATE project_references SET project = 'command-center' WHERE project = 'command-center-v2';
UPDATE project_diagnostics SET project = 'command-center' WHERE project = 'command-center-v2';
UPDATE project_dependencies SET project = 'command-center' WHERE project = 'command-center-v2';
UPDATE project_metrics SET project = 'command-center' WHERE project = 'command-center-v2';
```

**Stap 3: Projects tabel updaten**
```sql
UPDATE projects SET slug = 'command-center', name = 'command-center'
  WHERE slug = 'command-center-v2' OR name = 'command-center-v2';
```

**Alternatief:** Skip data migratie, run opnieuw:
- `npm run sync` → overschrijft registry_items (automatisch correcte namen)
- `analyze_project ~/projects/command-center` → overschrijft code-intel (DELETE + INSERT)
- Alleen `project_memories` en `activity_log` bevatten dan nog oude namen

#### 7.3.2 Slug Generatie in Dashboard

Het dashboard genereert slugs op meerdere plekken. Deze moeten consistent zijn:

| Locatie | Huidige Code | Gebruikt Voor |
|---------|-------------|---------------|
| `lib/projects.ts` | `name.toLowerCase().replace(/\s+/g, '-')` | Project links, lookup |
| `lib/code-intel.ts` | `project.toLowerCase().replace(/\s+/g, '-')` (via `toSlug()`) | Code intelligence queries |
| `cc-v2-mcp/src/analyzer/project.ts` | `path.basename(projectPath).toLowerCase().replace(/\s+/g, '-')` | MCP analyse opslag |
| `app/(dashboard)/page.tsx` | `project.toLowerCase().replace(/\s+/g, '-')` | Recent changes links |
| `app/(dashboard)/projects/[slug]/page.tsx` | `slug.replace(/-/g, ' ')` → `getProjectByName()` | Project detail lookup |

**Aanbeveling:** Na migratie is dit geen probleem zolang registry project namen en directory namen kebab-case zijn en overeenkomen. De nieuwe namen (`command-center`, `proceshuis-hsf`, `proceshuis-veha`) zijn al kebab-case.

### 7.4 MCP Server Configuratie voor WSL2

De Code Intelligence MCP server (`cc-v2-mcp/`) heeft een eigen `.env` nodig:

```bash
# ~/projects/command-center/cc-v2-mcp/.env
SUPABASE_URL=https://ikpmlhmbooaxfrlpzcfa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Belangrijk:** De MCP server laadt `.env` uit zijn eigen directory (via `import.meta.url` + `fileURLToPath`), niet uit de project root of cwd. Dit .env bestand moet apart aangemaakt worden.

**MCP server path-handling op WSL2:**
- `path.basename()` werkt correct met Linux paden
- `.replace(/\\/g, '/')` normalisatie is een no-op op Linux (veilig)
- `fs.existsSync()`, `path.join()` zijn platform-agnostisch
- ts-morph zoekt `tsconfig.json` relatief (geen pad-issues)

### 7.5 Dashboard Pagina's — Impact na Migratie

#### Homepage (6 StatCards)

| StatCard | Huidige Data | Na Migratie | Bron |
|----------|-------------|-------------|------|
| APIs | 2 | 2 | `registry_items` type='api' |
| Prompts | 1 | 1 | `registry_items` type='prompt' |
| Skills | 2 | 2 | `registry_items` type='skill' |
| Agents | 20 | 20 | `registry_items` type='agent' |
| Commands | 66 | **79** (+13 nieuw) | `registry_items` type='command' |
| Instructions | 5 | 5 | `registry_items` type='instruction' |

**Automatisch bijgewerkt na `npm run sync`** — geen code-wijzigingen nodig.

#### Recent Changes
- Gegenereerd door sync API bij elke `POST /api/sync`
- Slug links: `project.toLowerCase().replace(/\s+/g, '-')`
- **Werkt correct** als project namen kebab-case zijn

#### Projects Lijst
- Haalt unieke projecten uit `registry_items` + verrijkt met `projects` tabel metadata
- **Automatisch bijgewerkt** via sync — projecten worden auto-created
- `getProjectColor(name)` geeft consistente kleuren per project naam

#### Project Detail Pagina (`/projects/[slug]`)
- **Dual lookup:** Registry data via NAME, Code Intelligence via SLUG
- **Tabs:** Overview (changelog, memories, assets) | Code (symbols) | Dependencies | Health (metrics)
- **Werkt correct** als NAME en SLUG overeenkomen (kebab-case namen garanderen dit)

### 7.6 API Routes — Volledig Overzicht na Analyse

14 route-bestanden met 24 HTTP methods. **Geen platform-specifieke code gevonden:**

| Groep | Route | Methods | Auth | Supabase Tabellen |
|-------|-------|---------|------|-------------------|
| **Sync** | `/api/sync` | GET, POST | POST: x-api-key | `registry_items`, `project_changelog`, `activity_log`, `projects` |
| **Inbox** | `/api/sync/inbox` | GET, POST | POST: x-api-key | `inbox_pending` |
| **Inbox Process** | `/api/sync/inbox/process` | POST | x-api-key | `inbox_pending`, `registry_items`, `projects`, `project_changelog`, `activity_log` |
| **Tasks** | `/api/tasks` | GET, POST | POST: x-api-key | `kanban_tasks` |
| **Task Detail** | `/api/tasks/[id]` | PATCH, DELETE | x-api-key | `kanban_tasks` |
| **Search** | `/api/search` | GET | Geen | `registry_items`, `projects`, `kanban_tasks` |
| **Activity** | `/api/activity` | GET, POST | POST: x-api-key | `activity_log` |
| **Project** | `/api/projects/[slug]` | GET, PATCH | PATCH: x-api-key | `projects`, `activity_log` |
| **Symbols** | `/api/projects/[slug]/symbols` | GET | Geen | `project_symbols` |
| **Diagnostics** | `/api/projects/[slug]/diagnostics` | GET | Geen | `project_diagnostics` |
| **Dependencies** | `/api/projects/[slug]/dependencies` | GET | Geen | `project_dependencies` |
| **Metrics** | `/api/projects/[slug]/metrics` | GET | Geen | `project_metrics` |
| **Memories** | `/api/projects/[slug]/memories` | GET, POST | POST: x-api-key | `project_memories`, `activity_log` |
| **Memory Detail** | `/api/projects/[slug]/memories/[name]` | GET, DELETE | DELETE: x-api-key | `project_memories`, `activity_log` |

**Conclusie:** Alle routes zijn HTTP/JSON + Supabase SDK. Geen OS-afhankelijkheden. Werkt ongewijzigd op WSL2.

### 7.7 Supabase Data Migratie Script

Voor de project hernoem-actie, een eenmalig SQL script:

```sql
-- ============================================
-- MIGRATIE SCRIPT: Project Hernoemen
-- Voer uit in Supabase SQL Editor NADAT
-- projecten zijn gecloned met nieuwe namen
-- ============================================

-- 1. command-center-v2 → command-center
DO $$
BEGIN
  -- Registry tabellen (gebruiken NAME)
  UPDATE registry_items SET project = 'command-center' WHERE project = 'command-center-v2';
  UPDATE project_changelog SET project = 'command-center' WHERE project = 'command-center-v2';
  UPDATE project_memories SET project = 'command-center' WHERE project = 'command-center-v2';

  -- Code Intelligence tabellen (gebruiken SLUG)
  UPDATE project_symbols SET project = 'command-center' WHERE project = 'command-center-v2';
  UPDATE project_references SET project = 'command-center' WHERE project = 'command-center-v2';
  UPDATE project_diagnostics SET project = 'command-center' WHERE project = 'command-center-v2';
  UPDATE project_dependencies SET project = 'command-center' WHERE project = 'command-center-v2';
  UPDATE project_metrics SET project = 'command-center' WHERE project = 'command-center-v2';

  -- Projects tabel
  UPDATE projects SET slug = 'command-center', name = 'command-center'
    WHERE slug = 'command-center-v2' OR name = 'command-center-v2';

  -- Activity log (project in JSONB details)
  UPDATE activity_log SET details = jsonb_set(details, '{project}', '"command-center"')
    WHERE details->>'project' = 'command-center-v2';

  RAISE NOTICE 'command-center-v2 → command-center: DONE';
END $$;

-- 2. Nieuwe projecten worden automatisch aangemaakt bij sync
-- (proceshuis-hsf, proceshuis-veha worden auto-created door POST /api/sync)
```

### 7.8 Benodigde CC v2 Code-Wijzigingen

Op basis van de analyse zijn er **geen functionele code-wijzigingen nodig** voor WSL2 migratie. Wel zijn er verbeteringen die we meenemen:

#### 7.8.1 CLAUDE.md Bijwerken (project-level)

Het project CLAUDE.md (`command-center-v2/CLAUDE.md`) moet bijgewerkt worden met:
- Nieuwe directory structuur (inclusief `cc-v2-mcp/` details)
- Code Intelligence tabellen en MCP tools
- Gecorrigeerde systeemrollen (Serena verwijderd, CC v2 MCP toegevoegd)
- Bijgewerkte tellingen

**Status:** Dit is al deels gedaan in een eerdere sessie. Het CLAUDE.md in de project context (boven in dit document) is al bijgewerkt.

#### 7.8.2 Sync na Migratie

```bash
# Vanuit WSL2, na alle phases:
cd ~/projects/command-center/command-center-app

# 1. Sync registry (79 commands, 20 agents, etc.)
SYNC_API_KEY="[key]" npm run sync

# 2. Re-analyze code (optioneel, als MCP server actief is)
# Via Claude Code: analyze_project ~/projects/command-center
```

### 7.9 Bekende CC v2 Issues

| # | Issue | Beschrijving | Ernst | Aanpak |
|---|-------|-------------|-------|--------|
| 1 | **Sync zonder rollback** | DELETE + INSERT zonder transactie — als INSERT faalt, is data weg | MEDIUM | Acceptabel risico; sync kan opnieuw gedraaid worden |
| 2 | **Search zonder paginatie** | `/api/search` laadt alle items in geheugen | LAAG | Werkt tot ~1000 items; later optimaliseren |
| 3 | **Geen DELETE project** | Geen API route om een project te verwijderen | LAAG | Handmatig via Supabase dashboard |
| 4 | **Memory name/slug** | Memories upsert op `project + name` — mismatch mogelijk bij rename | MEDIUM | Opgelost door SQL migratie script |
| 5 | **Failing tests** | 92.6% pass rate (uit eerdere sessie) | HOOG | Fixen na basis migratie |
| 6 | **Stop hooks** | 2 failing stop hooks (uit eerdere sessie) | MEDIUM | Fixen na basis migratie |

### 7.10 Verificatie Checklist Phase 7

| # | Check | Command/Actie | Verwacht |
|---|-------|--------------|----------|
| 1 | Sync script werkt vanuit WSL2 | `SYNC_API_KEY="[key]" npm run sync` | "Synced X items for type Y" per type |
| 2 | SQL migratie uitgevoerd | Supabase SQL Editor | Geen errors |
| 3 | Dashboard homepage | Browser → home | 6 StatCards met correcte aantallen (79 commands) |
| 4 | Dashboard registry | Browser → registry | Alle 79 commands zichtbaar |
| 5 | Project detail pagina | Browser → projects/command-center | Overview + Code + Dependencies + Health tabs werken |
| 6 | Activity log | POST /api/activity + Browser → activity | Entry verschijnt |
| 7 | MCP server .env | Check `cc-v2-mcp/.env` bevat keys | Supabase URL + SERVICE_ROLE_KEY |
| 8 | Code Intelligence data | Browser → projects/command-center → Code tab | Symbolen zichtbaar |
| 9 | Memories | Browser → projects/command-center → Overview | Bestaande memories tonen |
| 10 | Search | ⌘K in dashboard | Registry items doorzoekbaar |

---

## 11. Phase 8 — Validatie & Go-Live

### Doel
End-to-end validatie van het complete systeem voordat de Windows-setup wordt losgelaten.

### 8.1 Validatie Checklist

#### Infrastructuur

| # | Check | Command | Verwacht |
|---|-------|---------|----------|
| 1 | WSL2 draait | `wsl -l -v` | Ubuntu-24.04 Running |
| 2 | Node.js werkt | `node -v` | v22.x.x |
| 3 | Claude Code werkt | `claude --version` | Versie nummer |
| 4 | Git + GitHub | `gh auth status` | Authenticated |

#### Directory Structuur

| # | Check | Command | Verwacht |
|---|-------|---------|----------|
| 5 | USER laag | `ls ~/.claude/CLAUDE.md` | Bestaat |
| 6 | PROJECTS laag | `ls ~/projects/` | 5+ project dirs |
| 7 | Shared configs | `ls ~/projects/.shared/` | prettier, tsconfig, hooks |
| 8 | Destinations | `ls ~/veha/ ~/user/` | Mappen bestaan |

#### Projecten

| # | Check | Command | Verwacht |
|---|-------|---------|----------|
| 9 | CC clone | `cd ~/projects/command-center && git status` | Clean |
| 10 | CC build | `cd ~/projects/command-center/command-center-app && npm run build` | Success |
| 11 | HSF clone | `cd ~/projects/proceshuis-hsf && git status` | Clean |
| 12 | VEHA clone | `cd ~/projects/proceshuis-veha && git status` | Clean |
| 13 | Standaard bestanden | Per project: STATUS.md, LOGBOEK.md, BOOM.md | Bestaan |

#### Commands & Registry

| # | Check | Command | Verwacht |
|---|-------|---------|----------|
| 14 | Nieuwe commands | `/help-cc` in Claude Code | 79 commands getoond |
| 15 | Registry JSON | `jq '.items \| length' ~/.claude/registry/commands.json` | 79 |
| 16 | Sync naar Supabase | `SYNC_API_KEY="[key]" npm run sync` in CC | Success |

#### Command Center v2 Dashboard

| # | Check | Verwacht |
|---|-------|----------|
| 17 | SQL migratie uitgevoerd | Geen fouten in Supabase SQL Editor |
| 18 | Homepage StatCards | 6 cards met correcte aantallen (79 commands) |
| 19 | Project detail `/projects/command-center` | Overview, Code, Dependencies, Health tabs werken |
| 20 | MCP server .env | `cc-v2-mcp/.env` bevat SUPABASE_URL + SERVICE_ROLE_KEY |

#### Workflows

| # | Check | Verwacht |
|---|-------|----------|
| 21 | `/dagstart` | Overzicht van alle projecten |
| 22 | `/status` | Huidige project status |
| 23 | `/boom` | BOOM.md gegenereerd |
| 24 | `/meta` | Meta sessie instructies |

### 8.2 Go-Live Stappen

1. **Alles gevalideerd?** → Ja: ga door. Nee: fix eerst.
2. **Windows Claude Code** → Kan parallel blijven draaien als fallback
3. **Dagelijks gebruik** → Start met `/dagstart` in WSL2
4. **Na 1 week** → Als alles stabiel: Windows setup optioneel archiveren

### 8.3 Fallback Plan

Als WSL2 setup niet werkt:
- Windows setup blijft intact op `C:\Users\Shadow\`
- Geen data verloren (alles is git clone, originelen blijven)
- Kan altijd terug naar Windows-native Claude Code

---

## 12. Risico's & Fallback

| # | Risico | Impact | Mitigatie |
|---|--------|--------|----------|
| 1 | WSL2 installatieprobleem | Blokkert alles | Windows 11 Pro ondersteunt WSL2 standaard; documentatie beschikbaar |
| 2 | Git clone fouten | Project niet beschikbaar | Originelen staan nog op Windows + GitHub |
| 3 | Node.js versie conflict | Build failures | nvm maakt versie-management eenvoudig |
| 4 | .env secrets kwijt | Project werkt niet | Secrets staan in Vercel dashboard + Supabase dashboard |
| 5 | **Name/Slug mismatch na rename** | **Code Intelligence tabs tonen geen data** | **SQL migratie script uitvoeren (zie 7.7) + re-analyze** |
| 6 | **Sync zonder rollback** | **Data verlies bij INSERT fout** | **Sync opnieuw draaien; registry JSON is source of truth** |
| 7 | Plugin incompatibiliteit | Features missen | Plugins per stuk testen en activeren |
| 8 | Performance WSL2 | Trage builds | WSL2 filesystem is snel voor Linux-native bestanden |
| 9 | **MCP server .env ontbreekt** | **Code Intelligence werkt niet** | **Maak cc-v2-mcp/.env aan met Supabase keys (zie 7.4)** |

---

## Samenvatting — Totaaloverzicht

| Phase | Onderdelen | Geschatte Complexiteit |
|-------|-----------|----------------------|
| **0. WSL2** | Ubuntu install, Node.js, Git, Claude Code, GitHub CLI | Laag |
| **1. Directories** | 3-laags structuur aanmaken, shared configs | Laag |
| **2. CLAUDE.md** | Merge huidig + PDF naar nieuw bestand (~600 regels) | Medium |
| **3. Projecten** | 5 git clones, standaard bestanden, archivering | Medium |
| **4. Commands** | 13 nieuwe commands, registry update | Medium |
| **5. MCP/Credentials** | Keys configureren, .env files + MCP server .env | Laag |
| **6. Hooks** | Branch protection, Prettier, TypeScript hooks | Laag |
| **7. CC v2** | Supabase data migratie, sync, MCP .env, 10-punt verificatie | **Hoog** |
| **8. Validatie** | 20-punt checklist, go-live | Laag |

**Totaal: 8 phases, 79 commands (66 bestaand + 13 nieuw), 20 agents, 5 actieve projecten**

### CC v2 Technisch Detail — Architectuur Referentie

```
SYNC FLOW (Registry → Dashboard):
~/.claude/registry/*.json
  → sync-registry.mjs (Node: homedir() + path.join() = cross-platform)
  → POST /api/sync (x-api-key auth)
  → Supabase: registry_items (DELETE+INSERT), project_changelog, activity_log, projects
  → Dashboard: Homepage StatCards, Registry pagina, Project detail Overview tab

CODE INTELLIGENCE FLOW (Analyse → Dashboard):
MCP: analyze_project(pad)
  → ts-morph: loadProject() + extractSymbols() + extractReferences()
  → extractDiagnostics() + extractDependencies() + calculateMetrics()
  → Supabase: project_symbols, project_references, project_diagnostics,
              project_dependencies, project_metrics (DELETE+INSERT per project)
  → Dashboard: Project detail Code/Dependencies/Health tabs

IDENTIFIER MATCHING (KRITIEK):
  Registry tabellen: project = "command-center" (NAME uit registry JSON)
  Code-Intel tabellen: project = "command-center" (SLUG van path.basename())
  → MOETEN OVEREENKOMEN — anders tonen project detail tabs geen data
  → Oplossing: kebab-case namen die gelijk zijn aan directory namen
```

---

## Open Vragen voor Shadow

Voordat dit plan uitgevoerd kan worden, zijn deze beslissingen nodig:

1. **Agent OS fork** — Actief houden in `~/projects/agent-os/` of archiveren?
2. **bryntum-analysis** — Archiveren naar `~/projects/done/`?
3. **prompt-library-mcp** — Archiveren of verder ontwikkelen?
4. **VEHA_Doc_Generator + v95-omega-prime** — Samenvoegen met hs-docs assets?
5. **Niet-git directories** — Naar `~/user/documenten/` verplaatsen?
6. **Wachtwoord WSL2 Ubuntu user** — Welk wachtwoord wil je gebruiken?
7. **GitHub email** — Welk email adres voor git config?

---

*Dit document is het volledige, gedetailleerde uitvoeringsplan. Na goedkeuring door Shadow wordt het stap voor stap uitgevoerd.*
