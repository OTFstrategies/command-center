# Volledige Systeemschoonmaak — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Het hele systeem opschonen en standaardiseren conform de Command Center app als bron van waarheid.

**Architecture:** 6 fases sequentieel: git standaardisatie → project triage → CC onboarding → ~/.claude/ cleanup → diskruimte → verificatie. Elke fase bouwt voort op de vorige.

**Tech Stack:** git, gh CLI, bash, Vercel CLI, Supabase (via CC API), cc-v2-mcp (ts-morph)

---

## Task 1: Branch Rename — Actieve Repos (master → main)

**Files:**

- Modify: Security OS config na afloop (Task 3)

**Step 1: Rename branches voor alle 8 repos met master**

Per repo exact dezelfde 5 commando's uitvoeren. Begin met command-center:

```bash
cd ~/projects/command-center
git branch -m master main
git push origin main
gh repo edit --default-branch main
git push origin --delete master
git branch -u origin/main main
```

**Step 2: Herhaal voor veha-app**

```bash
cd ~/projects/veha-app
git branch -m master main
git push origin main
gh repo edit --default-branch main
git push origin --delete master
git branch -u origin/main main
```

**Step 3: Herhaal voor veha-hub**

```bash
cd ~/projects/veha-hub
git branch -m master main
git push origin main
gh repo edit --default-branch main
git push origin --delete master
git branch -u origin/main main
```

**Step 4: Herhaal voor veha-website**

```bash
cd ~/projects/veha-website
git branch -m master main
git push origin main
gh repo edit --default-branch main
git push origin --delete master
git branch -u origin/main main
```

**Step 5: Herhaal voor bryntum-analysis**

```bash
cd ~/projects/bryntum-analysis
git branch -m master main
git push origin main
gh repo edit --default-branch main
git push origin --delete master
git branch -u origin/main main
```

**Step 6: Herhaal voor claude-config-shadow**

```bash
cd ~/projects/claude-config-shadow
git branch -m master main
git push origin main
gh repo edit --default-branch main
git push origin --delete master
git branch -u origin/main main
```

**Step 7: Herhaal voor prompt-library-mcp**

```bash
cd ~/projects/prompt-library-mcp
git branch -m master main
git push origin main
gh repo edit --default-branch main
git push origin --delete master
git branch -u origin/main main
```

**Step 8: Herhaal voor v95-omega-prime**

```bash
cd ~/projects/v95-omega-prime
git branch -m master main
git push origin main
gh repo edit --default-branch main
git push origin --delete master
git branch -u origin/main main
```

**Step 9: Verificatie**

```bash
for d in ~/projects/*/; do
  [ -d "$d/.git" ] && echo "$(basename $d): $(git -C $d branch --show-current)"
done
```

Expected: Alle repos tonen `main`.

---

## Task 2: Stash Opruimen

**Step 1: Bekijk de stash in command-center**

```bash
cd ~/projects/command-center
git stash list
git stash show stash@{0}
```

Expected: Toont WIP op commit 66c7368.

**Step 2: Drop de stash**

```bash
git stash drop stash@{0}
```

Expected: `Dropped stash@{0}`

**Step 3: Verificatie**

```bash
git stash list
```

Expected: Lege output (geen stashes meer).

---

## Task 3: Security OS Config Updaten

**Files:**

- Modify: `~/.claude/plugins/local/security-os/config/security-os.json`

**Step 1: Lees de huidige config**

Lees `~/.claude/plugins/local/security-os/config/security-os.json` en bekijk de `default_branches` sectie.

**Step 2: Update default_branches**

Vervang de hele `default_branches` sectie door alleen de actieve projecten, allemaal op `main`:

```json
"default_branches": {
  "command-center": "main",
  "veha-app": "main",
  "veha-hub": "main",
  "veha-website": "main",
  "proceshuis-veha": "main",
  "proceshuis-hsf": "main",
  "veha-doc-generator": "main"
}
```

Verwijderd: gantt-dashboard, design-os, design-os1, design-os-template, en alle dubbele/verouderde entries.

**Step 3: Verificatie**

```bash
grep -A 15 '"default_branches"' ~/.claude/plugins/local/security-os/config/security-os.json
```

Expected: Alleen de 7 actieve projecten, allemaal met `main`.

---

## Task 4: Verwijder docs/ Orphan Directory

