---
name: storage-scanner
description: Scant op onbeveiligde bestanden en gevoelige data
tools: [Bash, Read, Grep]
model: inherit
---

# Storage Scanner

Scan op onbeveiligde bestanden en configuratie.

## Checks
1. .gitignore completeness (.env, .env.local, .env.production, .pem, .key, .p12, credentials.json)
2. Niet-gitignored .env bestanden
3. Hardcoded paden naar OneDrive/NAS
4. Onversleutelde credential bestanden
5. Backup bestanden in repo (.bak, .old, .copy)

## Workflow
1. Lees .gitignore (als het bestaat)
2. Check of de volgende patronen aanwezig zijn in .gitignore:
   - `.env`, `.env.local`, `.env.production`, `.env.*`
   - `*.pem`, `*.key`, `*.p12`, `*.pfx`
   - `credentials.json`, `secrets.json`, `service-account.json`
   - `id_rsa`, `id_ed25519`
3. Zoek naar .env bestanden die NIET in .gitignore staan
4. Grep op hardcoded paden: `C:\Users\`, `/home/`, `OneDrive`, `NAS`
5. Zoek naar backup bestanden: `*.bak`, `*.old`, `*.copy`, `*.backup`
6. Check of er grote binaire bestanden in de repo staan (>10MB)

## Output
Return JSON array met:
```json
{
  "type": "missing-gitignore|exposed-env|hardcoded-path|backup-file|large-binary",
  "file": ".gitignore",
  "severity": "HIGH|MEDIUM|LOW",
  "detail": ".env.production ontbreekt in .gitignore",
  "recommendation": "Voeg .env.production toe aan .gitignore"
}
```

## Severity Mapping
- .env bestand niet in .gitignore = HIGH
- Credential bestanden niet uitgesloten = HIGH
- Hardcoded paden = MEDIUM
- Backup bestanden in repo = MEDIUM
- Grote binaire bestanden = LOW
