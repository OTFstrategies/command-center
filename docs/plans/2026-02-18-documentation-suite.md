# Documentation Suite — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Drie doelgroep-specifieke documentatie-bestanden aanmaken (Claude onboarding, Shadow naslagwerk, investeerderspitch) en een STATUS.md update-knop toevoegen aan het dashboard.

**Architecture:** Twee pure schrijf-taken (markdown bestanden) + één kleine UI-wijziging (extra actie in bestaande CommandPanel). Geen nieuwe API routes, geen nieuwe pagina's, geen database wijzigingen.

**Tech Stack:** Markdown, React (CommandPanel.tsx bestaand component)

---

## Task 1: Schrijf investeerdersversie

**Files:**
- Create: `docs/COMMAND-CENTER-INVESTOR.md`

**Step 1: Schrijf het document**

Het investeerdersdocument moet het volgende bevatten, geschreven vanuit Shadow's perspectief als MKB-directeur die een AI-gestuurd management systeem heeft gebouwd:

```markdown
# Command Center — AI-Powered Development Management

## Wat het is
- Centraal dashboard dat een compleet AI-development ecosysteem beheert
- Gebouwd met Claude Code (Anthropic) als enige developer — geen development team nodig

## Het probleem dat het oplost
- MKB-directeuren die AI willen inzetten maar geen developers kunnen betalen
- Shadow heeft 100+ AI-tools gebouwd zonder programmeerkennis
- Zonder overzicht raak je controle kwijt over je AI-ecosysteem

## Wat het kan
- Real-time monitoring van 100+ AI-assets (agents, commands, skills)
- Automatische health checks elke 6 uur
- Intelligence Map: visueel ecosysteem-overzicht met 338 relaties
- Code analyse via TypeScript compiler API
- Project dossiers met 7 analyse-tabs

## Technische architectuur (kort)
- Next.js 14 dashboard op Vercel
- Supabase PostgreSQL + Edge Functions + Realtime
- MCP (Model Context Protocol) server voor code intelligence
- 22 API routes, 56 componenten, 25 database tabellen

## Bewezen resultaten
- 48 geautomatiseerde tests, 0 failures
- 232+ gescande items, 338 relaties, 12 clusters, 58 inzichten
- Volledig autonoom gebouwd door AI — van plan tot deployment

## Waarom dit relevant is
- Demonstreert dat één persoon met AI een volledig softwaresysteem kan bouwen en beheren
- Schaalbaar model voor MKB: AI als team, dashboard als controle
- Concrete use case van Claude Code als production development tool
```

De exacte inhoud moet dieper en rijker zijn dan dit skeleton — gebruik data uit STATUS.md, CLAUDE.md, en het bestaande onboarding document om concrete cijfers, features en resultaten te benoemen. Schrijf in het Engels (investeerders zijn internationaal). Houd het onder 200 regels — puntig, geen fluff.

**Step 2: Commit**

```bash
git add docs/COMMAND-CENTER-INVESTOR.md
git commit -m "docs: add investor-facing Command Center overview"
```

---

## Task 2: Schrijf Shadow's persoonlijke naslagwerk

**Files:**
- Create: `docs/COMMAND-CENTER-SHADOW.md`

**Step 1: Schrijf het document**

Dit document is voor Shadow zelf — een praktisch naslagwerk dat hij kan openen na weken niet aan het project gewerkt te hebben. Schrijf in het Nederlands. Focus op:

```markdown
# Command Center — Mijn Naslagwerk

## In 30 seconden
- Wat is het (1 zin)
- Waar draait het (URLs)
- Hoe open ik het (browser URL)

## Mijn dagelijkse workflow
- Dashboard openen → checken of er alerts zijn
- Als er rode/oranje alerts zijn → actie ondernemen
- Ctrl+J → Command Panel voor snelle acties

## Hoe houd ik het up-to-date
- `/sync-cc` draait in Claude Code na elke sessie
- Health check draait automatisch elke 6 uur
- Deep Scan draai je na grote wijzigingen

## Wat ik zie op elke pagina
- Homepage: stats, alerts, recent changes, projects
- /map: mijn hele ecosysteem visueel
- /alerts: wat er aandacht nodig heeft
- /projects/[naam]: alles over één project
- /tasks: mijn kanban board
- /registry: alle assets op een rij

## Als er iets mis is
- Rode alert = kritiek → vraag Claude om te fixen
- Oranje alert = waarschuwing → check wanneer je tijd hebt
- Sync stip is rood = sync mislukt → draai /sync-cc opnieuw

## Mijn kosten
- Supabase Pro: €25/maand
- Vercel Pro: €20/maand
- Claude Code: via Anthropic API credits

## Technische details (voor als ik het vergeet)
- Supabase project: ikpmlhmbooaxfrlpzcfa
- Vercel project: command-center-app
- GitHub repo: OTFstrategies/command-center
- Tech: Next.js 14, Tailwind, Supabase, Vercel
```

Breid elk punt uit met concrete details. Gebruik Shadow's taalgebruik (informeel, direct). Houd het onder 150 regels — dit is een quick reference, geen boek.

**Step 2: Commit**

```bash
git add docs/COMMAND-CENTER-SHADOW.md
git commit -m "docs: add Shadow's personal quick reference guide"
```

---

## Task 3: Voeg STATUS.md update-actie toe aan CommandPanel

**Files:**
- Modify: `command-center-app/src/components/shell/CommandPanel.tsx:4` (import toevoegen)
- Modify: `command-center-app/src/components/shell/CommandPanel.tsx:108-123` (actie toevoegen)

**Step 1: Voeg FileText icon import toe**

In `CommandPanel.tsx` regel 4, voeg `FileText` toe aan de Lucide import:

```typescript
import { RefreshCw, ScanSearch, HeartPulse, Code, FileText, X } from 'lucide-react'
```

**Step 2: Voeg STATUS.md actie toe aan de actions array**

Voeg een 5e actie toe NA de bestaande `analysis` actie (na regel 123, voor de `]`):

```typescript
    {
      id: 'status',
      label: 'Update STATUS.md',
      description: 'Genereer project status overzicht',
      icon: FileText,
      handler: async () => {
        return 'STATUS.md update vereist Claude Code. Gebruik /session-status in je terminal.'
      },
    },
```

Dit is bewust een passieve actie (geen API call) omdat STATUS.md lokaal wordt gegenereerd door Claude Code. De knop dient als reminder/snelkoppeling.

**Step 3: Verifieer build**

```bash
cd command-center-app && npx tsc --noEmit
```

Verwacht: 0 errors

**Step 4: Commit**

```bash
git add command-center-app/src/components/shell/CommandPanel.tsx
git commit -m "feat: add STATUS.md update action to CommandPanel"
```

---

## Task 4: Verifieer en deploy

**Step 1: Production build**

```bash
cd command-center-app && npm run build
```

Verwacht: Build succesvol, geen errors

**Step 2: Commit alles samen als er losse bestanden zijn**

```bash
git status
```

Als er nog uncommitted files zijn, commit ze.

**Step 3: Push en deploy**

```bash
git push
cd /path/to/root && vercel --prod --yes
```

Verwacht: Deployment succesvol, live op https://command-center-app-nine.vercel.app

**Step 4: Verifieer CommandPanel**

Open de live URL, druk Ctrl+J, controleer dat de 5e actie "Update STATUS.md" zichtbaar is.

---

## Samenvatting

| Task | Wat | Output |
|------|-----|--------|
| 1 | Investeerdersversie schrijven | `docs/COMMAND-CENTER-INVESTOR.md` |
| 2 | Shadow's naslagwerk schrijven | `docs/COMMAND-CENTER-SHADOW.md` |
| 3 | CommandPanel uitbreiden | 5e actie "Update STATUS.md" |
| 4 | Build, push, deploy, verifieer | Live op Vercel |

**Geschatte duur:** ~15-20 minuten met subagents

---

*Plan klaar voor uitvoering.*