**Step 1: Bekijk inhoud van docs/**

```bash
ls -la ~/projects/docs/
```

Beoordeel of er waardevolle bestanden in staan.

**Step 2: Verwijder de directory**

```bash
rm -rf ~/projects/docs/
```

**Step 3: Verificatie**

```bash
ls ~/projects/docs/ 2>&1
```

Expected: `No such file or directory`

---

## Task 5: Node_modules Verwijderen bij Te Archiveren Projecten

Doe dit VOOR het verplaatsen naar done/ om 500-800 MB te besparen.

**Step 1: Verwijder node_modules bij alle 7 te archiveren projecten**

```bash
rm -rf ~/projects/agent-os/node_modules
rm -rf ~/projects/bryntum-analysis/node_modules
rm -rf ~/projects/claude-config-shadow/node_modules
rm -rf ~/projects/design-os/node_modules
rm -rf ~/projects/prompt-library-mcp/node_modules
rm -rf ~/projects/v95-omega-prime/node_modules
rm -rf ~/projects/veha-design/node_modules
```

**Step 2: Verificatie**

```bash
for d in agent-os bryntum-analysis claude-config-shadow design-os prompt-library-mcp v95-omega-prime veha-design; do
  [ -d ~/projects/$d/node_modules ] && echo "$d: STILL HAS node_modules" || echo "$d: clean"
done
```

Expected: Alle 7 tonen `clean`.

---

## Task 6: Projecten Archiveren naar done/

**Step 1: Verplaats alle 7 dormant projecten naar done/**

```bash
mv ~/projects/agent-os ~/projects/done/
mv ~/projects/bryntum-analysis ~/projects/done/
mv ~/projects/claude-config-shadow ~/projects/done/
mv ~/projects/design-os ~/projects/done/
mv ~/projects/prompt-library-mcp ~/projects/done/
mv ~/projects/v95-omega-prime ~/projects/done/
mv ~/projects/veha-design ~/projects/done/
```

**Step 2: Verificatie**

```bash
ls ~/projects/done/
```

Expected: Toont agent-os, bryntum-analysis, claude-config-shadow, command-center-v2, design-os, prompt-library-mcp, v95-omega-prime, veha-design.

**Step 3: Verifieer dat ~/projects/ alleen actieve projecten bevat**

```bash
ls -d ~/projects/*/
```

Expected: command-center, proceshuis-hsf, proceshuis-veha, veha-app, veha-doc-generator, veha-hub, veha-website, .shared, done.

---

## Task 7: Archief Verder Opschonen

**Step 1: Verwijder command-center-v2 uit done/**

Dit is de oude versie die al op GitHub staat als `command-center-v1-archive`.

```bash
rm -rf ~/projects/done/command-center-v2
```

**Step 2: Verificatie**

```bash
ls ~/projects/done/
du -sh ~/projects/done/
```

Expected: command-center-v2 is weg. Totale grootte done/ significant kleiner.

---

## Task 8: Actieve Projecten — Ontbrekende Docs Genereren

Voor elk actief project dat docs mist: genereer STATUS.md, LOGBOEK.md, BOOM.md, .claude/project-guardian.md.

**Step 1: Check welke projecten docs missen**

```bash
for d in command-center proceshuis-hsf proceshuis-veha veha-app veha-doc-generator veha-hub veha-website; do
  echo "=== $d ==="
  [ -f ~/projects/$d/STATUS.md ] && echo "  STATUS.md: OK" || echo "  STATUS.md: MISSING"
  [ -f ~/projects/$d/LOGBOEK.md ] && echo "  LOGBOEK.md: OK" || echo "  LOGBOEK.md: MISSING"
  [ -f ~/projects/$d/BOOM.md ] && echo "  BOOM.md: OK" || echo "  BOOM.md: MISSING"
  [ -f ~/projects/$d/.claude/project-guardian.md ] && echo "  project-guardian.md: OK" || echo "  project-guardian.md: MISSING"
done
```

**Step 2: Genereer ontbrekende docs per project**

Voor elk project met ontbrekende bestanden:

- Lees package.json, CLAUDE.md, en recente git log om context te begrijpen
- Genereer STATUS.md met: project naam, laatste update datum, branch (main), deploy URL, huidige staat, open items
- Genereer LOGBOEK.md met initieel entry voor deze sessie
- Genereer BOOM.md met `tree -I node_modules -I .git -I .next -L 3` output
- Genereer .claude/project-guardian.md met project-specifieke checks

Gebruik de templates uit CLAUDE.md (globaal) als basis.

**Step 3: Commit per project**

```bash
cd ~/projects/<project>
git add STATUS.md LOGBOEK.md BOOM.md .claude/project-guardian.md
git commit -m "docs: add standard project documentation"
git push origin main
```

---

## Task 9: Actieve Projecten Onboarden in CC

Per actief project dat nog niet volledig in CC geregistreerd staat.

**Step 1: Check huidige CC registratie**

Gebruik de CC API om te zien welke projecten metadata hebben:

```bash
for slug in command-center veha-hub veha-app proceshuis-veha proceshuis-hsf veha-website veha-doc-generator; do
  STATUS=$(curl -s "https://command-center-app-nine.vercel.app/api/projects/$slug" | head -c 200)
  echo "=== $slug ==="
  echo "$STATUS"
  echo
