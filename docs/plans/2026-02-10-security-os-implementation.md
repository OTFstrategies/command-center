# Security OS - Volledig Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bouw een compleet 9-laags beveiligingssysteem als Claude Code plugin dat Shadow's gehele infrastructuur beschermt — 22 GitHub repos, 5 Supabase projecten, Docker containers, OneDrive en Synology NAS.

**Architecture:** Een lokale Claude Code plugin (`security-os`) met slash commands, agents, hooks en scripts. Elke beveiligingslaag heeft een eigen subagent die parallel draait. Real-time bescherming via hooks, CI/CD via GitHub Actions, en dagelijkse automatische scans via headless mode.

**Tech Stack:** gitleaks, ggshield (GitGuardian), npm audit, Snyk CLI, Semgrep, Trivy, gh CLI, Supabase MCP, Sentry MCP, Python (hooks), Bash (scripts), GitHub Actions

**Huidige Security Status (KRITIEK):**
- 27+ Supabase tabellen ZONDER RLS
- 50+ overly permissive RLS policies
- 0 GitHub repos met branch protection
- 0 repos met Dependabot
- 0 secret scanning
- 9 publieke repos zonder enige beveiliging
- Geen security tools geinstalleerd

**Gevonden Patronen (exact uit bestaande setup):**
- Plugin pad: `~/.claude/plugins/local/{naam}/`
- Plugin.json: `commands_dir: "../commands"`, `agents_dir: "../agents"`
- Settings: `"security-os@local": true`
- Hooks: Python3 via `${CLAUDE_PLUGIN_ROOT}`, PreToolUse/PostToolUse/UserPromptSubmit
- Commands: frontmatter met `name`, `description`, `user_invocable: true`
- Agents: frontmatter met `name`, `description`, `tools`, `color`, `model: inherit`
- Registry: `items[]` array met `id`, `name`, `path`, `description`, `created`, `project`, `tags`

---

## Task 1: Plugin Scaffolding

Maak de complete mappenstructuur en plugin registratie aan.

**Files:**
- Create: `~/.claude/plugins/local/security-os/.claude-plugin/plugin.json`
- Create: `~/.claude/plugins/local/security-os/commands/` (directory)
- Create: `~/.claude/plugins/local/security-os/agents/` (directory)
- Create: `~/.claude/plugins/local/security-os/hooks/` (directory)
- Create: `~/.claude/plugins/local/security-os/scripts/` (directory)
- Create: `~/.claude/plugins/local/security-os/config/` (directory)
- Create: `~/.claude/plugins/local/security-os/templates/` (directory)
- Create: `~/.claude/plugins/local/security-os/skills/security-scanning/` (directory)
- Create: `~/.claude/security/scan-results/history/` (directory)
- Create: `~/.claude/security/compliance/` (directory)
- Modify: `~/.claude/settings.json` — add `"security-os@local": true` to enabledPlugins
- Modify: `~/.claude/plugins/installed_plugins.json` — add plugin entry
- Modify: `~/.claude/registry/commands.json` — add 9 security command entries
- Modify: `~/.claude/registry/agents.json` — add 3 agent entries
- Modify: `~/.claude/registry/skills.json` — add security-scanning entry

**Step 1: Create all directories**

```bash
mkdir -p "$HOME/.claude/plugins/local/security-os/.claude-plugin"
mkdir -p "$HOME/.claude/plugins/local/security-os/commands"
mkdir -p "$HOME/.claude/plugins/local/security-os/agents"
mkdir -p "$HOME/.claude/plugins/local/security-os/hooks"
mkdir -p "$HOME/.claude/plugins/local/security-os/scripts"
mkdir -p "$HOME/.claude/plugins/local/security-os/config"
mkdir -p "$HOME/.claude/plugins/local/security-os/templates"
mkdir -p "$HOME/.claude/plugins/local/security-os/skills/security-scanning"
mkdir -p "$HOME/.claude/security/scan-results/history"
mkdir -p "$HOME/.claude/security/compliance"
```

**Step 2: Write plugin.json**

```json
{
  "name": "security-os",
  "version": "1.0.0",
  "description": "Security OS - 9-laags beveiligingssysteem voor Shadow's complete infrastructuur",
  "author": { "name": "Shadow" },
  "commands_dir": "../commands",
  "agents_dir": "../agents"
}
```

