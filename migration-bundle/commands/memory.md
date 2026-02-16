---
name: memory
description: Beheer project memories in Command Center (vervangt Serena memories)
user-invocable: true
category: command-center
allowed-tools: Bash(*), Read, AskUserQuestion
---

# Project Memory Management

Schrijf, lees of verwijder project memories via de Command Center API.

## Instructies

1. **Bepaal de actie** op basis van de context:
   - Als de gebruiker een memory wil opslaan: WRITE
   - Als de gebruiker een memory wil lezen: READ
   - Als de gebruiker een memory wil verwijderen: DELETE
   - Als onduidelijk: vraag via AskUserQuestion

2. **Bepaal het project** — gebruik de huidige working directory naam, of vraag.

3. **Lees de API key:**
   ```
   Lees: ~/Projects/command-center-v2/command-center-app/.env.local
   Zoek: SYNC_API_KEY
   ```

4. **Voer de actie uit:**

   **WRITE:**
   ```bash
   curl -X POST "https://command-center-app-nine.vercel.app/api/projects/<slug>/memories" \
     -H "Content-Type: application/json" \
     -H "x-api-key: <key>" \
     -d '{"name": "<memory-naam>", "content": "<markdown-content>"}'
   ```

   **READ (lijst):**
   ```bash
   curl -s "https://command-center-app-nine.vercel.app/api/projects/<slug>/memories"
   ```

   **READ (specifiek):**
   ```bash
   curl -s "https://command-center-app-nine.vercel.app/api/projects/<slug>/memories/<naam>"
   ```

   **DELETE:**
   ```bash
   curl -X DELETE "https://command-center-app-nine.vercel.app/api/projects/<slug>/memories/<naam>" \
     -H "x-api-key: <key>"
   ```

5. **Rapporteer het resultaat.**

## Slug Conventies

Project slugs zijn lowercase met hyphens in plaats van spaties:
- "Agent OS" → `agent-os`
- "command center v2" → `command-center-v2`
- "security os" → `security-os`
