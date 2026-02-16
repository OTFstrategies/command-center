---
name: command-center-v2
description: Project-specifieke instructies voor Command Center v2
created: 2026-02-10
project: command-center
tags: [project, next.js, supabase, vercel]
---

# Command Center v2 — Project Instructies

## Overzicht
Centraal dashboard voor Shadow's Claude Code setup.
- **Live:** https://command-center-app-nine.vercel.app
- **Repo:** command-center-v2/command-center-app
- **Supabase Project ID:** ikpmlhmbooaxfrlpzcfa

## Tech Stack
- Next.js 14 (App Router, Server Components)
- Supabase (PostgreSQL) met service role key
- Tailwind CSS v4
- Lucide React icons
- @dnd-kit (drag & drop kanban)

## Conventies
- Server Components by default
- 'use client' alleen voor interactieve componenten (filters, modals, drag-drop)
- Supabase queries in src/lib/ (registry.ts, tasks.ts, projects.ts)
- API routes authenticeren met x-api-key header (SYNC_API_KEY env var)
- Design: ALLEEN zinc palette — geen blauwe, groene, paarse accenten

## Database Tabellen
| Tabel | Doel |
|-------|------|
| registry_items | Alle gesyncde assets (commands, agents, skills, etc.) |
| projects | Project metadata |
| project_changelog | Change history per project |
| activity_log | Sync en usage activiteit |
| kanban_tasks | Kanban board items |
| inbox_pending | Inbox sync wachtrij |
| project_folders | Project folder beschrijvingen |
| project_credentials | Project credentials (encrypted) |

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SYNC_API_KEY

## Bekende Issues
- Activity page (/activity) gebruikt mock data i.p.v. echte activity_log
- Period filter op Activity page had bg-blue-600 (gefixed naar zinc)
