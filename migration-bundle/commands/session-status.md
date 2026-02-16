---
name: session-status
description: Genereer of update STATUS.md met huidige project staat
user_invocable: true
---

# /session-status

Genereer of update een STATUS.md in de huidige project root.

## Template

Gebruik dit template:

```
# STATUS — [Project Naam]
Laatst bijgewerkt: [YYYY-MM-DD HH:MM]

## Huidige Staat
[1-2 zinnen over de algemene staat van het project]

## Deze Sessie
- [Lijst van wat er gedaan is deze sessie]

## Open Items
- [Lijst van wat nog moet gebeuren]

## Volgende Stappen
- [Aanbevolen volgende acties, in volgorde van prioriteit]

## Bekende Issues
- [Eventuele bugs, performance problemen, of technische schuld]
```

## Instructies

1. Lees bestaande STATUS.md als die er is (update, niet overschrijven)
2. Analyseer recent git log: `git log --oneline -15`
3. Check huidige git status: `git status`
4. Check of er uncommitted wijzigingen zijn
5. Genereer STATUS.md met bovenstaand template
6. Bewaar in de project root (naast CLAUDE.md als die er is)
7. Bevestig aan Shadow wat er gegenereerd is
