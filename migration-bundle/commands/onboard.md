---
name: onboard
description: Detecteer project structuur en sla op in Command Center
user-invocable: true
category: command-center
allowed-tools: Bash(*), Read, Glob, Grep, AskUserQuestion
---

# Project Onboarding

Analyseer het huidige project en sla de metadata op in Command Center.

## Instructies

1. **Detecteer project info:**
   - Lees `package.json` voor tech stack en scripts (build, test, dev)
   - Lees `CLAUDE.md` voor project beschrijving
   - Check voor `tsconfig.json`, `pyproject.toml`, `Cargo.toml`, etc. voor taal
   - Check voor `.env*` bestanden (niet de inhoud, alleen bestaan)
   - Check voor deployment config (vercel.json, Dockerfile, etc.)

2. **Stel samen:**
   ```json
   {
     "description": "...",
     "tech_stack": ["Next.js", "Supabase", "Tailwind"],
     "build_command": "npm run build",
     "test_command": "npm test",
     "dev_command": "npm run dev",
     "languages": ["typescript"],
     "live_url": "https://...",
     "repo_url": "https://github.com/..."
   }
   ```

3. **Toon aan gebruiker en vraag bevestiging** via AskUserQuestion.

4. **Lees de API key:**
   ```
   Lees: ~/Projects/command-center-v2/command-center-app/.env.local
   Zoek: SYNC_API_KEY
   ```

5. **Push naar CC v2:**
   ```bash
   curl -X PATCH "https://command-center-app-nine.vercel.app/api/projects/<slug>" \
     -H "Content-Type: application/json" \
     -H "x-api-key: <key>" \
     -d '<json>'
   ```

6. **Rapporteer het resultaat.**

## Slug Conventies

Project slugs zijn lowercase met hyphens in plaats van spaties:
- "Agent OS" -> `agent-os`
- "command center v2" -> `command-center-v2`

## Detectie Hints

| Bestand | Detecteert |
|---------|-----------|
| package.json | Node.js, scripts, dependencies (Next.js, React, etc.) |
| tsconfig.json | TypeScript |
| pyproject.toml | Python |
| Cargo.toml | Rust |
| go.mod | Go |
| vercel.json / .vercel/ | Vercel deployment |
| Dockerfile | Docker deployment |
| .github/workflows/ | GitHub Actions CI/CD |