done
```

**Step 2: Onboard projecten die metadata missen**

Per project dat geen metadata heeft, stuur een PATCH request:

```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/projects/<slug>" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <SYNC_API_KEY>" \
  -d '{
    "description": "<beschrijving>",
    "tech_stack": ["<tech1>", "<tech2>"],
    "build_command": "<build cmd>",
    "dev_command": "<dev cmd>",
    "languages": ["typescript"],
    "live_url": "<vercel url>",
    "repo_url": "https://github.com/OTFstrategies/<repo>"
  }'
```

Detecteer de waarden uit package.json en project structuur:

- `tech_stack`: lees dependencies uit package.json
- `build_command`: lees scripts.build uit package.json
- `dev_command`: lees scripts.dev uit package.json
- `languages`: check voor tsconfig.json (typescript), .py files (python)
- `live_url`: check .vercel/project.json of Vercel dashboard
- `repo_url`: `git remote get-url origin`

**Step 3: Verificatie**

Herhaal de check uit Step 1. Alle 7 projecten moeten metadata tonen.

---

## Task 10: Code Intelligence Analyse

Voer `analyze_project` uit via de cc-v2-mcp server voor alle actieve TypeScript projecten.

**Step 1: Check welke projecten TypeScript zijn**

```bash
for d in command-center proceshuis-hsf proceshuis-veha veha-app veha-doc-generator veha-hub veha-website; do
  [ -f ~/projects/$d/tsconfig.json ] && echo "$d: TypeScript" || echo "$d: No tsconfig"
done
```

**Step 2: Analyseer elk TypeScript project**

Gebruik de cc-v2-mcp MCP tools:

- `analyze_project` met het volledige pad naar elk project
- Dit slaat symbols, references, diagnostics, dependencies, en metrics op in Supabase

**Step 3: Verificatie**

Check via CC API dat code intelligence data beschikbaar is:

```bash
for slug in command-center veha-hub veha-app proceshuis-veha proceshuis-hsf veha-website veha-doc-generator; do
  METRICS=$(curl -s "https://command-center-app-nine.vercel.app/api/projects/$slug/metrics")
  echo "=== $slug ==="
  echo "$METRICS" | head -c 200
  echo
done
```

---

## Task 11: Windows-scripts Vervangen

**Files:**

- Delete: `~/.claude/plugins/local/security-os/scripts/scheduled-scan.bat`
- Delete: `~/.claude/plugins/local/security-os/scripts/setup-scheduler.ps1`
- Create: `~/.claude/plugins/local/security-os/scripts/scheduled-scan.sh`
- Create: `~/.claude/plugins/local/security-os/scripts/setup-scheduler.sh`

**Step 1: Lees de huidige Windows-scripts**

Lees beide bestanden om de functionaliteit te begrijpen.

**Step 2: Schrijf bash equivalenten**

Maak `scheduled-scan.sh` met dezelfde functionaliteit als de .bat file.
Maak `setup-scheduler.sh` met dezelfde functionaliteit als de .ps1 file (gebruik crontab ipv Windows Task Scheduler).

**Step 3: Maak scripts executable**

```bash
chmod +x ~/.claude/plugins/local/security-os/scripts/scheduled-scan.sh
chmod +x ~/.claude/plugins/local/security-os/scripts/setup-scheduler.sh
```

**Step 4: Verwijder Windows-scripts**

```bash
rm ~/.claude/plugins/local/security-os/scripts/scheduled-scan.bat
rm ~/.claude/plugins/local/security-os/scripts/setup-scheduler.ps1
```

**Step 5: Verificatie**

```bash
ls ~/.claude/plugins/local/security-os/scripts/
```

Expected: Alleen .sh bestanden, geen .bat of .ps1.

---

## Task 12: Registry Audit

**Files:**

- Modify: `~/.claude/registry/commands.json`
- Modify: `~/.claude/registry/agents.json`
- Modify: `~/.claude/registry/skills.json`
- Modify: `~/.claude/registry/apis.json`
- Modify: `~/.claude/registry/prompts.json`
- Modify: `~/.claude/registry/instructions.json`

**Step 1: Check elk registry item of het bestand bestaat**

Schrijf een script dat elk item in elke registry JSON leest, het `path` veld pakt, en checkt of dat bestand bestaat op disk:

```bash
for registry in commands agents skills apis prompts instructions; do
  echo "=== $registry ==="
  # Parse paths uit JSON en check existence
  cat ~/.claude/registry/$registry.json | python3 -c "