**Step 3: Register in settings.json** — add `"security-os@local": true`

**Step 4: Register in installed_plugins.json** — add entry with installPath

**Step 5: Verify** — grep for security-os in both files

**Step 6: Commit** — `feat(security-os): scaffold plugin structure and registration`

---

## Task 2: Centrale Configuratie

**Files:**
- Create: `config/security-os.json` — centrale config met repos, supabase projects, tools
- Create: `config/.gitleaks.toml` — custom rules voor Supabase, Vercel, Anthropic keys
- Create: `config/semgrep-rules.yml` — custom SAST regels voor Next.js/TS/Supabase
- Create: `config/trivy.yaml` — container scan configuratie
- Create: `config/.trivyignore` — false positive exclusions
- Create: `config/.semgrepignore` — exclude node_modules, tests, build dirs

**Step 1: Write security-os.json**

Bevat:
- `github_owner`: "OTFstrategies"
- `repos.public[]`: 9 repos met namen
- `repos.private[]`: 13+ repos met namen
- `repos.default_branches{}`: mapping per repo (main vs master)
- `supabase_projects{}`: 5 projects met IDs en risk levels
- `tools{}`: per tool enabled/disabled, install command, config path
- `auto_fix{}`: wat wel/niet automatisch gefixed mag worden
- `notifications{}`: severity drempels

**Step 2: Write .gitleaks.toml**

Custom rules bovenop defaults:
- `supabase-service-role-key`: JWT pattern met service_role keyword
- `supabase-anon-key`: JWT pattern
- `vercel-token`: Vercel auth token pattern
- `anthropic-api-key`: `sk-ant-` prefix pattern
- `generic-password-assignment`: hardcoded wachtwoord toewijzingen
- Allowlist: node_modules, .next, dist, build, .env.example

**Step 3: Write semgrep-rules.yml**

Custom SAST regels:
- `supabase-service-key-client-side`: Detecteert service_role key in createClient()
- `supabase-rls-bypass`: Waarschuwt bij .from().select() zonder RLS check
- `nextjs-dangerous-html`: XSS via innerHTML injection
- `env-secret-in-client-component`: Server env vars in client components
- `hardcoded-url-with-credentials`: URLs met ingebedde credentials
- `supabase-raw-sql-interpolation`: SQL injection via string interpolatie
- `console-log-sensitive`: Logging van tokens/keys/secrets
- `missing-auth-check-api-route`: API routes zonder auth

**Step 4-6: Write trivy.yaml, .trivyignore, .semgrepignore**

**Step 7: Commit** — `feat(security-os): add tool configurations`

---

## Task 3: Tool Installatie

**Files:**
- Create: `scripts/install-tools.ps1` — installeer alle 6 tools
- Create: `scripts/verify-tools.ps1` — verifieer alle tools beschikbaar

**Step 1: Write install-tools.ps1**

PowerShell script dat:
1. gitleaks installeert via `scoop install gitleaks`
2. ggshield installeert via `pip install ggshield`
3. snyk installeert via `npm install -g snyk`
4. semgrep installeert via `pip install semgrep`
5. trivy installeert via `scoop install trivy`
6. Verifieert gh CLI al geinstalleerd
7. Toont samenvatting tabel met status per tool
8. Herinnert aan API key setup

**Step 2: Write verify-tools.ps1** — controleert alle tools

**Step 3: Run install** — `powershell -ExecutionPolicy Bypass -File install-tools.ps1`

**Step 4: Verify** — alle tools tonen `[OK]`

**Step 5: Commit** — `feat(security-os): add tool installation scripts`

---

## Task 4: KRITIEK — Supabase RLS Reparatie

**27+ tabellen missen RLS. Dit is de hoogste prioriteit.**

**Step 1: Enable RLS op Proceshuis-HSF** (project `qfhsctnvwsneaujcgpkp`)

Migration `enable_rls_missing_tables`:
```sql
ALTER TABLE public.document_blokken ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_niveaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_secties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documenten ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raci_toewijzingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standaardzin_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standaardzinnen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
```

**Step 2: Verify** — SQL query: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'`

**Step 3: Enable RLS op Proceshuis Werkplaats** (project `ielwgkjacynajoudwaqc`)

