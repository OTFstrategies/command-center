---
name: setup-huisstijl
description: Setup Shadow Huisstijl design system in het huidige project
user-invocable: true
category: design-system
---

# Setup Huisstijl Design System

Configureer het huidige project met Shadow's unified design system. Dit command voert de volledige setup checklist uit HUISSTIJL.md automatisch uit.

## Vereisten

- Het project moet een React/Vite of Next.js project zijn met `package.json`
- Tailwind CSS v4 moet al geinstalleerd zijn (of wordt meegeinstalleerd)
- Het project moet een `src/` directory hebben

## Instructies

### Stap 0: Detectie & Validatie

1. **Lees** `~/.claude/design-system/HUISSTIJL.md` voor de volledige design regels
2. **Controleer** of er een `package.json` bestaat in de huidige directory
3. **Detecteer** het framework:
   - `vite.config.ts` of `vite.config.js` → Vite project
   - `next.config.ts` of `next.config.js` → Next.js project
   - Anders → Vraag de gebruiker
4. **Controleer** of `src/` directory bestaat
5. Meld aan de gebruiker wat er gedetecteerd is:
   ```
   Gedetecteerd: [FRAMEWORK] project in [PAD]
   Start huisstijl setup...
   ```

### Stap 1: Font Loading

**Voor Vite projecten:**
- Open `index.html` in de project root
- Voeg de volgende regels toe in de `<head>` sectie (voor de `</head>` tag):
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  ```

**Voor Next.js projecten:**
- Open `src/app/layout.tsx` (of maak aan)
- Voeg de font links toe in de `<head>` of gebruik `next/font`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  ```

**Foutafhandeling:** Als index.html of layout.tsx niet gevonden wordt, meld dit en vraag de gebruiker waar de font loading moet komen.

### Stap 2: CSS Tokens

1. **Lees** de volledige inhoud van `~/.claude/design-system/tokens/index.css`
2. **Open** het project's hoofd CSS bestand:
   - Vite: `src/index.css` of `src/App.css`
   - Next.js: `src/app/globals.css`
3. **Controleer** of `@import "tailwindcss"` al aanwezig is. Zo niet, voeg dit toe bovenaan.
4. **Voeg** de volledige inhoud van `tokens/index.css` toe NA de `@import "tailwindcss"` regel
5. **Verwijder** eventuele bestaande shadcn/Tailwind kleurdefinities die conflicteren

**BELANGRIJK:** De tokens bevatten:
- `@import "./typography.css"` etc. - deze imports moeten INLINE worden (kopieer de inhoud direct, niet als aparte imports)
- Lees daarom OOK: `~/.claude/design-system/tokens/colors.css`, `typography.css`, `glass.css`, `animations.css`
- Plak alles als één geheel in het project's CSS bestand

**Foutafhandeling:** Als het CSS bestand niet gevonden wordt, maak `src/index.css` aan.

### Stap 3: shadcn Components Config

1. **Kopieer** `~/.claude/design-system/components/components.json` naar de project root
2. **Pas** het `css` pad aan als het project een ander pad gebruikt:
   - Vite: `"css": "src/index.css"` (standaard, meestal correct)
   - Next.js: `"css": "src/app/globals.css"`

### Stap 4: Utility Functies

1. **Controleer** of `src/lib/` directory bestaat, zo niet maak aan
2. **Kopieer** `~/.claude/design-system/lib/utils.ts` naar `src/lib/utils.ts`
3. Als `src/lib/utils.ts` al bestaat, **merge** de `cn()` functie erin (niet overschrijven)

### Stap 5: Animatie Library

1. **Controleer** of `src/lib/motion/` directory bestaat, zo niet maak aan
2. **Kopieer** alle bestanden uit `~/.claude/design-system/animations/` naar `src/lib/motion/`:
   - `framer-config.ts`
   - `framer-variants.ts`
   - `framer-components.tsx`
   - `gsap-config.ts`
   - `gsap-hooks.ts`
   - `index.ts`
3. **Pas imports aan** in `framer-components.tsx`: de `cn` import moet wijzen naar `@/lib/utils`

### Stap 6: Dependencies

Voer uit in de project directory:
```bash
npm install framer-motion gsap @gsap/react clsx tailwind-merge class-variance-authority
npm install -D @tailwindcss/postcss
```

**Foutafhandeling:** Als er versieconflicten zijn, meld deze aan de gebruiker en vraag hoe te handelen.

### Stap 7: shadcn Componenten

Voer uit in de project directory:
```bash
npx shadcn@latest add button card input label badge
```

**Let op:** Dit vereist dat `components.json` al aanwezig is (stap 3).

### Stap 8: Audit Bestaande Stijlen

Scan het HELE project op stijlen die niet voldoen aan de huisstijl en zet ze om.

#### 8a: Scan Kleuren

Zoek in ALLE bestanden onder `src/` naar niet-zinc kleuren:

```bash
# Tailwind kleurklassen die NIET zinc/neutral/gray/white/black zijn
grep -rn "bg-\(red\|blue\|green\|purple\|violet\|indigo\|cyan\|teal\|emerald\|lime\|amber\|orange\|yellow\|pink\|rose\|fuchsia\|sky\|slate\)-" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js"
grep -rn "text-\(red\|blue\|green\|purple\|violet\|indigo\|cyan\|teal\|emerald\|lime\|amber\|orange\|yellow\|pink\|rose\|fuchsia\|sky\|slate\)-" src/ --include="*.tsx" --include="*.jsx"
grep -rn "border-\(red\|blue\|green\|purple\|violet\|indigo\|cyan\|teal\|emerald\|lime\|amber\|orange\|yellow\|pink\|rose\|fuchsia\|sky\|slate\)-" src/ --include="*.tsx" --include="*.jsx"
grep -rn "ring-\(red\|blue\|green\|purple\|violet\|indigo\|cyan\|teal\|emerald\|lime\|amber\|orange\|yellow\|pink\|rose\|fuchsia\|sky\|slate\)-" src/ --include="*.tsx" --include="*.jsx"
grep -rn "shadow-\(red\|blue\|green\|purple\|violet\|indigo\|cyan\|teal\|emerald\|lime\|amber\|orange\|yellow\|pink\|rose\|fuchsia\|sky\|slate\)-" src/ --include="*.tsx" --include="*.jsx"

# Hex kleuren die niet grijs/wit/zwart zijn
grep -rn "#[0-9a-fA-F]\{3,8\}" src/ --include="*.css" --include="*.tsx" --include="*.jsx" --include="*.ts"

# RGB/HSL kleuren
grep -rn "rgb\|rgba\|hsl\|hsla" src/ --include="*.css" --include="*.tsx" --include="*.ts"

# Hardcoded blauw in CSS variabelen of inline styles
grep -rn "blue\|indigo\|violet\|purple\|cyan\|teal\|emerald\|green\|red\|orange\|yellow\|pink\|rose" src/ --include="*.css"
```

**Uitzonderingen - NIET omzetten:**
- Kleuren in `--state-success-*`, `--state-error-*`, `--state-warning-*` tokens (die staan al correct in de huisstijl tokens)
- Kleuren in `--destructive` token
- Kleuren in externe library bestanden onder `node_modules/`
- Kleuren in SVG bestanden die specifieke brand icons zijn

#### 8b: Scan Fonts

```bash
# Zoek naar font-family declaraties die niet DM Sans, Inter, of JetBrains Mono zijn
grep -rn "font-family\|fontFamily" src/ --include="*.css" --include="*.tsx" --include="*.ts"

# Zoek naar Tailwind font klassen die niet font-display, font-body, font-sans, of font-mono zijn
grep -rn "font-serif\|font-\(arial\|helvetica\|georgia\|roboto\|poppins\|lato\|open-sans\|montserrat\|nunito\|raleway\|oswald\|playfair\)" src/ --include="*.tsx" --include="*.jsx"
```

#### 8c: Scan Shadows & Glows

```bash
# Zoek naar gekleurde shadows
grep -rn "box-shadow.*\(blue\|red\|green\|purple\|indigo\|#[0-9a-fA-F]\)" src/ --include="*.css" --include="*.tsx"

# Zoek naar Tailwind gekleurde shadow klassen
grep -rn "shadow-\(blue\|red\|green\|purple\|indigo\|violet\|cyan\)" src/ --include="*.tsx" --include="*.jsx"
```

#### 8d: Scan Border Radius

```bash
# Zoek naar hardcoded border-radius die niet var(--radius) gebruikt
grep -rn "border-radius:.*px\|border-radius:.*rem\|border-radius:.*em" src/ --include="*.css"
```

#### 8e: Omzettingsregels

Voor elke gevonden overtreding, pas de volgende mapping toe:

**Kleuren omzetten naar zinc:**

| Gevonden | Vervangen door |
|----------|---------------|
| `bg-blue-*`, `bg-indigo-*`, `bg-violet-*`, `bg-purple-*` | `bg-zinc-*` met vergelijkbare lightness |
| `bg-[kleur]-50` t/m `bg-[kleur]-100` | `bg-zinc-50` t/m `bg-zinc-100` |
| `bg-[kleur]-200` t/m `bg-[kleur]-300` | `bg-zinc-200` t/m `bg-zinc-300` |
| `bg-[kleur]-400` t/m `bg-[kleur]-500` | `bg-zinc-400` t/m `bg-zinc-500` |
| `bg-[kleur]-600` t/m `bg-[kleur]-700` | `bg-zinc-600` t/m `bg-zinc-700` |
| `bg-[kleur]-800` t/m `bg-[kleur]-950` | `bg-zinc-800` t/m `bg-zinc-950` |
| Idem voor `text-`, `border-`, `ring-`, `shadow-` | Zelfde mapping |
| `bg-primary`, `text-primary` etc. | Behouden - deze gebruiken al de CSS tokens |
| `#3B82F6`, `#2563EB` en andere blauwe hex | Vervang door dichtstbijzijnde zinc hex |
| `rgb(59, 130, 246)` en andere gekleurde rgb | Vervang door zinc equivalent |