import json, sys, os
data = json.load(sys.stdin)
items = data.get('items', [])
for item in items:
    path = item.get('path', '')
    full = os.path.expanduser(f'~/.claude/{path}') if path else ''
    exists = os.path.exists(full) if full else False
    status = 'OK' if exists else 'MISSING'
    print(f'  [{status}] {item.get(\"name\", \"?\")} -> {path}')
"
done
```

**Step 2: Verwijder entries die naar niet-bestaande bestanden verwijzen**

Voor elke MISSING entry: verwijder uit de registry JSON.

**Step 3: Verwijder entries van gearchiveerde projecten**

Check het `project` veld van elke entry. Als het verwijst naar een gearchiveerd project (agent-os, bryntum-analysis, etc.), verwijder de entry.

**Step 4: Verificatie**

Herhaal Step 1. Expected: Alle entries tonen `OK`, geen MISSING.

---

## Task 13: Agents Map Opschonen

**Files:**

- Modify: `~/.claude/agents/` directory

**Step 1: Inventariseer alle agent bestanden**

```bash
ls ~/.claude/agents/ | wc -l
ls ~/.claude/agents/
```

**Step 2: Categoriseer agents**

Check welke agents bij actieve systemen horen:

- Agent OS agents (8): agent-os gerelateerd → ARCHIEF (agent-os is gearchiveerd)
- HS-Docs agents (7): document generatie → check of nog in gebruik
- Security OS agents (3): security scanning → BEHOUDEN
- VEHA Manager agents (2): VEHA project management → BEHOUDEN
- Overige: individueel beoordelen

**Step 3: Verwijder agents van gearchiveerde systemen**

Verwijder agent bestanden die niet meer bij actieve projecten/systemen horen.

**Step 4: Update agents registry**

Verwijder corresponderende entries uit `~/.claude/registry/agents.json`.

**Step 5: Verificatie**

```bash
ls ~/.claude/agents/ | wc -l
```

Expected: Significant minder bestanden (doelstelling: <50).

---

## Task 14: Registry Sync naar CC

**Step 1: Voer registry sync uit**

```bash
cd ~/projects/command-center/command-center-app
SYNC_API_KEY="$(grep SYNC_API_KEY .env.local | cut -d= -f2)" npm run sync
```

**Step 2: Verificatie**

Check het CC dashboard of alle items correct gesynchroniseerd zijn.

```bash
curl -s "https://command-center-app-nine.vercel.app/api/sync" | head -c 500
```

---

## Task 15: Finale Verificatie

**Step 1: Git status alle repos**

```bash
for d in ~/projects/*/; do
  [ -d "$d/.git" ] && echo "$(basename $d): branch=$(git -C $d branch --show-current) status=$(git -C $d status --short | wc -l) changes"
done
```

Expected: Alle repos op `main`, 0 changes.

**Step 2: Projects directory structuur**

```bash
echo "=== Actieve projecten ==="
ls -d ~/projects/*/
echo
echo "=== Archief ==="
ls ~/projects/done/
echo
echo "=== Disk usage ==="
du -sh ~/projects/
du -sh ~/projects/done/
```

Expected: 7 actieve projecten + .shared + done. Significant minder diskgebruik.

**Step 3: CC Dashboard check**

Verifieer dat alle 7 actieve projecten zichtbaar zijn in het CC dashboard met:

- Correcte metadata (tech_stack, build_command, etc.)
- Code intelligence data (voor TypeScript projecten)
- Geen broken referenties

**Step 4: Registry integriteit**

```bash
for registry in commands agents skills apis prompts instructions; do
  COUNT=$(cat ~/.claude/registry/$registry.json | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('items',[])))")
  echo "$registry: $COUNT items"
done
```

Expected: Alle counts lager dan of gelijk aan de oorspronkelijke counts (112 totaal), geen MISSING entries.

**Step 5: Commit alle wijzigingen**

Per project met wijzigingen:

```bash
cd ~/projects/<project>
git add -A
git commit -m "chore: system cleanup — standardize project structure"
git push origin main
```
