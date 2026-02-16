---
name: security-scan
description: Voer een volledige beveiligingsscan uit op het huidige project of alle projecten
user_invocable: true
---

# /security-scan

Voer een volledige beveiligingsscan uit.

## Gebruik
- `/security-scan` -- scan het huidige project
- `/security-scan --all` -- scan alle geconfigureerde projecten

## Wat het doet
1. Leest configuratie uit `~/.claude/plugins/local/security-os/config/security-os.json`
2. Dispatcht 7 parallelle subagents via de Task tool:
   - secrets-scanner (gitleaks + ggshield)
   - deps-scanner (npm audit + snyk)
   - code-scanner (semgrep)
   - container-scanner (trivy)
   - db-scanner (Supabase RLS check)
   - access-scanner (GitHub branch protection)
   - storage-scanner (.gitignore + .env check)
3. Verzamelt resultaten en classificeert per severity (CRITICAL/HIGH/MEDIUM/LOW)
4. Berekent Security Score (0-100)
5. Slaat op in `~/.claude/security/scan-results/latest.json` + history/
6. Presenteert samenvatting in het Nederlands

## Score Berekening
- Start bij 100
- Per CRITICAL: -15 punten
- Per HIGH: -8 punten
- Per MEDIUM: -3 punten
- Per LOW: -1 punt
- Minimum: 0

## Output Format
```
=== Security Scan Resultaat ===
Score: [XX]/100
Datum: [timestamp]

CRITICAL: [n] items
HIGH: [n] items
MEDIUM: [n] items
LOW: [n] items

[Details per laag...]
```
