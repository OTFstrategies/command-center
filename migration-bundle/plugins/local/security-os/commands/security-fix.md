---
name: security-fix
description: Fix automatisch oplosbare beveiligingsproblemen
user_invocable: true
---

# /security-fix

Fix automatisch oplosbare beveiligingsproblemen.

## Wat het doet
1. Leest `~/.claude/security/scan-results/latest.json`
2. Categoriseert items in: AUTO-FIX / HANDMATIG / VERBODEN
3. Toont fix-plan aan Shadow voor goedkeuring
4. Voert goedgekeurde fixes uit:
   - `npm audit fix` voor dependency patches
   - .gitignore aanvullen met ontbrekende patronen
   - Branch protection instellen waar het ontbreekt

## AUTO-FIX (mag zonder extra goedkeuring)
- npm audit fix (alleen patch versies)
- .gitignore updates
- Branch protection activeren

## HANDMATIG (altijd eerst aan Shadow tonen)
- npm audit fix --force (major versie upgrades)
- Semgrep fixes in code
- Dependabot PR's mergen

## VERBODEN (nooit automatisch)
- Secret rotatie
- RLS policy wijzigingen
- Database schema wijzigingen
- Code logic aanpassingen
