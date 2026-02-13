# Sync System

## Flow
1. `/save-to-cc` command saves asset to `~/.claude/` (file + registry JSON)
2. `scripts/sync-registry.mjs` reads all `~/.claude/registry/*.json` files
3. `POST /api/sync` sends items per type to Supabase (with x-api-key header)
4. API deletes existing items of that type, inserts new ones
5. Changelog entries auto-generated per project
6. Projects auto-created in `projects` table if they don't exist

## Running Sync
- From CLI: `cd command-center-app && SYNC_API_KEY="<key>" npm run sync`
- Via Claude Code: `/sync-cc` command (reads key from .env.local automatically)

## API Endpoints
- `POST /api/sync` - Full type replacement sync (requires x-api-key)
- `GET /api/sync` - Get sync status and counts per type
- `POST /api/sync/inbox` - Stage items for later processing
- `POST /api/sync/inbox/process` - Process pending inbox items

## Registry Files (source of truth)
Located at `~/.claude/registry/`:
- agents.json (20 items)
- commands.json (72 items)
- skills.json (2 items)
- prompts.json (1 item)
- apis.json (2 items)
- instructions.json (5 items)
- logs.json (1 item, skipped by sync - not a valid type)

## Environment
- `SYNC_API_KEY` in `.env.local` and on Vercel
- Production URL: https://command-center-app-nine.vercel.app
