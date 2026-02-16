---
name: sync-cc
description: Synchroniseer ~/.claude/registry/ naar Command Center v2 Supabase
user-invocable: true
category: command-center
allowed-tools: Bash(*), Read
---

# Sync naar Command Center

Synchroniseer alle registry data van `~/.claude/registry/` naar de Command Center v2 Supabase database.

## Instructies

1. **Lees de SYNC_API_KEY** uit het CC v2 project:
   ```
   Lees: ~/Projects/command-center-v2/command-center-app/.env.local
   Zoek de waarde van SYNC_API_KEY
   ```

2. **Voer het sync script uit:**
   ```bash
   cd ~/Projects/command-center-v2/command-center-app && SYNC_API_KEY="<gevonden-key>" node scripts/sync-registry.mjs
   ```

3. **Rapporteer het resultaat:**
   - Hoeveel types gesynced
   - Hoeveel items totaal
   - Eventuele errors

4. **Verifieer** door de sync status op te halen:
   ```bash
   curl -s "https://command-center-app-nine.vercel.app/api/sync"
   ```
