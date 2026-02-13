# Command Center v2 Architecture

## Tech Stack
- Next.js 14 (App Router, Server Components)
- Supabase (PostgreSQL) - project ID: ikpmlhmbooaxfrlpzcfa
- Tailwind CSS v4 (zinc-only palette, glassmorphism)
- @dnd-kit (drag-drop), Framer Motion (animations), Lucide React (icons)

## Data Flow
`~/.claude/registry/*.json` → `scripts/sync-registry.mjs` → `POST /api/sync` → Supabase → Dashboard pages

## Key Directories
```
command-center-app/src/
  app/(dashboard)/        # Pages: home, activity, registry, tasks, settings
    projects/[slug]/      # Project detail pages
  app/api/                # sync/, tasks/, search/, activity/
  components/             # dashboard/, kanban/, search/, shell/, sync/, activity/, ui/
  lib/                    # supabase/client.ts, registry.ts, tasks.ts, projects.ts
  types/index.ts          # All TypeScript interfaces
```

## Conventions
- Server Components by default, 'use client' only for interactive UI
- Supabase queries use SERVICE_ROLE_KEY (bypass RLS)
- API routes auth via x-api-key header (SYNC_API_KEY)
- Tailwind v4: custom CSS in @layer components

## Supabase Tables
- `registry_items` - All 6 asset types (agent, command, skill, prompt, api, instruction)
- `activity_log` - Audit trail of sync and usage events
- `kanban_tasks` - Task management (backlog/todo/doing/done)
- `project_changelog` - Per-project change tracking
- `projects` - Project metadata (auto-created during sync)
- `inbox_pending` - Staging area for sync processing

## System Roles
- **Claude CLI** = producer (creates assets via /save-to-cc)
- **CC v2** = viewer (displays data from Supabase mirror)
- **Serena** = code tool (independent, own data in .serena/)
