---
name: security-secrets
description: Scan op gelekte secrets en API keys
user_invocable: true
---

# /security-secrets

Scan het huidige project op gelekte secrets.

## Wat het doet
1. Draait `gitleaks detect` met custom config (`config/.gitleaks.toml`)
2. Draait `gitleaks detect --log-opts="--all"` voor git history
3. Checkt .gitignore completeness (zijn .env, credentials, keys uitgesloten?)
4. Presenteert resultaten per gevonden secret:
   - Bestandspad + regel
   - Type secret (API key, JWT, password, etc.)
   - Severity
   - Aanbevolen actie

## Vereisten
- gitleaks geinstalleerd (check met `gitleaks --version`)

## BELANGRIJK
- NOOIT gevonden secrets tonen in plaintext
- Toon alleen type + locatie + aanbeveling
- Secret rotatie is ALTIJD handmatig door Shadow
