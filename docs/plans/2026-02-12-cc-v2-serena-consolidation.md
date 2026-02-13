# CC v2 + Serena Consolidation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Maak Command Center v2 werkend als visueel dashboard door de sync pipeline te fixen, en definieer de rolverdeling tussen CC v2, Serena en Claude CLI.

**Architecture:** CC v2 blijft een read-mostly Next.js dashboard dat `~/.claude/registry/` data spiegelt naar Supabase. Een nieuw Node.js sync-script leest alle registry JSON-bestanden en pusht ze naar de bestaande `/api/sync` endpoint. Een Claude Code command (`/sync-cc`) maakt dit eenvoudig aanroepbaar. Serena wordt ingezet voor project-specifieke memories.

**Tech Stack:** Node.js (sync script), Next.js API routes (bestaand), Supabase (bestaand), Claude Code commands/hooks

---

## Huidige Staat (uit analyse)

### Wat werkt
- `/api/sync` POST endpoint: neemt `{ type, items[] }`, vervangt alle items van dat type, maakt changelog
- `/api/sync` GET endpoint: retourneert stats en laatste sync-tijden
- `/save-to-cc` command: slaat individueel item op in `~/.claude/` (lokale bestanden + registry JSON)
- 6 hookify triggers: detecteren wanneer assets worden aangemaakt (waarschuwing)
- CC v2 dashboard: toont data uit Supabase correct wanneer die er is
- Serena: 9 projecten geconfigureerd, LSP actief, memories beschikbaar maar leeg

### Wat NIET werkt
- **Geen sync client:** Niets leest `~/.claude/registry/*.json` en roept de sync API aan
- **Supabase is leeg/incompleet:** 230+ assets lokaal, minimaal in database
- **Geen automatisering:** Alles is handmatig, geen hooks, geen scheduler
- **Serena memories leeg:** Geen project-context opgeslagen

### Dataverhoudingen
```
~/.claude/registry/*.json  (BRON: 230+ items, 7 JSON bestanden)
         |
         | (ONTBREEKT: sync script)
         v
POST /api/sync             (BESTAAT: API route in CC v2)
         |
         v
Supabase registry_items    (LEEG/INCOMPLEET)
         |
         v
CC v2 Dashboard             (TOONT NIETS want geen data)
```

---

## Task 1: Bouw het sync-script

**Doel:** Een standalone Node.js script dat alle `~/.claude/registry/*.json` bestanden leest en naar de CC v2 sync API pusht.

**Files:**
- Create: `command-center-app/scripts/sync-registry.mjs`

**Step 1: Maak het sync-script**

```javascript
#!/usr/bin/env node
// sync-registry.mjs - Sync ~/.claude/registry/ naar CC v2 Supabase via /api/sync

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Config
const REGISTRY_DIR = join(homedir(), '.claude', 'registry')
const API_BASE = process.env.CC_API_URL || 'https://command-center-app-nine.vercel.app'
const API_KEY = process.env.SYNC_API_KEY

// Type mapping: filename -> API type
const TYPE_MAP = {
  'agents.json': 'agent',
  'commands.json': 'command',
  'skills.json': 'skill',
  'prompts.json': 'prompt',
  'apis.json': 'api',
  'instructions.json': 'instruction',
}

async function syncType(filename, type) {
  const filePath = join(REGISTRY_DIR, filename)

  let data
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error(`  [SKIP] ${filename}: ${err.message}`)
    return { type, status: 'skipped', reason: err.message }
  }

  const items = data.items || []
  if (items.length === 0) {
    console.log(`  [SKIP] ${filename}: 0 items`)
    return { type, status: 'skipped', reason: 'no items' }
  }

  // Flatten commands with subcommands into individual items
  let flatItems = items
  if (type === 'command') {
    flatItems = []
    for (const item of items) {
      flatItems.push(item)
      if (item.subcommands && Array.isArray(item.subcommands)) {
        for (const sub of item.subcommands) {
          flatItems.push({
            ...sub,
            project: sub.project || item.project,
            tags: sub.tags || item.tags,
          })
        }
      }
    }
  }

  const response = await fetch(`${API_BASE}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ type, items: flatItems }),
  })

  const result = await response.json()

  if (response.ok) {
    console.log(`  [OK]   ${type}: ${result.count} items synced, ${result.changelog} changelog entries`)
    return { type, status: 'ok', count: result.count }
  } else {
    console.error(`  [FAIL] ${type}: ${result.error}`)
    return { type, status: 'error', error: result.error }
  }
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: SYNC_API_KEY environment variable is required')
    console.error('Set it: export SYNC_API_KEY="your-key-here"')
    process.exit(1)
  }

  console.log(`\nSync Registry -> CC v2`)
  console.log(`Source: ${REGISTRY_DIR}`)
  console.log(`Target: ${API_BASE}/api/sync`)
  console.log(`---`)

  // Verify registry dir exists
  let files
  try {
    files = readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.json'))
  } catch (err) {
    console.error(`ERROR: Cannot read ${REGISTRY_DIR}: ${err.message}`)
    process.exit(1)
  }

  const results = []

  for (const filename of files) {
    const type = TYPE_MAP[filename]
    if (!type) {
      console.log(`  [SKIP] ${filename}: unknown type`)
      continue
    }
    const result = await syncType(filename, type)
    results.push(result)
  }

  // Summary
  console.log(`\n--- Summary ---`)
  const ok = results.filter(r => r.status === 'ok')
  const failed = results.filter(r => r.status === 'error')
  const skipped = results.filter(r => r.status === 'skipped')
  const totalItems = ok.reduce((sum, r) => sum + (r.count || 0), 0)

  console.log(`Synced: ${ok.length} types, ${totalItems} total items`)
  if (skipped.length) console.log(`Skipped: ${skipped.length} types`)
  if (failed.length) console.log(`Failed: ${failed.length} types`)

  process.exit(failed.length > 0 ? 1 : 0)
}