Migration `enable_rls_all_public_tables`:
```sql
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_stappen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_versies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projecten ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taken ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.probleem_meldingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taak_stappen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bronbestanden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codeer_stappen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversie_stappen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afdelingen ENABLE ROW LEVEL SECURITY;
```

Plus basis authenticated SELECT policies voor tabellen die nog geen policies hebben.

**Step 4: Verify** — Same SQL query on this project.

**Step 5: Enable RLS op VEHA Hub** (project `ikpmlhmbooaxfrlpzcfa`)

Migration `enable_rls_missing`:
```sql
ALTER TABLE public.project_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
```

Plus CRUD policies voor kanban_tasks (authenticated users).

**Step 6: Verify all 5 projects** — Run `get_advisors(type="security")` on each.

**Step 7: Save results** — Write before/after to scan-results.

---

## Task 5: KRITIEK — GitHub Branch Protection

**Step 1: Public repos (9)** — branch protection rules via `gh api`:
- `allow_force_pushes: false`
- `allow_deletions: false`
- `enforce_admins: true`

Repos: command-center-v2 (master), veha-app (master), command-center (main), Proceshuis-VEHA (main), gantt-dashboard (master), design-os (main), design-os1 (master), design-os-template (master), claude-kennisbase

**Step 2: Private repos** — repository rulesets via `gh api repos/{}/rulesets`:
- deletion rule
- non_fast_forward rule

**Step 3: Verify** — `gh api repos/{}/branches/{}/protection` per repo

---

## Task 6: KRITIEK — Dependabot Activeren

**Step 1: Detecteer ecosystemen per repo** (package.json, Dockerfile, requirements.txt)

**Step 2: Deploy dependabot.yml** per repo via `gh api`:
- npm ecosystem (bijna alle repos)
- docker ecosystem (repos met Dockerfile)
- github-actions ecosystem (repos met workflows)

**Step 3: Enable vulnerability alerts** — `gh api repos/{}/vulnerability-alerts -X PUT`

**Step 4: Verify** — dependabot.yml aanwezig in alle repos

---

## Task 7: KRITIEK — Eerste Secrets Scan

**Step 1: Scan alle 9 publieke repos** (hoogste risico)

Per repo:
```bash
gh repo clone OTFstrategies/{repo} /tmp/{repo} -- --depth=50
gitleaks detect --source /tmp/{repo} --config config/.gitleaks.toml --report-format json
```

**Step 2: Scan git history** — `gitleaks detect --log-opts="--all"`

**Step 3: Classificeer** — CRITICAL/HIGH/MEDIUM/LOW

**Step 4: Rapporteer** — Presenteer aan Shadow met locatie en instructies

**Step 5: Save** — Write to scan-results/initial-secrets-scan.json

---

## Task 8: Secret Scanning Activeren (Public Repos)

**Step 1: Enable** per publieke repo via `gh api`:
```bash
gh api repos/OTFstrategies/{repo} -X PATCH \
  -f "security_and_analysis[secret_scanning][status]=enabled" \
  -f "security_and_analysis[secret_scanning_push_protection][status]=enabled"
```

**Step 2: Verify** — `gh api repos/{} --jq '.security_and_analysis.secret_scanning.status'`

Note: Niet beschikbaar op private repos met GitHub Free. Gitleaks dekt dit lokaal.

---

## Task 9: Slash Commands (9 stuks)

**Files:** 9 markdown bestanden in `commands/`

### security-scan.md (hoofd-entry point)
- Bepaalt scope (huidig project, --all, of specifiek)
- Dispatcht 7 parallelle subagents via Task tool
- Verzamelt resultaten, classificeert severity
- Berekent Security Score (0-100)
- Presenteert resultaat in Nederlands
- Slaat op in scan-results/latest.json + history/

### security-secrets.md
- gitleaks detect + ggshield scan
- .gitignore completeness check
- Git history scan
- Resultaten per gevonden secret

### security-deps.md
- npm audit --json
- snyk test --json
- Top kwetsbaarheden met fix-suggesties

### security-code.md
- semgrep scan met auto + custom regels
- Groepering: Injection, Auth, Data Exposure, Config
- Uitleg in simpel Nederlands per bevinding

### security-containers.md
- trivy config (Dockerfile check)
- trivy fs (filesystem scan)
- trivy image (als Docker draait)

