---
name: save-to-cc
description: Sla het huidige item op in Command Center
user-invocable: true
category: command-center
---

# Save to Command Center

Analyseer wat er zojuist is aangemaakt of besproken en sla het op in het Command Center.

## Instructies

1. **Analyseer de context** - Bekijk de laatste berichten en tool calls om te bepalen wat er is aangemaakt:
   - Was het een API configuratie?
   - Was het een prompt template?
   - Was het een skill/workflow?
   - Was het een agent definitie?
   - Was het een slash command?
   - Was het een instructie set?

2. **Vraag om bevestiging** - Gebruik AskUserQuestion:
   ```
   Ik heb gedetecteerd: [TYPE] "[NAAM]"

   Beschrijving: [korte beschrijving]

   Klopt dit? Zo niet, wat wil je opslaan?
   ```

3. **Bepaal de locatie** op basis van type:
   | Type | Locatie |
   |------|---------|
   | API | `~/.claude/apis/[service]/config.md` |
   | Prompt | `~/.claude/prompts/[type]/[naam].md` |
   | Skill | `~/.claude/skills/[naam]/SKILL.md` |
   | Agent | `~/.claude/agents/[naam]/agent.md` |
   | Command | `~/.claude/commands/[naam].md` |
   | Instruction | `~/.claude/instructions/[scope]/[naam].md` |

4. **Sla het bestand op** in de juiste locatie

5. **Update de registry** (`~/.claude/registry/[type]s.json`):
   ```json
   {
     "id": "uniek-id",
     "name": "Naam",
     "path": "relatief/pad",
     "description": "Beschrijving",
     "created": "YYYY-MM-DD",
     "project": "project-naam of global",
     "tags": ["tag1", "tag2"]
   }
   ```

6. **Bevestig** met een samenvatting:
   ```
   Opgeslagen in Command Center:

   | Veld | Waarde |
   |------|--------|
   | Type | [TYPE] |
   | Naam | [NAAM] |
   | Pad | [PAD] |
   | Registry | [REGISTRY_FILE] |
   ```

## Voorbeelden

**Gebruiker:** `/save-to-cc`
**Na het maken van een API config:**
→ Detecteert API configuratie, vraagt bevestiging, slaat op in `~/.claude/apis/`

**Gebruiker:** `/save-to-cc deze prompt`
**Na het schrijven van een system prompt:**
→ Detecteert prompt, vraagt om naam, slaat op in `~/.claude/prompts/`

## Tags
command-center, save, registry, opslag