main()
```

**Step 2: Test het script lokaal**

Run:
```bash
cd command-center-app
SYNC_API_KEY="<key>" node scripts/sync-registry.mjs
```

Expected: Alle 6 types worden gesynced, 230+ items totaal.

**Step 3: Verifieer data in Supabase**

Run:
```bash
curl -s "https://command-center-app-nine.vercel.app/api/sync" | jq '.stats'
```

Expected:
```json
{
  "api": 2,
  "prompt": 1,
  "skill": 2,
  "agent": 18,
  "command": 200,
  "instruction": 5
}
```

**Step 4: Commit**

```bash
git add command-center-app/scripts/sync-registry.mjs
git commit -m "feat: add registry sync script for ~/.claude/ -> Supabase"
```

---

## Task 2: Maak een Claude Code command `/sync-cc`

**Doel:** Shadow kan vanuit elke Claude Code sessie `/sync-cc` typen om de sync te triggeren.

**Files:**
- Create: `~/.claude/commands/sync-cc.md`

**Step 1: Schrijf het command**

```markdown
---
name: sync-cc
description: Synchroniseer ~/.claude/registry/ naar Command Center v2 Supabase
user-invocable: true
category: command-center
allowed-tools: Bash(*)
---

# Sync naar Command Center

Synchroniseer alle registry data van ~/.claude/registry/ naar de Command Center v2 Supabase database.

## Instructies

1. **Lees de SYNC_API_KEY** uit het .env bestand van het CC v2 project:
   ```
   Lees: ~/Projects/command-center-v2/command-center-app/.env.local
   Zoek de waarde van SYNC_API_KEY
   ```

2. **Voer het sync script uit:**
   ```bash
   cd ~/Projects/command-center-v2/command-center-app
   SYNC_API_KEY="<key>" node scripts/sync-registry.mjs
   ```

3. **Rapporteer het resultaat** aan de gebruiker:
   - Hoeveel types gesynced
   - Hoeveel items totaal
   - Eventuele errors

4. **Verifieer** door de sync status op te halen:
   ```bash
   curl -s "https://command-center-app-nine.vercel.app/api/sync" | python -m json.tool
   ```

5. **Log de activiteit** (optioneel):
   Meld dat de sync is uitgevoerd en wanneer.
