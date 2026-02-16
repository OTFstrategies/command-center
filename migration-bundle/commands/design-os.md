---
allowed-tools: Bash(git clone:*), Bash(npm install:*), Bash(mkdir:*), Bash(HOME=/c/Users/Shadow BASE_DIR=/c/Users/Shadow/agent-os /c/Users/Shadow/agent-os/scripts/project-install.sh:*), Bash(start cmd /k "cd /d * && claude"), AskUserQuestion
description: Start een nieuw Design OS project - product planning en design tool (user)
---

# Design OS Project Setup

Help de gebruiker een nieuw **Design OS** project op te zetten met volledige Agent OS integratie.

Design OS is een product planning en design tool die de brug slaat tussen productidee en codebase. Het volgt een gestructureerd proces:

1. **Product Planning** — Visie, roadmap, data models
2. **Design System** — Kleuren, typografie, shell design
3. **Section Design** — Requirements, sample data, screen designs
4. **Export** — Handoff packages voor implementatie

## Stappen

### 1. Vraag project details

Vraag de gebruiker:
- Wat is de naam van het project?
- Waar moet het project komen? (standaard: `C:\Users\Shadow\Projects\{project-name}`)

### 2. Maak project folder en clone repository

```bash
mkdir -p "{project-path}"
git clone https://github.com/buildermethods/design-os.git "{project-path}"
```

### 3. Installeer Agent OS in het project

```bash
cd "{project-path}" && HOME=/c/Users/Shadow BASE_DIR=/c/Users/Shadow/agent-os /c/Users/Shadow/agent-os/scripts/project-install.sh
```

Dit installeert:
- `agent-os/standards/` — Jouw coding standards
- `.claude/commands/agent-os/` — Agent OS commands
- `.claude/agents/agent-os/` — Agent OS subagents

### 4. Installeer dependencies

```bash
cd "{project-path}" && npm install
```

### 5. Geef de gebruiker de BELANGRIJKE instructies

Na succesvolle setup, toon dit bericht aan de gebruiker:

---

## Project "{project-name}" is aangemaakt!

**Locatie:** `{project-path}`

---

### VOLGENDE STAP: Open een nieuwe terminal in de project folder

Om alle Agent OS en Design OS functionaliteiten te gebruiken, moet je Claude Code **vanuit de project folder** starten:

**Optie 1: Via Windows Explorer**
1. Open Windows Explorer
2. Navigeer naar `{project-path}`
3. Rechtermuisklik -> "Open in Terminal"
4. Type: `claude`

**Optie 2: Via Command Prompt**
```cmd
cd /d {project-path}
claude
```

**Optie 3: Direct openen (ik doe dit voor je)**
Vraag of ik een nieuwe terminal kan openen met Claude Code in de project folder.

---

### Beschikbare Commands (in project folder)

**Agent OS — Spec-Driven Development:**
| Command | Beschrijving |
|---------|-------------|
| `/write-spec` | Schrijf specificatie voor een feature |
| `/shape-spec` | Verfijn en verbeter een specificatie |
| `/create-tasks` | Genereer takenlijst uit specificatie |
| `/implement-tasks` | Implementeer taken uit takenlijst |
| `/orchestrate-tasks` | Volledige spec -> implementatie workflow |
| `/plan-product` | Plan product roadmap |

**Design OS — Product Design:**
| Command | Beschrijving |
|---------|-------------|
| `/product-vision` | Definieer product overview |
| `/product-roadmap` | Plan secties |
| `/data-model` | Definieer entiteiten |
| `/design-tokens` | Kies kleuren en typografie |
| `/design-shell` | Ontwerp navigatie shell |
| `/shape-section` | Definieer sectie requirements |
| `/sample-data` | Genereer sample data |
| `/design-screen` | Ontwerp schermen |
| `/export-product` | Genereer export package |

---

### Tech Stack
React 19, Vite 7, Tailwind CSS v4, TypeScript

---

### 6. Vraag of je de terminal moet openen

Vraag de gebruiker: "Wil je dat ik een nieuwe terminal open met Claude Code in de project folder?"

Als ja, voer uit:
```bash
start cmd /k "cd /d {project-path} && claude"
```
