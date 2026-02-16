# Shadow's Design Style — Prompt Template

Gebruik deze prompt om een minimalistische, Apple-geïnspireerde interface te ontwerpen.

---

## De Opdracht

Ontwerp een [BESCHRIJF FEATURE/PAGINA] met de volgende design principes:

---

## Design Filosofie

### Kernprincipes

1. **Less is More** — Elk element moet zijn bestaan verdienen. Geen decoratie, geen filler.
2. **Monochroom First** — 95% van de UI is zwart/wit/grijs. Kleur alleen voor interactie.
3. **Maximum Whitespace** — Genereuze padding en margins. Laat de content ademen.
4. **Functie boven Vorm** — Geen UI element zonder duidelijke functie.

### Wat te Vermijden

- Geen emojis of decoratieve symbolen
- Geen welkomstberichten of greetings
- Geen tooltips met uitleg die niemand leest
- Geen grafieken/charts tenzij expliciet gevraagd
- Geen onboarding, tips of hints
- Geen badges, ribbons of "nieuw!" indicators
- Geen gradients of fancy effecten
- Geen rounded corners groter dan `rounded-lg`

---

## Kleurenpalet

### Basis: Zinc (Monochroom)

```
Achtergrond pagina:    bg-zinc-50 dark:bg-zinc-950
Achtergrond kaart:     bg-white dark:bg-zinc-900
Achtergrond hover:     hover:bg-zinc-100 dark:hover:bg-zinc-800

Tekst primair:         text-zinc-900 dark:text-zinc-50
Tekst secundair:       text-zinc-500 dark:text-zinc-400
Tekst muted:           text-zinc-400 dark:text-zinc-500
Tekst zeer subtiel:    text-zinc-300 dark:text-zinc-600

Border standaard:      border-zinc-200 dark:border-zinc-800
Divider:               divide-zinc-200 dark:divide-zinc-800
```

### Accent: Blue (Alleen voor Interactie)

```
Active/selected:       text-blue-600 dark:text-blue-400
Active background:     bg-zinc-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400
Hover op interactief:  hover:text-blue-600 dark:hover:text-blue-400
Focus ring:            ring-blue-500/20
Selected border:       border-blue-500
```

### Regel

Blauw mag ALLEEN gebruikt worden voor:
- Active states (huidige pagina, geselecteerd item)
- Hover states op klikbare elementen
- Focus indicators
- Primary action buttons (zeldzaam)

---

## Typografie

### Fonts

```
Headings:    font-family: 'DM Sans', sans-serif
Body:        font-family: 'Inter', sans-serif
Code/Mono:   font-family: 'JetBrains Mono', monospace
```

### Groottes

```
Page title:      text-2xl font-semibold
Section header:  text-xs font-medium uppercase tracking-wide text-zinc-400
Card title:      text-sm font-medium
Body text:       text-sm
Small/meta:      text-xs
Tiny labels:     text-[10px] uppercase tracking-wide
```

### Regels

- Geen tekst groter dan `text-2xl`
- Headers altijd `uppercase tracking-wide` met muted kleur
- Mono font voor: code, paden, commando's, technische identifiers

---

## Layout Patronen

### Pagina Structuur

```tsx
<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
  <div className="mx-auto max-w-4xl px-6 py-12">
    {/* Content hier */}
  </div>
</div>
```

### Lijst Items

```tsx
<div className="divide-y divide-zinc-200 dark:divide-zinc-800">
  {items.map(item => (
    <div className="group flex items-center gap-4 py-4">
      {/* Klikbaar gedeelte */}
      <button className="flex flex-1 items-center gap-4 text-left transition-colors hover:text-blue-600">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {item.name}
        </span>
      </button>

      {/* Action buttons - verschijnen op hover */}
      <button className="opacity-0 group-hover:opacity-100 transition-all">
        <Copy className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
      </button>
    </div>
  ))}
</div>
```

### Filter Tabs

```tsx
<div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
  {filters.map(filter => (
    <button
      className={`pb-3 text-xs font-medium uppercase tracking-wide transition-colors ${
        active === filter
          ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
          : 'text-zinc-400 hover:text-zinc-600'
      }`}
    >
      {filter}
    </button>
  ))}
</div>
```

### Tags/Labels

```tsx
<span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
  {label}
</span>
```

### Statistieken

