---
name: veha-status
description: Toon status dashboard van alle VEHA projecten
user_invocable: true
---

# VEHA Status Dashboard

Lees het project registry bestand en toon een overzicht van alle VEHA projecten.

## Instructies

1. Lees `C:\Users\Shadow\Projects\veha-hub\veha-projects.json`
2. Voor elk project in het registry:
   - Toon project naam en framework
   - Toon huisstijl status
   - Voer `git log --oneline -1` uit in de project directory voor laatste commit
   - Voer `npm run build --dry-run 2>&1 | head -1` uit om build status te checken
3. Presenteer resultaten in een overzichtelijke tabel:

| Project | Framework | Huisstijl | Laatste Commit | Build |
|---------|-----------|-----------|---------------|-------|

4. Toon eventuele waarschuwingen of aanbevelingen
