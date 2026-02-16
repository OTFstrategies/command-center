---
name: connect-project
description: Connect een project folder aan Command Center
---

# /connect-project

Scant de huidige project folder en registreert alle Claude assets in Command Center.

## Gebruik

```
/connect-project [project-naam]
```

Als geen project-naam gegeven, wordt de folder naam of `name` uit package.json gebruikt.

## Wat het doet

1. **Detecteert project naam**
   - Parameter > package.json name > folder naam

2. **Scant voor Claude assets**
   - `CLAUDE.md` → instruction
   - `.claude/commands/*.md` → commands
   - `.claude/skills/*.md` → skills
   - `.claude/prompts/*.md` → prompts
   - `.claude/agents/*.md` → agents
   - `.claude/hooks/` → hooks

3. **Registreert in Command Center**
   - Voegt items toe aan `~/.claude/registry/[type].json`
   - Genereert unieke IDs per item
   - Slaat metadata op (path, project, tags, created)

4. **Synct naar Supabase**
   - Roept sync-cli aan om te uploaden naar cloud
   - Maakt changelog entry aan

## Voorbeeld Output

```
🔍 Scanning project: agent-os

Found assets:
┌─────────────┬───────────────────────────────────┐
│ Type        │ Items                             │
├─────────────┼───────────────────────────────────┤
│ Instructions│ CLAUDE.md                         │
│ Commands    │ design-os, agent-os, miro-start   │
│ Skills      │ spec-writer, task-creator         │
│ Agents      │ spec-shaper, implementer          │
└─────────────┴───────────────────────────────────┘

✅ Registered 8 items for project "agent-os"
🔄 Syncing to Command Center...
✅ Sync complete!
```

## Instructies voor Claude

Wanneer de gebruiker `/connect-project` uitvoert:

1. **Bepaal project naam**
   ```
   - Check of parameter gegeven is
   - Anders: lees package.json voor "name"
   - Anders: gebruik folder naam van cwd
   ```

2. **Scan de project folder**
   ```
   - Check of CLAUDE.md bestaat → type: instruction
   - Glob .claude/commands/**/*.md → type: command
   - Glob .claude/skills/**/*.md → type: skill
   - Glob .claude/prompts/**/*.md → type: prompt
   - Glob .claude/agents/**/*.md → type: agent
   ```

3. **Voor elk gevonden bestand**
   ```
   - Parse frontmatter voor name/description
   - Genereer UUID
   - Bepaal relatief pad
   - Voeg toe aan juiste registry bestand
   ```

4. **Update registry bestanden**
   ```
   Locatie: ~/.claude/registry/[type].json

   Per item:
   {
     "id": "uuid",
     "name": "item-naam",
     "path": "relatief/pad.md",
     "description": "uit frontmatter",
     "project": "project-naam",
     "tags": [],
     "created": "ISO date"
   }
   ```

5. **Trigger sync**
   ```
   Run: cd ~/.claude && npx tsx sync-cli/sync.ts
   Of: roep /api/sync aan met de items
   ```

6. **Toon resultaat**
   - Tabel met gevonden items per type
   - Bevestiging van registratie
   - Sync status

## Bestaande Items

Als een item al bestaat (zelfde path):
- Update de bestaande entry
- Behoud de originele ID
- Update `updated` timestamp

## Foutafhandeling

- Geen assets gevonden → "No Claude assets found in this project"
- Registry niet schrijfbaar → Toon error met instructies
- Sync faalt → "Registered locally, sync failed: [error]"
