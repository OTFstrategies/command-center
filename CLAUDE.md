# Command Center v2

## Project
Centraal command center dashboard voor Shadow's Claude Code setup.
- **Live:** https://command-center-app-nine.vercel.app
- **Supabase:** Project ID `ikpmlhmbooaxfrlpzcfa`

## Tech Stack
- **Framework:** Next.js 14 (App Router, Server Components)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Drag & Drop:** @dnd-kit
- **Deployment:** Vercel

## Design System
Shadow Huisstijl is toegepast:
- ALLEEN zinc palette (GEEN blauwe, groene, paarse accenten)
- Glassmorphism + monochrome glow voor hover
- Inter (body), DM Sans (headings optioneel), monospace voor code
- Bron: `~/.claude/design-system/HUISSTIJL.md`

## Directory Structuur
```
command-center-app/src/
  app/
    (dashboard)/        # Pages: home, activity, registry, tasks, settings
      projects/[slug]/  # Project detail + memories
    api/
      sync/             # Registry sync + inbox
      tasks/            # Task CRUD
      search/           # Global search
      activity/         # Activity log (GET + POST)
      projects/[slug]/  # Project metadata + memories CRUD
  components/
    dashboard/          # StatCard, ProjectCard, QuickActionBar
    kanban/             # KanbanBoard, KanbanColumn, TaskCard, AddTaskModal
    memories/           # MemoryList
    search/             # SearchDialog, SearchProvider
    shell/              # AppShell, MainNav, ProjectSwitcher, ShellLayout
    sync/               # InboxPanel
    activity/           # ActivityList (client filters)
    ui/                 # Toast, Skeleton, NotificationBadge
  lib/
    supabase/client.ts  # Browser Supabase client
    registry.ts         # Server-side registry + activity queries
    tasks.ts            # Server-side task queries
    projects.ts         # Server-side project + memory queries
  types/index.ts        # Alle TypeScript interfaces
```

## Conventies
- Server Components by default (pages zijn async server components)
- 'use client' alleen voor interactieve UI (filters, modals, drag-drop)
- Supabase server queries via SERVICE_ROLE_KEY (bypass RLS)
- API routes authenticeren met `x-api-key` header
- Tailwind v4: custom CSS in `@layer components` blok voor behoud door Lightning CSS

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Publieke Supabase key
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase key (bypass RLS)
- `SYNC_API_KEY` — Authenticatie voor sync API routes

## Sync Pipeline
Registry data flow: `~/.claude/registry/*.json` → `scripts/sync-registry.mjs` → `POST /api/sync` → Supabase
- **Handmatig:** `SYNC_API_KEY="<key>" npm run sync` vanuit `command-center-app/`
- **Via Claude Code:** `/sync-cc` command
- Het script leest alle registry JSON bestanden en pusht per type naar de sync API
- De API vervangt alle items van dat type, genereert changelog entries, en maakt projecten aan

## Systeemrollen

| Systeem | Rol | Data |
|---------|-----|------|
| **Claude CLI** | Runtime — produceert en gebruikt assets (agents, commands, skills, etc.) | `~/.claude/registry/*.json` (source of truth) |
| **Command Center v2** | Dashboard + data store — visueel overzicht, project memories, onboarding data | Supabase (mirror via sync + memories + metadata) |

- Claude CLI is de **producent** (`/save-to-cc` slaat assets op, `/memory` schrijft memories, `/onboard` detecteert project info)
- CC v2 is het **centrale dashboard** (`/sync-cc` synchroniseert registry, memories via API, project metadata via PATCH)
- Geen Serena meer — CC v2 vervangt alle Serena management-functionaliteit

## Project Memories
Project memories zijn markdown documenten per project, opgeslagen in Supabase `project_memories` tabel.
- **Schrijven:** `/memory` command of `POST /api/projects/[slug]/memories`
- **Lezen:** Dashboard project detail pagina of `GET /api/projects/[slug]/memories`
- **Verwijderen:** `DELETE /api/projects/[slug]/memories/[name]`
