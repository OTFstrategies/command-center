---
name: security-deps
description: Scan dependencies op bekende kwetsbaarheden
user_invocable: true
---

# /security-deps

Scan project dependencies op kwetsbaarheden.

## Wat het doet
1. Draait `npm audit --json` (als package.json bestaat)
2. Draait `snyk test --json` (als snyk beschikbaar is)
3. Combineert resultaten en classificeert per severity
4. Toont top kwetsbaarheden met:
   - Package naam + versie
   - Kwetsbaarheid beschrijving
   - Fix-suggestie (npm audit fix of handmatige upgrade)
   - CVSS score indien beschikbaar
