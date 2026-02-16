---
name: security-status
description: Toon quick security dashboard met score en openstaande issues
user_invocable: true
---

# /security-status

Toon een snel security overzicht.

## Wat het doet
1. Leest `~/.claude/security/scan-results/latest.json`
2. Vergelijkt met vorige 5 scans uit history/
3. Toont:
   - Huidige Security Score
   - Score trend (stijgend/dalend/stabiel)
   - Openstaande CRITICAL/HIGH items
   - Laatste scan datum
   - Aanbevolen volgende actie

## Output
```
=== Security Status ===
Score: [XX]/100 [up/down/stable]
Laatste scan: [datum]

Openstaand:
  CRITICAL: [n]
  HIGH: [n]

Aanbevolen: [actie]
```