```

**Step 2: Verifieer dat het command geladen wordt**

Start een nieuwe Claude Code sessie en type `/sync-cc`. Het command moet beschikbaar zijn.

**Step 3: Commit**

```bash
git add ~/.claude/commands/sync-cc.md
# (Wordt niet in git gecommit - dit is een ~/.claude/ bestand)
```

> **Note:** Dit bestand leeft buiten de repo in `~/.claude/commands/`. Geen git commit nodig.

---

## Task 3: Fix command flattening in sync API

**Doel:** De commands.json heeft een hiërarchische structuur met `subcommands`. De huidige sync API slaat metadata op maar toont geen subcommands als aparte items. Het sync-script handelt dit af, maar we moeten verifiëren dat het correct werkt.

**Files:**
- Read: `~/.claude/registry/commands.json` (bekijk structuur)
- Modify: `command-center-app/scripts/sync-registry.mjs` (indien nodig)

**Step 1: Analyseer de commands.json structuur**

Lees `~/.claude/registry/commands.json` en bekijk:
- Hoeveel top-level commands zijn er?
- Hebben ze `subcommands` arrays?
- Wat is het verwachte totaal na flattening?

**Step 2: Test de flattening**

Run het sync script met alleen commands:
```bash
SYNC_API_KEY="<key>" node -e "
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const data = JSON.parse(readFileSync(join(homedir(), '.claude', 'registry', 'commands.json'), 'utf-8'));
let total = 0;
for (const item of data.items) {
  total++;
  if (item.subcommands) total += item.subcommands.length;
}
console.log('Top-level:', data.items.length);
console.log('With subcommands:', total);
"
```

**Step 3: Verifieer na sync**

Check dat het aantal commands in Supabase overeenkomt met het verwachte totaal.

**Step 4: Fix eventuele issues**

Als de flattening niet correct werkt, pas het sync-script aan.

---

## Task 4: Initiële volledige sync uitvoeren

**Doel:** Eenmalig alle 230+ assets syncen naar Supabase zodat CC v2 dashboard werkende data heeft.

**Files:**
- Run: `command-center-app/scripts/sync-registry.mjs`

**Step 1: Backup huidige Supabase data**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/sync" | jq '.' > /tmp/cc-sync-before.json
cat /tmp/cc-sync-before.json
```

**Step 2: Voer volledige sync uit**

```bash
cd ~/Projects/command-center-v2/command-center-app
SYNC_API_KEY="<key>" node scripts/sync-registry.mjs
```

Expected output:
```
Sync Registry -> CC v2
Source: C:\Users\Shadow\.claude\registry
Target: https://command-center-app-nine.vercel.app/api/sync
---
  [OK]   agent: 18 items synced, X changelog entries
  [OK]   command: 200+ items synced, X changelog entries
  [OK]   skill: 2 items synced, X changelog entries
  [OK]   prompt: 1 items synced, X changelog entries
  [OK]   api: 2 items synced, X changelog entries
  [OK]   instruction: 5 items synced, X changelog entries

--- Summary ---
Synced: 6 types, 228+ total items
```

**Step 3: Verifieer via dashboard**

Open https://command-center-app-nine.vercel.app en controleer:
- [ ] Homepage toont correcte stat card aantallen
- [ ] Registry pagina toont alle asset types
- [ ] Project cards verschijnen met correcte item counts
- [ ] Recent changes toont de sync changelog entries
- [ ] Zoek (Cmd+K) vindt assets

**Step 4: Verifieer via API**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/sync" | jq '.stats'
```

---

## Task 5: Voeg npm script toe voor sync

**Doel:** Maak sync beschikbaar als `npm run sync` in het CC v2 project.

**Files:**
- Modify: `command-center-app/package.json`

**Step 1: Voeg script toe aan package.json**

Voeg toe aan `"scripts"`:
```json
{
  "sync": "node scripts/sync-registry.mjs"
}
```

**Step 2: Test**

```bash
cd command-center-app
SYNC_API_KEY="<key>" npm run sync
```

**Step 3: Commit**

```bash
git add command-center-app/package.json command-center-app/scripts/sync-registry.mjs
git commit -m "feat: add registry sync script and npm run sync command"
```

---

## Task 6: Maak sync automatisch via Claude Code hook

**Doel:** Na elke `/save-to-cc` aanroep automatisch een sync triggeren zodat CC v2 altijd up-to-date is.

**Files:**
- Create: `~/.claude/hooks/post-save-sync.sh` (of integreer in bestaande hookify config)

**Step 1: Onderzoek hookify integratie**

De 6 hookify bestanden (`hookify.command-center-*.local.md`) detecteren al asset-creatie. Bekijk of we een hook kunnen toevoegen die na `/save-to-cc` automatisch het sync-script aanroept.

**Step 2: Optie A - Claude Code settings.json hook**

Voeg een hook toe aan `~/.claude/settings.json` of `settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "node ~/Projects/command-center-v2/command-center-app/scripts/sync-registry.mjs",
        "condition": "path.includes('.claude/registry/')"
      }
    ]
  }
}
```

> **Note:** Exacte hook syntax afhankelijk van Claude Code hook API. Verifieer de documentatie.

**Step 2: Optie B - Hookify regel**

Update de hookify bestanden zodat ze na detectie van een asset niet alleen waarschuwen, maar ook syncen.

**Step 3: Test de automatisering**

1. Maak een test-asset aan via `/save-to-cc`
2. Controleer of het sync-script automatisch draait
3. Verifieer dat CC v2 dashboard de nieuwe asset toont

**Step 4: Documenteer de hook**

Voeg uitleg toe aan de `/sync-cc` command over de automatisering.

---

## Task 7: Populeer Serena memories voor key projects

**Doel:** Serena memories invullen voor de belangrijkste projecten zodat Claude code-context heeft bij project-switching.

**Files:**
- Create: `.serena/memories/` bestanden voor key projects

**Step 1: Maak CC v2 project memory aan**

Gebruik Serena's `write_memory` tool:

```
Memory: "architecture"
Content:
# Command Center v2 Architecture

