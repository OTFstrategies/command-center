---
name: command-center-api-trigger
enabled: true
event: file
action: warn
conditions:
  - field: content
    operator: regex_match
    pattern: (API_KEY|APIKEY|api_key|apiKey|sk-|pk_|secret_|Bearer\s|Authorization|X-API-Key|endpoint.*key|credentials)
---

[API] **API Configuratie Gedetecteerd**

Je hebt mogelijk een API configuratie aangemaakt. Overweeg om deze op te slaan in je Command Center:

**Opslaan?** Vraag: "Wil je deze API opslaan in Command Center?"

**Locatie:** ~/.claude/apis/[service]/config.md

**Registry:** ~/.claude/registry/apis.json
