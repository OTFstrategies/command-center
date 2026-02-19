# Command Center (CC v2 Dashboard) — Logboek

## 2026-02-19

### Sessie: CC Middelpunt Upgrade — Hooks Infrastructuur

- **Gedaan:**
  - SQL migratie: activity_log verruimd, entity_versions + usage_statistics + projecten uitgebreid
  - 3 Claude Code hooks aangemaakt: session-end-sync, track-usage, discover-projects
  - Hooks geregistreerd in ~/.claude/settings.json (4 events: PreToolUse, Stop, UserPromptSubmit, SessionStart)
  - Project discovery API endpoint `/api/projects/discover`
  - Sync route: per-item activity logging
  - Sync script: CLI activity tracking
  - Dagstart command herschreven met CC-integratie
  - Alles gedeployed via PR #8
- **Beslissingen:**
  - Hooks draaien achtergrondprocessen in subshells (`( ... ) &`) zodat sessie niet blokkeert
  - SessionStart hook voor project discovery (niet via dagstart command)
  - Feature branch + PR workflow i.p.v. direct push naar master
- **Volgende keer:**
  - Deep scan draaien na alle recente wijzigingen
  - Error boundary homepage
  - Auth op alerts/jobs endpoints

## 2026-02-16

### Sessie: WSL2 Migratie

- **Gedaan:**
  - Project gecloned naar ~/projects/command-center/
  - Standaard bestanden aangemaakt
- **Beslissingen:**
  - Migratie van Windows naar WSL2
- **Volgende keer:**
  - Dependencies installeren
  - Project configuratie voltooien