### security-database.md
- get_advisors(security) per 5 Supabase projecten
- RLS status SQL query per project
- Permissieve policies check
- Presentatie per project in tabel

### security-report.md
- Leest latest.json
- Genereert compliance rapport met template
- OWASP Top 10 mapping
- AVG/GDPR basis checklist
- Trend analyse
- Slaat op in compliance/

### security-fix.md
- Leest latest.json
- Categoriseert fixbare items
- Toont fix-plan voor goedkeuring
- Voert uit: npm audit fix, .gitignore, branch protection
- NOOIT: secret rotatie, major upgrades, RLS wijzigingen, code logic

### security-status.md
- Quick dashboard: score, issues per laag, trend
- Vergelijkt met vorige 5 scans
- Waarschuwt bij openstaande critical/high

**Commit:** `feat(security-os): add all 9 slash commands`

---

## Task 10: Agents (10 stuks)

**Files:** 10 markdown bestanden in `agents/`

### security-scanner.md (orchestrator)
- Tools: Bash, Read, Write, Grep, Glob, Task, Supabase MCP
- Dispatcht 7 subagents parallel
- Combineert resultaten
- Berekent score
- Schrijft latest.json

### secrets-scanner.md
- Tools: Bash, Read, Grep
- gitleaks detect + ggshield
- .gitignore check
- Git history scan

### deps-scanner.md
- Tools: Bash, Read
- npm audit --json
- snyk test --json

### code-scanner.md
- Tools: Bash, Read
- semgrep scan met custom + auto regels

### container-scanner.md
- Tools: Bash, Read
- trivy config + trivy fs + trivy image

### db-scanner.md
- Tools: Supabase MCP (get_advisors, execute_sql, list_tables)
- RLS status check
- Permissieve policies audit

### access-scanner.md
- Tools: Bash, Read
- gh CLI: branch protection, collaborators, deploy keys, webhooks

### storage-scanner.md
- Tools: Bash, Read, Grep
- .gitignore completeness
- .env file detection
- OneDrive/NAS path checks

### security-fixer.md
- Tools: Bash, Read, Write, Edit, Grep, Glob
- Auto-fix: npm audit fix, .gitignore, branch protection
- NOOIT: secrets, major upgrades, RLS, code logic

### security-reporter.md
- Tools: Read, Write, Grep, Glob
- Compliance rapport generatie
- OWASP mapping, AVG/GDPR checklist, trends

**Commit:** `feat(security-os): add all 10 security agents`

---

## Task 11: Hooks (3 stuks)

**Files:**
- Create: `hooks/hooks.json`
- Create: `hooks/pre-commit-secrets.py`
- Create: `hooks/check-sensitive-file.py`
- Create: `hooks/session-start-check.py`

### hooks.json
- PreToolUse > Bash matcher > pre-commit-secrets.py (timeout: 30s)
- PreToolUse > Write|Edit matcher > check-sensitive-file.py (timeout: 10s)
- UserPromptSubmit > session-start-check.py (timeout: 15s)

### pre-commit-secrets.py
- Triggert alleen bij `git commit` commands
- Draait `gitleaks protect --staged`
- Bij leaks: `decision: block` met waarschuwing
- Bij fout/timeout: laat door (fail open)

### check-sensitive-file.py
- Checkt file_path tegen sensitive patronen (.env, .pem, .key, credentials, secrets)
- Bij match: `decision: block` met waarschuwing

### session-start-check.py
- Leest latest.json scan resultaten
- Als critical/high > 0: toont waarschuwing met aantallen
- Als geen scan results: herinnert aan /security-scan
- Altijd `decision: allow` (alleen informatie)

**Commit:** `feat(security-os): add security hooks`

---

## Task 12: GitHub Actions Security Pipeline

**Files:**
- Create: `templates/github-actions-security.yml`
- Create: `scripts/deploy-workflows.ps1`

### github-actions-security.yml
Jobs:
1. **secrets-scan**: gitleaks/gitleaks-action@v2
2. **dependency-scan**: npm ci + npm audit (if package.json exists)
3. **code-scan**: returntocorp/semgrep-action@v1 (typescript, nextjs, react, owasp-top-ten)
4. **container-scan**: aquasecurity/trivy-action (if Dockerfile exists)
5. **security-summary**: combineert resultaten in GitHub Step Summary

