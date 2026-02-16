---
name: security-report
description: Genereer een compleet security compliance rapport
user_invocable: true
---

# /security-report

Genereer een compliance rapport op basis van de laatste scan resultaten.

## Wat het doet
1. Leest `~/.claude/security/scan-results/latest.json`
2. Genereert rapport met template uit `templates/report-template.md`
3. Bevat secties:
   - Executive Summary (score, aantallen)
   - Bevindingen per Laag (7 lagen)
   - OWASP Top 10 Status (A01-A10 mapping)
   - AVG/GDPR Basis Checklist
   - Trend Analyse (laatste 10 scans)
   - Actieplan (kritiek naar laag prioriteit)
4. Slaat op in `~/.claude/security/compliance/report-{datum}.md`
