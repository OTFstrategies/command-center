# Shadow Huisstijl - Design System

## Kernprincipes

1. **Minimalistisch** - Geen overbodige elementen. Elk pixel heeft een doel.
2. **Monochroom** - Zinc palette (Tailwind). GEEN accent kleuren. Alleen zeer subtiele kleurhint bij states.
3. **Apple-achtig** - Premium, verfijnd, clean. Denk apple.com.
4. **Wow via beweging** - Indruk maken met vloeiende animaties, niet met kleur of drukte.
5. **Glassmorphism** - Frosted glass effecten voor depth en layering.
6. **Monochrome glow** - Witte/grijze glow-on-hover, NOOIT gekleurd.

---

## Kleuren

### REGEL: Geen accent kleuren. Nooit.
- Gebruik ALLEEN de zinc scale (zinc-50 t/m zinc-950)
- GEEN blauw, groen, paars, of welke kleur dan ook als accent
- Focus rings: zinc-400/30 (NIET blauw)
- Active states: zinc-900 (light) / zinc-200 (dark)
- Hover states: zinc-100 (light) / zinc-800 (dark)

### Uitzondering: Feedback states
Alleen voor success/error/warning mag je ZEER subtiele kleur gebruiken:
- Success: `var(--state-success-bg)` (6-8% opacity groen achtergrond) + zinc tekst + checkmark icoon
- Error: `var(--state-error-bg)` (6-8% opacity rood achtergrond) + zinc tekst + X icoon
- Warning: `var(--state-warning-bg)` (6-8% opacity amber achtergrond) + zinc tekst + alert icoon
- Info: zinc-100 achtergrond (geen kleur) + zinc tekst + info icoon
- Destructive buttons: red-600 (light) / red-400 (dark) - alleen voor delete/destroy acties