**Specifieke Tailwind kleur mapping:**

| Shade | Zinc hex | Zinc oklch |
|-------|----------|------------|
| 50 | `#fafafa` | `oklch(0.985 0 0)` |
| 100 | `#f4f4f5` | `oklch(0.967 0.001 286.375)` |
| 200 | `#e4e4e7` | `oklch(0.920 0.004 286.32)` |
| 300 | `#d4d4d8` | `oklch(0.871 0.006 286.286)` |
| 400 | `#a1a1aa` | `oklch(0.705 0.015 286.067)` |
| 500 | `#71717a` | `oklch(0.552 0.016 285.938)` |
| 600 | `#52525b` | `oklch(0.442 0.017 285.786)` |
| 700 | `#3f3f46` | `oklch(0.370 0.013 285.805)` |
| 800 | `#27272a` | `oklch(0.274 0.006 286.033)` |
| 900 | `#18181b` | `oklch(0.228 0.006 285.885)` |
| 950 | `#09090b` | `oklch(0.141 0.005 285.823)` |

**Fonts omzetten:**

| Gevonden | Vervangen door |
|----------|---------------|
| Elke `font-family` behalve DM Sans, Inter, JetBrains Mono | Verwijder en gebruik `font-display`, `font-body`, of `font-mono` class |
| `font-serif`, `font-[custom]` | `font-sans` voor body, `font-display` voor headings |

**Shadows omzetten:**

| Gevonden | Vervangen door |
|----------|---------------|
| Gekleurde `box-shadow` | Monochrome variant met `var(--glow)` of `rgba(0,0,0,0.06)` light / `rgba(255,255,255,0.06)` dark |
| `shadow-blue-*` etc. | `shadow-sm`, `shadow-md` of de `.glow` / `.glow-hover` utility classes |

#### 8f: Audit Rapportage

Presenteer de audit resultaten AAN DE GEBRUIKER voordat je iets wijzigt:

```
Audit Bestaande Stijlen
========================

Gevonden overtredingen: [AANTAL]

| # | Bestand | Regel | Probleem | Voorstel |
|---|---------|-------|----------|----------|
| 1 | src/components/Button.tsx | 12 | bg-blue-500 | bg-zinc-500 |
| 2 | src/index.css | 45 | #3B82F6 | #71717a |
| ... | ... | ... | ... | ... |

Wil je dat ik deze [AANTAL] wijzigingen doorvoer?
```

**BELANGRIJK:** Voer de wijzigingen NIET uit zonder bevestiging van de gebruiker. Toon eerst het rapport, wacht op goedkeuring.

#### 8g: Wijzigingen Doorvoeren

Na bevestiging van de gebruiker:
1. Voer alle goedgekeurde wijzigingen door
2. Run opnieuw de scan uit 8a-8d om te bevestigen dat alles is omgezet
3. Als er nog overtredingen zijn, rapporteer deze opnieuw

### Stap 9: Verificatie

1. **Finale scan** op niet-zinc kleuren in alle bestanden:
   ```bash
   grep -ri "blue\|#3B82F6\|#2563EB\|59, 130, 246" src/ --include="*.css" --include="*.tsx" --include="*.ts"
   ```
2. Verwacht resultaat: 0 matches op gekleurde accenten
3. **Controleer** dat de CSS tokens correct zijn geladen door te zoeken naar `--primary` in het hoofd CSS bestand
4. **Controleer** dat fonts correct zijn door te zoeken naar `DM Sans` in index.html of layout.tsx

### Stap 10: Rapportage

Presenteer een samenvattende tabel aan de gebruiker:

```
Setup Huisstijl - Resultaat
============================

| Stap | Status | Details |
|------|--------|---------|
| Font loading | [OK/FOUT] | [index.html / layout.tsx] |
| CSS tokens | [OK/FOUT] | [src/index.css / globals.css] |
| components.json | [OK/FOUT] | [project root] |
| utils.ts | [OK/FOUT] | [src/lib/utils.ts] |
| Animaties | [OK/FOUT] | [src/lib/motion/ - X bestanden] |
| Dependencies | [OK/FOUT] | [X packages] |
| shadcn components | [OK/FOUT] | [button, card, input, label, badge] |
| Audit kleuren | [OK/FOUT] | [X omgezet, Y overgeslagen] |
| Audit fonts | [OK/FOUT] | [X omgezet] |
| Audit shadows | [OK/FOUT] | [X omgezet] |
| Finale check | [OK/FOUT] | [0 overtredingen] |

Klaar! Het project gebruikt nu de Shadow Huisstijl.
Lees ~/.claude/design-system/HUISSTIJL.md voor alle design regels.
```

## Tags
design-system, huisstijl, setup, automation, monochrome, zinc
