---
name: security-database
description: Audit Supabase database beveiliging (RLS, policies, advisors)
user_invocable: true
---

# /security-database

Audit de beveiliging van Supabase projecten.

## Wat het doet
Per geconfigureerd Supabase project:
1. Draait `get_advisors(type="security")` via Supabase MCP
2. Voert SQL uit: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'`
3. Controleert of elke tabel RLS enabled heeft
4. Controleert of er permissieve policies zijn (met `using(true)`)
5. Presenteert resultaten in tabel per project

## Output
| Project | Tabel | RLS | Policies | Status |
|---------|-------|-----|----------|--------|
| naam | tabel | ON/OFF | [n] | OK/WARN/CRITICAL |

## BELANGRIJK
- Gebruik Supabase MCP tools als beschikbaar
- Als MCP niet beschikbaar: geef instructies voor handmatige check
