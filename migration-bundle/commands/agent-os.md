---
allowed-tools: Bash(mkdir:*), Bash(git init:*), Bash(HOME=/c/Users/Shadow BASE_DIR=/c/Users/Shadow/agent-os /c/Users/Shadow/agent-os/scripts/project-install.sh:*), Bash(start cmd /k "cd /d * && claude"), AskUserQuestion
description: Start een nieuw project met Agent OS - spec-driven development (user)
---

# Agent OS Project Setup

Help de gebruiker een nieuw project op te zetten met **Agent OS** voor spec-driven development.

Agent OS transformeert AI coding agents van "confused interns" naar productieve developers door gestructureerde workflows die jouw standards, stack en codebase details vastleggen.

## Workflow

```
Idee → /write-spec → /shape-spec → /create-tasks → /implement-tasks → Werkende code
```

## Stappen

### 1. Vraag project details

Vraag de gebruiker:
- Wat is de naam van het project?
- Waar moet het project komen? (standaard: `C:\Users\Shadow\Projects\{project-name}`)
- Wil je een git repository initialiseren? (standaard: ja)

### 2. Maak project folder

```bash
mkdir -p "{project-path}"
```

### 3. Initialiseer git (indien gewenst)

```bash
cd "{project-path}" && git init
```

### 4. Installeer Agent OS in het project

```bash
cd "{project-path}" && HOME=/c/Users/Shadow BASE_DIR=/c/Users/Shadow/agent-os /c/Users/Shadow/agent-os/scripts/project-install.sh
```

Dit installeert:
- `agent-os/standards/` — Coding standards (aanpasbaar)
- `agent-os/specs/` — Folder voor specificaties
- `.claude/commands/agent-os/` — Agent OS commands
- `.claude/agents/agent-os/` — Agent OS subagents

### 5. Geef de gebruiker de BELANGRIJKE instructies

Na succesvolle setup, toon dit bericht aan de gebruiker:

---

## Project "{project-name}" is aangemaakt!

**Locatie:** `{project-path}`

---

### VOLGENDE STAP: Open een nieuwe terminal in de project folder

Om alle Agent OS functionaliteiten te gebruiken, moet je Claude Code **vanuit de project folder** starten:

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

**Spec-Driven Development Workflow:**

| Stap | Command | Beschrijving |
|------|---------|-------------|
| 1 | `/write-spec` | Schrijf specificatie voor een feature |
| 2 | `/shape-spec` | Verfijn en verbeter de specificatie |
| 3 | `/create-tasks` | Genereer takenlijst uit specificatie |
| 4 | `/implement-tasks` | Implementeer taken uit takenlijst |
| - | `/orchestrate-tasks` | Volledige workflow in een keer |
| - | `/plan-product` | Plan product roadmap |

**Hoe te beginnen:**
1. Open Claude Code in de project folder
2. Beschrijf wat je wilt bouwen
3. Gebruik `/write-spec` om een specificatie te maken
4. Volg de workflow: shape -> tasks -> implement

---

### Pas je standards aan

De coding standards staan in `agent-os/standards/`:
- `backend/` — API, models, queries, migrations
- `frontend/` — Components, CSS, accessibility
- `global/` — Coding style, conventions, tech stack
- `testing/` — Test writing guidelines

Pas deze aan naar jouw project's tech stack en conventies!

---

### 6. Vraag of je de terminal moet openen

Vraag de gebruiker: "Wil je dat ik een nieuwe terminal open met Claude Code in de project folder?"

Als ja, voer uit:
```bash
start cmd /k "cd /d {project-path} && claude"
```
