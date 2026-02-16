---
name: security-scanning
description: Complete security scanning skill voor Shadow's infrastructuur
---

# Security Scanning Skill

## Commands
| Command | Functie |
|---------|---------|
| /security-scan | Volledige scan (7 lagen parallel) |
| /security-secrets | Secrets scan (gitleaks) |
| /security-deps | Dependency scan (npm audit + snyk) |
| /security-code | Code scan (semgrep SAST) |
| /security-containers | Container scan (trivy) |
| /security-database | Database audit (Supabase RLS) |
| /security-report | Compliance rapport |
| /security-fix | Auto-fix veilige items |
| /security-status | Quick dashboard |

## Agents
| Agent | Rol |
|-------|-----|
| security-scanner | Orchestrator - stuurt alle subagents aan |
| secrets-scanner | Scant op gelekte secrets (gitleaks, ggshield) |
| deps-scanner | Scant dependencies (npm audit, snyk) |
| code-scanner | Statische code analyse (semgrep) |
| container-scanner | Docker scanning (trivy) |
| db-scanner | Database audit (Supabase RLS) |
| access-scanner | GitHub toegangscontrole |
| storage-scanner | Bestandsbeveiliging (.gitignore, .env) |
| security-fixer | Auto-fix veilige problemen |
| security-reporter | Compliance rapport generatie |

## Hooks
| Hook | Event | Functie |
|------|-------|---------|
| pre-commit-secrets | PreToolUse (git commit) | Blokkeert commits met secrets |
| check-sensitive-file | PreToolUse (Write/Edit) | Blokkeert schrijven naar .env/.pem/.key |
| session-start-security | UserPromptSubmit | Toont security status bij sessie start |

## Vereiste Tools
- gitleaks, semgrep, trivy, snyk (installeer via scripts/install-tools.ps1)
- gh CLI (voor GitHub API)
- Supabase MCP (voor database checks)

## Configuratie
- Hoofdconfig: config/security-os.json
- Gitleaks regels: config/.gitleaks.toml
- Semgrep regels: config/semgrep-rules.yml
- Trivy config: config/trivy.yaml

## Scan Resultaten
- Laatste: ~/.claude/security/scan-results/latest.json
- Historie: ~/.claude/security/scan-results/history/
- Rapporten: ~/.claude/security/compliance/
