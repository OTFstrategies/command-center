---
name: command-center-instruction-trigger
enabled: true
event: file
action: warn
conditions:
  - field: content
    operator: regex_match
    pattern: (Coding Standards|Code Style|ALTIJD|NOOIT|Verplicht:|Required:|## Regels|## Rules|constraint:|workflow regel)
---

[INSTR] **Instructie Set Gedetecteerd**

Je hebt mogelijk project/workflow instructies aangemaakt. Overweeg om deze op te slaan in je Command Center:

**Opslaan?** Vraag: "Wil je deze instructies opslaan in Command Center?"

**Locatie:** ~/.claude/instructions/[scope]/[naam].md

**Registry:** ~/.claude/registry/instructions.json