## Tech Stack
- Next.js 14 (App Router, Server Components)
- Supabase (PostgreSQL) - project ID: ikpmlhmbooaxfrlpzcfa
- Tailwind CSS v4 (zinc-only palette)
- @dnd-kit (drag-drop), Framer Motion (animations)

## Data Flow
~/.claude/registry/*.json -> POST /api/sync -> Supabase -> Dashboard pages

## Key Directories
- app/(dashboard)/ - Pages (home, registry, tasks, activity, settings)
- app/api/ - API routes (sync, tasks, search, activity)
- components/ - React components per feature area
- lib/ - Server-side Supabase queries

## Conventions
- Server Components by default
- 'use client' only for interactive UI
- Supabase queries use SERVICE_ROLE_KEY (bypass RLS)
- API routes auth via x-api-key header
```

**Step 2: Maak een "sync-system" memory**

```
Memory: "sync-system"
Content:
# Sync System

## Flow
1. /save-to-cc command saves asset to ~/.claude/ (file + registry JSON)
2. sync-registry.mjs reads all registry/*.json files
3. POST /api/sync sends items per type to Supabase
4. API deletes existing items of that type, inserts new ones
5. Changelog entries auto-generated per project

## API Key
Auth via x-api-key header with SYNC_API_KEY env var

## Commands
- /sync-cc: Manual sync trigger
- /save-to-cc: Save individual asset to local registry
- npm run sync: Run sync script from CC v2 project
```

**Step 3: Verifieer memories**

```
list_memories() -> should show "architecture", "sync-system"
read_memory("architecture") -> should return the content
```

---

## Task 8: Documenteer de drie-systeem architectuur

**Doel:** Een duidelijk overzicht dat beschrijft hoe CC v2, Serena en Claude CLI samenwerken.

**Files:**
- Modify: `command-center-app/src/app/(dashboard)/page.tsx` (optioneel: sync status indicator)
- Update: Project CLAUDE.md

**Step 1: Update CLAUDE.md met systeemrollen**

Voeg toe aan het bestaande `CLAUDE.md` van het CC v2 project:

```markdown
## Systeemrollen

### Claude CLI (runtime)
- Produceert en gebruikt assets (agents, commands, skills, etc.)
- Data: ~/.claude/registry/*.json (source of truth)
- Trigger: /save-to-cc slaat nieuw asset op

### Command Center v2 (dashboard)
- Visueel overzicht van alle assets, projecten, taken
- Data: Supabase (mirror van ~/.claude/registry/)
- Sync: /sync-cc of npm run sync

### Serena (code intelligence)
- Code navigatie, symbol search, project memories
- Data: .serena/project.yml + .serena/memories/
- Geen directe relatie met CC v2 data
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document three-system architecture (CLI + CC v2 + Serena)"
```

---

## Samenvatting

| Task | Wat | Impact | Effort |
|------|-----|--------|--------|
| 1 | Sync script bouwen | CC v2 gaat werkende data tonen | Medium |
| 2 | /sync-cc command | Easy trigger vanuit Claude Code | Klein |
| 3 | Command flattening testen | Correcte command counts | Klein |
| 4 | Initiële volledige sync | Dashboard gaat leven | Klein |
| 5 | npm run sync | Developer convenience | Trivial |
| 6 | Auto-sync hook | Zero-effort sync na /save-to-cc | Medium |
| 7 | Serena memories | Claude krijgt project-context | Klein |
| 8 | Architectuur documentatie | Duidelijkheid voor toekomst | Klein |

### Wat we NIET doen (bewust)
- CC v2 features verwijderen (het is al read-mostly, niks te schrappen)
- Serena integreren in CC v2 UI (te complex, geen meerwaarde)
- Real-time sync (overkill, periodieke sync is voldoende)
- CC v2 taken in Serena tonen (Serena is voor code, niet voor taakbeheer)
- Nieuwe CC v2 features bouwen (eerst werkend maken wat er is)
