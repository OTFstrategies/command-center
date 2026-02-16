---
name: veha-build
description: Build alle VEHA projecten en rapporteer resultaten
user_invocable: true
---

# VEHA Build — Alle Projecten

Voert `npm run build` uit voor alle 4 VEHA projecten en rapporteert de resultaten.

## Instructies

1. Lees `C:\Users\Shadow\Projects\veha-hub\veha-projects.json`
2. Voor elk project (sequentieel om resource conflicts te voorkomen):
   - Voer `npm run build` uit in de project directory
   - Capture exit code en output
   - Noteer build tijd indien mogelijk
3. Presenteer resultaten in tabel:

| Project | Status | Errors | Waarschuwingen |
|---------|--------|--------|----------------|

4. Bij failures: toon de eerste error output per project
5. Geef een samenvatting: "X/4 projecten builden succesvol"
