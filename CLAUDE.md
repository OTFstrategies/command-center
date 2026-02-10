# Command Center v2

## Project

Centraal command center dashboard.

## Tech Stack

- **Framework:** Vite + React
- **Styling:** Tailwind CSS v4, Shadow Huisstijl design system
- **UI:** shadcn/ui (New York style), Framer Motion, GSAP
- **Fonts:** DM Sans (headings), Inter (body), JetBrains Mono (code) via Google Fonts link

## Design System

Shadow Huisstijl is toegepast:
- ALLEEN zinc palette (geen accent kleuren)
- Glassmorphism + monochrome glow
- Bron: `~/.claude/design-system/HUISSTIJL.md`

## Directory Structuur

```
src/
  index.css      # Huisstijl tokens + glass/glow
  lib/
    utils.ts     # cn() utility
    motion/      # Framer Motion + GSAP presets
  components/
    ui/          # shadcn/ui componenten
index.html       # Google Fonts loading
```