```tsx
<div className="flex items-baseline gap-2">
  <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
    {label}
  </span>
  <span className="font-mono text-2xl font-light text-zinc-900 dark:text-zinc-50">
    {count}
  </span>
</div>
```

---

## Navigatie

### Icon-Only Sidebar

```tsx
// Desktop: 64px breed, alleen icons
// Hover: tooltip met label verschijnt
// Active: bg-zinc-100 text-blue-600

<aside className="fixed inset-y-0 left-0 w-16 border-r border-zinc-200 bg-white">
  <nav className="flex flex-col gap-1 p-2">
    {items.map(item => (
      <button
        className={`group relative flex justify-center rounded-lg p-3 transition-colors ${
          item.isActive
            ? 'bg-zinc-100 text-blue-600'
            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
      >
        <item.icon className="h-5 w-5" />

        {/* Hover tooltip */}
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
          {item.label}
        </span>
      </button>
    ))}
  </nav>
</aside>
```

---

## Interactie Patronen

### Hover Effects

```
Rij hover:           hover:bg-zinc-100 dark:hover:bg-zinc-900
Text hover:          hover:text-blue-600 dark:hover:text-blue-400
Button hover:        hover:bg-zinc-100 hover:text-zinc-600
Verborgen actions:   opacity-0 group-hover:opacity-100
```

### Transitions

```
Alle interacties:    transition-colors (NIET transition-all)
Snelheid:            Default (150ms) - geen custom durations
```

### Copy Buttons

- Verschijnen alleen op hover van parent row
- Subtiele kleur: `text-zinc-400`
- Geen toast/feedback nodig (optioneel)

---

## Icons

### Library: Lucide React

```tsx
import { Home, Key, Copy, ChevronRight } from 'lucide-react'
```

### Groottes

```
Navigatie:     h-5 w-5
In-line:       h-4 w-4
Kleine meta:   h-3.5 w-3.5
```

### Kleuren

```
Standaard:     text-zinc-400 dark:text-zinc-500
Hover:         hover:text-zinc-600 dark:hover:text-zinc-300
Active:        text-blue-600 dark:text-blue-400
Zeer subtiel:  text-zinc-300 dark:text-zinc-600
```

---

## Dark Mode

### Principe

Elke kleur class moet een `dark:` variant hebben:

```tsx
// GOED
className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"

// FOUT
className="bg-white text-zinc-900"
```

### Achtergronden in Dark Mode

```
Pagina:        dark:bg-zinc-950
Kaart/Panel:   dark:bg-zinc-900
Hover:         dark:hover:bg-zinc-800
```

---

## Voorbeeld: Complete Lijst Pagina

```tsx
export function ItemList({ items, onSelect, onCopy }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12">

        {/* Section header */}
        <h2 className="mb-6 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Items
        </h2>

        {/* List */}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-4 py-4"
            >
              <button
                onClick={() => onSelect(item.id)}
                className="flex flex-1 items-center gap-4 text-left transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.name}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {item.meta}
                </span>
              </button>

              <button
                onClick={() => onCopy(item.id)}
                className="rounded p-2 text-zinc-400 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
```

---

## Checklist voor Review

Voordat je een design oplevert, check:

- [ ] Geen onnodige kleuren (alleen zinc + blue accent)
- [ ] Alle interactieve elementen hebben hover states
- [ ] Alle kleuren hebben dark: variants
- [ ] Geen decoratieve elementen
- [ ] Voldoende whitespace (py-12 voor pagina's, py-4 voor items)
- [ ] Icons zijn consistent (lucide-react, h-4 w-4 of h-5 w-5)
- [ ] Tekst hiërarchie is duidelijk (headers muted, content prominent)
- [ ] Copy/action buttons verschijnen op hover
- [ ] Transitions zijn subtiel (transition-colors)

---

## Gebruik

Kopieer dit naar je prompt en vervang [BESCHRIJF FEATURE/PAGINA]:

```
Ontwerp een [dashboard/lijst/formulier/etc] volgens Shadow's Design Style.

Refereer naar de design principes in dit document voor:
- Kleurgebruik (monochroom zinc, blue alleen voor interactie)
- Typografie (DM Sans headings, Inter body, JetBrains Mono code)
- Layout patronen (max-w-4xl, generous padding)
- Interactie (hover states, opacity transitions)

De UI moet minimalistisch, functioneel en Apple-geïnspireerd zijn.
```
