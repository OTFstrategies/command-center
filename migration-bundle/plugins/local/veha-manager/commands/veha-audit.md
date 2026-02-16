---
name: veha-audit
description: Cross-project huisstijl audit — scan op niet-compliant kleuren en ontbrekende utilities
user_invocable: true
---

# VEHA Audit — Huisstijl Compliance

Scant alle 4 VEHA projecten op huisstijl compliance.

## Instructies

1. Lees `C:\Users\Shadow\Projects\veha-hub\veha-projects.json`
2. Lees `C:\Users\Shadow\.claude\design-system\HUISSTIJL.md` voor de regels
3. Per project, scan `src/` directory:

### Kleur Audit
Zoek naar verboden kleuren in CSS en TSX bestanden:
- Blauw: `blue-`, `#3b82f6`, `#2563eb`, `#60a5fa`, `oklch(.*259)`, `oklch(.*254)`
- Paars: `purple-`, `violet-`, `indigo-`
- Groen accenten: `green-` (behalve in state-success variabelen)
- Andere accent kleuren: `sky-`, `teal-`, `orange-` (als accenten)

**Uitzonderingen (toegestaan):**
- veha-app: `--gantt-today-line: #3b82f6` en `--info: #3b82f6`
- State variabelen: `--state-success-*`, `--state-error-*`, `--state-warning-*`
- `--destructive` (red)

### Utility Audit
Per project, controleer aanwezigheid van:
- [ ] Glass utilities (`.glass`, `.glass-subtle`, `.glass-strong`)
- [ ] Glow utilities (`.glow`, `.glow-hover`, `.glow-strong`, `.text-glow`)
- [ ] Motion library (`src/lib/motion/` met 6 bestanden)
- [ ] cn() utility (`src/lib/utils.ts`)
- [ ] Fonts (DM Sans, Inter, JetBrains Mono)
- [ ] `components.json`

4. Rapporteer per project met compliance score (X/8 checks passed)
5. Geef specifieke locaties voor elke overtreding
