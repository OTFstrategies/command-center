---
description: H&S Document Generatie - Kies L4 procedure of L5 werkinstructie
---

# H&S Document Generatie

Dit is het hoofdmenu voor Heusschen & Schrouff document generatie.

## Wat wil je maken?

Vraag de gebruiker met AskUserQuestion:

**Vraag:** "Welk type document wil je genereren?"

**Opties:**
1. **L4 Procedure** - Gedetailleerde bedrijfsprocedure met rollen, verantwoordelijkheden en stroomdiagrammen
2. **L5 Werkinstructie** - Praktische stap-voor-stap werkinstructie met materialen en veiligheidspunten

## Vervolgacties

| Keuze | Verwijs naar |
|-------|--------------|
| L4 Procedure | `/hs-l4` |
| L5 Werkinstructie | `/hs-l5` |

## Losse Fases (Geavanceerd)

Voor handmatige controle over individuele fases:

| Command | Beschrijving |
|---------|-------------|
| `/hs-extract` | Alleen data extractie uit bestanden |
| `/hs-scan` | Alleen H&S domeinverrijking |
| `/hs-combine` | Alleen data combineren + aannames tonen |

## Engine Analyses (Geavanceerd)

| Command | Beschrijving |
|---------|-------------|
| `--glossary-check` | Terminologie analyse (synoniemen, near-duplicates) |
| `--style-check l5 input.json` | Schrijfstijl controle met score |
| `--ifs-check input.json` | IFS compliance check + gap analysis |

Gebruik vanuit `~/.claude/agents/hs-docs/`:
```bash
node scripts/generate-docx.js --glossary-check
```

## Input Bestanden

Ondersteunde formaten:
- `.txt` - Transcripten, notities, platte tekst
- `.docx` - Word documenten

Geef het pad naar je input bestand(en) mee aan het command:
```
/hs-l5 "C:\pad\naar\transcript.txt"
```
