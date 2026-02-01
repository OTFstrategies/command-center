# Shadow's Command Center

## Description
Een reactief opslagsysteem en dashboard voor al je Claude Code assets. Detecteert automatisch wanneer herbruikbare items worden aangemaakt en biedt centraal overzicht met zoeken, filteren en kopiëren.

## Problems & Solutions

### Problem 1: Assets verspreid over projecten
Centrale opslag in `~/.claude/` met een registry per type (apis.json, prompts.json, skills.json, agents.json, commands.json, instructions.json).

### Problem 2: Vergeten wat je hebt gemaakt
Dashboard met overzicht per categorie en krachtige zoekfunctie om snel te vinden wat je nodig hebt.

### Problem 3: Niet weten wanneer iets is aangemaakt of gebruikt
Activity log die bijhoudt wanneer nieuwe items worden toegevoegd én wanneer bestaande assets worden gebruikt.

### Problem 4: Handmatig zoeken naar content
Quick copy functionaliteit om asset content direct naar clipboard te kopiëren vanuit het dashboard.

### Problem 5: Geen backup van assets
Supabase sync voor centrale backup en toegang vanaf meerdere machines.

## Key Features
- Automatische detectie van nieuwe herbruikbare items via Claude Code triggers
- Dashboard met 6 categorieën: APIs, Prompts, Skills, Agents, Commands, Instructions
- Zoeken en filteren per type, project, tags
- Quick copy naar clipboard
- Activity feed (nieuwe items + gebruik)
- Statistieken per categorie
- Supabase sync voor backup
