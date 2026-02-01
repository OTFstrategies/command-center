---
name: command-center-command-trigger
enabled: true
event: file
action: warn
conditions:
  - field: content
    operator: regex_match
    pattern: (\/[a-z]+-[a-z]+|slash.?command|user.?invocable|command:|subcommands:)
---

[CMD] **Slash Command Gedetecteerd**

Je hebt mogelijk een nieuwe slash command aangemaakt. Overweeg om deze op te slaan in je Command Center:

**Opslaan?** Vraag: "Wil je deze command opslaan in Command Center?"

**Locatie:** ~/.claude/commands/[naam].md

**Registry:** ~/.claude/registry/commands.json
