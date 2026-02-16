---
name: veha-huisstijl
description: Pas Shadow Huisstijl toe op alle VEHA projecten
user_invocable: true
---

# VEHA Huisstijl Toepassing

Orcheseert de toepassing van Shadow's Huisstijl design system op alle VEHA projecten.

## Instructies

1. Lees `C:\Users\Shadow\Projects\veha-hub\veha-projects.json`
2. Lees `C:\Users\Shadow\.claude\design-system\HUISSTIJL.md` voor de regels
3. Voor elk project waar `huisstijlStatus` niet `"applied"` is:
   - Bepaal framework (nextjs vs vite)
   - Voer `/setup-huisstijl` uit met project-specifieke context:
     - **veha-app**: warm stone accent, behoud Gantt tokens en scrollbar CSS
     - **my-product**: Vite framework, heeft tw-animate-css
     - **command-center-v2**: Vite framework, minimale bestaande CSS
     - **veha-hub**: Next.js framework, vervang Geist fonts
4. Na elke toepassing: update `huisstijlStatus` → `"applied"` in registry
5. Rapporteer resultaten per project
