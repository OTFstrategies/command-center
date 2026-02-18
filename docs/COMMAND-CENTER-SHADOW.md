# Command Center — Mijn Naslagwerk

> Shadow's persoonlijke quick reference. Open dit als je even niet meer weet hoe het zat.

---

## In 30 Seconden

**Wat:** Jouw centrale dashboard voor alles wat je met Claude Code hebt gebouwd — agents, commands, skills, projecten, relaties, health.

**Waar:** https://command-center-app-nine.vercel.app

**Hoe openen:** Gewoon die URL in je browser. Werkt overal (Vercel hosted).

---

## Mijn Dagelijkse Workflow

1. **Dashboard openen** — kijk of er rode/oranje alerts zijn bovenaan
2. **NotificationBell checken** — het belletje links in de sidebar toont ongelezen alerts
3. **SyncStatus checken** — de gekleurde stip naast "Sync" moet groen zijn
4. **Als er alerts zijn** — klik erop, lees wat er aan de hand is
5. **Ctrl+J** — opent het Command Panel voor snelle acties

### Wat betekenen de kleuren?

| Kleur | Betekenis | Actie |
|-------|-----------|-------|
| Groen | Alles goed | Niks doen |
| Oranje | Waarschuwing | Check wanneer je tijd hebt |
| Rood | Kritiek | Vraag Claude om te fixen |

---

## Hoe Houd Ik Het Up-to-Date

| Wat | Hoe | Wanneer |
|-----|-----|---------|
| Registry sync | `/sync-cc` in Claude Code | Na elke sessie waarin je assets maakt |
| Health check | Draait automatisch elke 6 uur | Niks doen, gaat vanzelf |
| Deep Scan | Ctrl+J → "Deep Scan" of `/deep-scan` | Na grote wijzigingen aan je ecosysteem |
| Code analyse | Via MCP server (`analyze_project`) | Claude doet dit automatisch |
| STATUS.md | `/session-status` in Claude Code | Einde van elke werk-sessie |

---

## Wat Ik Zie Op Elke Pagina

| Pagina | URL | Wat ik er zie |
|--------|-----|---------------|
| **Dashboard** | `/` | Stats (100+ assets), alerts, recent changes, project cards |
| **Registry** | `/registry` | Alle assets op een rij — agents, commands, skills, etc. |
| **Tasks** | `/tasks` | Mijn kanban board (drag-and-drop) |
| **Alerts** | `/alerts` | Alle waarschuwingen met filters en bulk acties |
| **Activity** | `/activity` | Audit trail — wat is er wanneer veranderd |
| **Map** | `/map` | Mijn hele ecosysteem visueel (clusters, relaties, grafieken) |
| **Project Detail** | `/projects/[naam]` | Alles over één project in 7 tabs |
| **Settings** | `/settings` | Instellingen |

### Intelligence Map Views

De kaart (`/map`) heeft 4 views — switch bovenaan:

- **Cockpit** — grid van cluster-kaarten (standaard, beste overzicht)
- **Kaart** — interactieve grafiek met nodes en lijnen
- **Tijdlijn** — chronologisch wat er is veranderd
- **Vergelijk** — twee projecten naast elkaar

Plus zijpanelen: Kosten, Gebruik, Inzichten, Risico.

---

## Als Er Iets Mis Is

| Probleem | Wat ik zie | Wat ik doe |
|----------|-----------|-----------|
| Rode alert | Kritiek probleem bovenaan dashboard | Open Claude Code, beschrijf het probleem |
| Oranje alert | Waarschuwing in alert lijst | Check details, fix als je tijd hebt |
| Sync stip is rood | Sidebar toont rode stip | Draai `/sync-cc` opnieuw |
| Oude data | Dashboard toont verouderde info | Draai `/sync-cc` + eventueel `/deep-scan` |
| Build kapot | Vercel deployment faalt | Vraag Claude om build errors te fixen |

---

## Mijn Kosten

| Dienst | Kosten | Waarvoor |
|--------|--------|----------|
| Supabase Pro | ~EUR 25/maand | Database, Edge Functions, Realtime |
| Vercel Pro | ~EUR 20/maand | Hosting, CDN, deployment |
| Claude Code | Via Anthropic API credits | AI development (betaal per gebruik) |
| **Totaal** | **~EUR 45/maand + API credits** | |

---

## Technische Details (voor als ik het vergeet)

| Wat | Waarde |
|-----|--------|
| Supabase project ID | `ikpmlhmbooaxfrlpzcfa` |
| Vercel project | `command-center-app` |
| GitHub repo | `OTFstrategies/command-center` |
| Live URL | https://command-center-app-nine.vercel.app |
| Tech stack | Next.js 14, Tailwind CSS v4, Supabase, Vercel |
| Database tabellen | 28 |
| API routes | 22 |
| Componenten | 56 |
| MCP server | `cc-v2-mcp/` (7 tools voor code analyse) |

### Belangrijk bestanden

| Bestand | Wat het is |
|---------|-----------|
| `STATUS.md` | Huidige staat van het project |
| `CLAUDE.md` | Instructies voor Claude (project-specifiek) |
| `~/.claude/CLAUDE.md` | Globale instructies voor Claude (alle projecten) |
| `~/.claude/registry/*.json` | De "source of truth" — alle geregistreerde assets |

---

## Snelle Commando's

| Ik wil... | Ik typ in Claude Code... |
|-----------|-------------------------|
| Assets synchroniseren | `/sync-cc` |
| Ecosysteem scannen | `/deep-scan` |
| Project registreren | `/onboard` |
| Asset opslaan | `/save-to-cc` |
| Notitie toevoegen | `/memory` |
| Status updaten | `/session-status` |
| Design system installeren | `/setup-huisstijl` |
| Nieuw project starten | `/agent-os` |
| Deployen | `vercel --prod` in terminal |
