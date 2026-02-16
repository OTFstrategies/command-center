---
name: security-code
description: Statische code analyse (SAST) met Semgrep
user_invocable: true
---

# /security-code

Voer statische code analyse uit met Semgrep.

## Wat het doet
1. Draait semgrep met auto regels: `semgrep --config auto`
2. Draait semgrep met custom regels: `semgrep --config config/semgrep-rules.yml`
3. Groepeert bevindingen per categorie:
   - Injection (SQL, XSS, command)
   - Authentication & Authorization
   - Data Exposure (secrets, PII)
   - Configuration (headers, CORS)
4. Legt per bevinding uit in simpel Nederlands wat het risico is
