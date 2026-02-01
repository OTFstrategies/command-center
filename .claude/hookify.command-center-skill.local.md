---
name: command-center-skill-trigger
enabled: true
event: file
action: warn
conditions:
  - field: content
    operator: regex_match
    pattern: (SKILL\.md|skill:|## Stappen|## Steps|Stap 1:|Step 1:|workflow:|procedure:)
---

[SKILL] **Skill Definitie Gedetecteerd**

Je hebt mogelijk een herbruikbare skill/workflow aangemaakt. Overweeg om deze op te slaan in je Command Center:

**Opslaan?** Vraag: "Wil je deze skill opslaan in Command Center?"

**Locatie:** ~/.claude/skills/[naam]/

**Registry:** ~/.claude/registry/skills.json