### Warm Stone Accent (secundair)
Warm stone (#CBC4B5) is een optionele secundaire kleur, ALTIJD ondergeschikt aan zinc:
- **Hierarchie:** zinc > warm stone (zinc is ALTIJD primair)
- **Gebruik:** decoratief, brand identity, Gantt task bars, subtiele accenten
- **NIET voor:** buttons, focus rings, primary actions, tekst
- **Tokens:** `--warm-stone-50` t/m `--warm-stone-900` (light + dark variants)
- **Projecten:** Alleen veha-app gebruikt warm stone actief

### Uitzondering: Data visualisatie
Charts gebruiken de zinc scale (chart-1 t/m chart-5). Geen kleur.

---

## Typografie

| Element | Font | Weight | Tracking |
|---------|------|--------|----------|
| h1-h6 | DM Sans (`--font-display`) | 600 (semibold) | tight (-0.02em) |
| Body | Inter (`--font-sans`) | 400 (regular) | normal |
| Buttons | Inter | 500 (medium) | normal |
| Code/pre/kbd | JetBrains Mono (`--font-mono`) | 400 | normal |
| Labels (uppercase) | Inter | 500 | widest |

### Font Loading
Voeg toe aan `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

---

## Spacing

Gebruik Tailwind's standaard spacing scale (4px grid):
- Kleine gaps: `gap-2` (8px), `gap-3` (12px)
- Standaard gaps: `gap-4` (16px)
- Section gaps: `gap-8` (32px), `gap-12` (48px)
- Page padding: `p-4` (mobile), `p-8 lg:p-12` (desktop)
- Max content width: `max-w-4xl` (896px)

---

## Borders & Radius

- Border radius: `--radius: 0.5rem` (rounded-lg max)
- Cards: `rounded-xl` (0.75rem)
- Buttons: `rounded-md` (0.375rem)
- Inputs: `rounded-md`
- Badges: `rounded-full`
- Borders: `border border-border` (zinc-200 light / zinc-800 dark)

---

## Shadows

Zeer subtiel. Geen overdreven drop shadows.
- Cards: `shadow-sm` of geen shadow
- Elevated: `shadow-md`
- Nooit `shadow-lg` of groter op standaard elementen

---

## Glassmorphism

Gebruik de `.glass` CSS utilities:
- `.glass` - Standaard glasmorphism (sidebar, modals)
- `.glass-subtle` - Subtiel (hover overlays)
- `.glass-strong` - Sterk (hero sections, feature cards)

```tsx
// Voorbeeld: Glass card
<div className="glass rounded-xl p-6 glow-hover">
  <h3>Card titel</h3>
</div>
```

---

## Glow Effecten

Monochrome glow. NOOIT gekleurd.
- `.glow` - Subtiele permanente glow
- `.glow-hover` - Glow verschijnt bij hover
- `.glow-strong` - Sterke glow (hero elementen)
- `.text-glow` - Tekst glow bij hover

---

## Animaties

### Framer Motion (voor React components)
Gebruik voor: hover/tap, presence, drag, component transitions.

**Spring presets:**
| Preset | Gebruik | Stiffness/Damping |
|--------|---------|-------------------|
| `springs.snappy` | Buttons, toggles | 500/30 |
| `springs.smooth` | Dialogs, panels (DEFAULT) | 300/25 |
| `springs.bouncy` | Toasts, notifications | 400/15 |
| `springs.gentle` | Hover states | 200/20 |

**Button pattern:**
```tsx
<motion.button
  whileHover={{ scale: 1.02, transition: springs.gentle }}
  whileTap={{ scale: 0.97, transition: springs.snappy }}
>
```

**Card pattern:**
```tsx
<MotionCard className="rounded-xl border border-border p-4 glass glow-hover">
  {content}
</MotionCard>
```

**List stagger pattern:**
```tsx
<MotionList>
  {items.map(item => (
    <MotionListItem key={item.id}>{item.name}</MotionListItem>
  ))}
</MotionList>
```

### GSAP (voor complexe animaties)
Gebruik voor: scroll-driven, timelines, sequences, precision control.

**Hooks:**
- `useFadeIn()` - Fade in on mount
- `useSlideInUp()` - Slide up on mount
- `useStaggerChildren()` - Stagger children on mount
- `usePageTransition()` - Page entry animation
- `useHoverScale(1.02)` - Scale on hover
- `useTapScale(0.97)` - Scale on tap

### CSS Animations (framework-agnostic)
- `.animate-fade-in` - 200ms fade in
- `.animate-slide-up` - 200ms slide up
- `.animate-slide-in-right` - 300ms slide in from right
- `.animate-glow-pulse` - 3s subtle glow pulse (infinite)

---

## Components

### Basis: shadcn/ui New York
Installeer shadcn/ui met de `components.json` uit het design system.
Alle kleuren zijn al monochroom via de CSS tokens.

### Extra componenten:
Gebruik glassmorphism + glow combinaties:

**Glass Card:**
```tsx
<Card className="glass glow-hover">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

**Glass Sidebar:**
```tsx
<aside className="glass-strong fixed inset-y-0 left-0 w-64">
  <nav>...</nav>
</aside>
```

---

## Responsive

Mobile-first. Tailwind breakpoints:
- Default: mobile (<768px)
- `md:` tablet (>=768px)
- `lg:` desktop (>=1024px)
- `xl:` large desktop (>=1280px)

Layout tokens:
- Sidebar: 16rem (256px) desktop, 4rem (64px) collapsed, hidden mobile
- Header: 4rem (64px)
- Max content: 56rem (896px) = `max-w-4xl`

---

## Dark Mode

Class-based: `.dark` op `<html>`.
Toggle via localStorage. Alle tokens hebben dark variants.

---

## Do's & Don'ts

### DO:
- Zinc voor alles
- Glass effecten voor depth
- Spring animaties voor interactie
- Subtiele glow op hover
- DM Sans voor headings
- `max-w-4xl` voor content

### DON'T:
- Gekleurde accenten (NOOIT blauw, groen, paars)
- Gekleurde glow (ALTIJD wit/grijs)
- Grote shadows (`shadow-xl`, `shadow-2xl`)
- Flashy animaties (bouncing logos, spinning icons)
- Decoratieve elementen zonder functie
- Meer dan 600 font-weight op body text

---

## Setup Checklist Nieuw Project

1. Voeg font loading toe aan `<head>` (zie Typografie sectie)
2. Kopieer `tokens/index.css` inhoud naar je project's `src/index.css` (na `@import "tailwindcss"`)
3. Kopieer `components.json` naar project root
4. Kopieer `lib/utils.ts` naar `src/lib/utils.ts`
5. Kopieer `animations/` folder naar `src/lib/motion/`
6. Installeer dependencies:
   ```bash
   npm install framer-motion gsap @gsap/react clsx tailwind-merge class-variance-authority
   npm install -D @tailwindcss/postcss
   ```
7. Installeer shadcn components: `npx shadcn@latest add button card input label badge`
8. Verify: geen blauw in je CSS (`grep -i blue src/`)

---

## Design System Locatie

```
~/.claude/design-system/
├── HUISSTIJL.md              ← Dit bestand (AI agent instructies)
├── tokens/
│   ├── index.css             ← Importeer dit in je project
│   ├── colors.css            ← Monochrome zinc tokens
│   ├── typography.css        ← Font definities
│   ├── glass.css             ← Glassmorphism + glow
│   └── animations.css        ← CSS keyframe animaties
├── animations/
│   ├── index.ts              ← Barrel export
│   ├── framer-config.ts      ← Spring presets
│   ├── framer-variants.ts    ← Animation variants
│   ├── framer-components.tsx ← Motion components
│   ├── gsap-config.ts        ← GSAP helpers
│   └── gsap-hooks.ts         ← GSAP React hooks
├── components/
│   └── components.json       ← shadcn/ui config
└── lib/
    └── utils.ts              ← cn() utility
```
