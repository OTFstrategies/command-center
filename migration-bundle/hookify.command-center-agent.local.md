---
name: command-center-agent-trigger
enabled: true
event: file
action: warn
conditions:
  - field: content
    operator: regex_match
    pattern: (Deze agent|This agent|agent:|tools:\s*\[|heeft toegang tot|has access to|Agent definitie|subagent_type)
---

[AGENT] **Agent Definitie Gedetecteerd**

Je hebt mogelijk een agent definitie aangemaakt. Overweeg om deze op te slaan in je Command Center:

**Opslaan?** Vraag: "Wil je deze agent opslaan in Command Center?"

**Locatie:** ~/.claude/agents/[naam]/

**Registry:** ~/.claude/registry/agents.json
