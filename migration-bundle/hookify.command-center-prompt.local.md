---
name: command-center-prompt-trigger
enabled: true
event: file
action: warn
conditions:
  - field: content
    operator: regex_match
    pattern: (You are a|Je bent een|role:\s*["']?system|<instructions>|## Instructions|<system>|system_prompt|systemPrompt)
---

[PROMPT] **Prompt Template Gedetecteerd**

Je hebt mogelijk een herbruikbare prompt aangemaakt. Overweeg om deze op te slaan in je Command Center:

**Opslaan?** Vraag: "Wil je deze prompt opslaan in Command Center?"

**Locatie:** ~/.claude/prompts/[type]/[naam].md

**Registry:** ~/.claude/registry/prompts.json
