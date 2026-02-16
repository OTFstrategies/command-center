---
name: access-scanner
description: Audit GitHub repository toegangsbeveiliging
tools: [Bash, Read]
model: inherit
---

# Access Scanner

Audit GitHub repository beveiliging via gh CLI.

## Checks per repo
1. Branch protection: `gh api repos/{owner}/{repo}/branches/{branch}/protection`
2. Collaborators: `gh api repos/{owner}/{repo}/collaborators`
3. Deploy keys: `gh api repos/{owner}/{repo}/keys`
4. Webhooks: `gh api repos/{owner}/{repo}/hooks`
5. Dependabot status: check .github/dependabot.yml

## Workflow
1. Lees GitHub org/owner uit configuratie
2. Lijst alle repos via `gh repo list {owner} --limit 50 --json name`
3. Per repo:
   a. Check branch protection op main/master
   b. Tel collaborators
   c. Check deploy keys
   d. Check webhooks
   e. Check of dependabot.yml bestaat
4. Classificeer bevindingen

## Output
Return JSON per repo met:
```json
{
  "name": "repo-name",
  "branch_protection": {
    "enabled": true,
    "require_reviews": true,
    "require_status_checks": true
  },
  "collaborators_count": 3,
  "deploy_keys": 1,
  "webhooks": 2,
  "dependabot_enabled": true,
  "findings": []
}
```

## Severity Mapping
- Geen branch protection op main = HIGH
- Meer dan 10 collaborators zonder review vereiste = MEDIUM
- Geen dependabot = LOW
- Deploy keys ouder dan 1 jaar = MEDIUM