Triggers: push main/master, pull_request, weekly schedule (maandag 06:00 UTC)

### deploy-workflows.ps1
- Lijst alle repos via `gh repo list`
- Base64 encode workflow file
- Per repo: create of update via `gh api`

**Deploy:** Run script naar alle 22 repos

**Commit:** `feat(security-os): add GitHub Actions security pipeline`

---

## Task 13: Skill Definitie

**Files:** Create `skills/security-scanning/SKILL.md`

Bevat:
- Command overzicht tabel
- Tool vereisten
- Config locaties
- Quick reference

**Commit:** `feat(security-os): add security-scanning skill`

---

## Task 14: Registry Updates

**Modify:**
- `registry/commands.json` — 9 nieuwe entries (security-scan + 8 sub-commands)
- `registry/agents.json` — 3 entries (scanner, fixer, reporter)
- `registry/skills.json` — 1 entry (security-scanning)

Alle entries volgen exact het bestaande format met id, name, path, description, created, project, tags.

**Commit:** `feat(security-os): register all in Command Center`

---

## Task 15: Scheduled Scans

**Files:**
- Create: `scripts/scheduled-scan.bat` — claude headless mode daily scan
- Create: `scripts/setup-scheduler.ps1` — Windows Task Scheduler configuratie

### scheduled-scan.bat
- Draait `claude -p "/security-scan --all"` met allowedTools
- Output naar scan-results/scheduled-{timestamp}.txt
- Log naar scheduler.log

### setup-scheduler.ps1
- Maakt Windows Task: dagelijks om 07:00
- AllowStartIfOnBatteries, StartWhenAvailable, RunOnlyIfNetworkAvailable

**Commit:** `feat(security-os): add scheduled daily scan`

---

## Task 16: Compliance Rapport Template

**Files:**
- Create: `templates/report-template.md` — volledig template met placeholders
- Create: `templates/scan-result-schema.json` — JSON schema voor scan resultaten

### report-template.md
Secties:
1. Executive Summary (score, counts)
2. Bevindingen per Laag (tabel)
3. OWASP Top 10 Status (A01-A10 mapping)
4. AVG/GDPR Basis (5 vereisten)
5. Trend Analyse (laatste 10 scans)
6. Actieplan (kritiek/hoog/medium)

**Commit:** `feat(security-os): add compliance templates`

---

## Task 17: End-to-End Verificatie

**Step 1:** Verify plugin loaded (nieuwe sessie, check /security-* commands)
**Step 2:** Test /security-secrets
**Step 3:** Test /security-deps
**Step 4:** Test /security-database
**Step 5:** Test /security-scan (full, parallel subagents)
**Step 6:** Test /security-status
**Step 7:** Test /security-report
**Step 8:** Test /security-fix
**Step 9:** Test pre-commit hook (commit met fake secret)
**Step 10:** Test sensitive file hook (bewerk .env)
**Step 11:** Verify GitHub Actions workflow zichtbaar
**Step 12:** Generate eerste compliance rapport

---

## Prioriteit Overzicht

| Task | Beschrijving | Prioriteit | Duur |
|------|-------------|-----------|------|
| 1 | Plugin scaffolding | Setup | ~5 min |
| 2 | Configuratie | Setup | ~10 min |
| 3 | Tool installatie | Setup | ~15 min |
| **4** | **Supabase RLS fix** | **KRITIEK** | ~20 min |
| **5** | **Branch protection** | **KRITIEK** | ~15 min |
| **6** | **Dependabot** | **KRITIEK** | ~15 min |
| **7** | **Secrets scan** | **KRITIEK** | ~20 min |
| 8 | Secret scanning | HOOG | ~10 min |
| 9 | Slash commands (9x) | KERN | ~30 min |
| 10 | Agents (10x) | KERN | ~30 min |
| 11 | Hooks (3x) | KERN | ~15 min |
| 12 | GitHub Actions | HOOG | ~15 min |
| 13 | Skill definitie | LAAG | ~5 min |
| 14 | Registry updates | LAAG | ~10 min |
| 15 | Scheduled scans | MEDIUM | ~10 min |
| 16 | Compliance template | MEDIUM | ~10 min |
| 17 | E2E verificatie | KERN | ~30 min |
