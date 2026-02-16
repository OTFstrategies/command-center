---
description: Verrijk extractie data met H&S domeinkennis (losse fase)
---

# H&S Scanning Fase

Verrijk geëxtraheerde data met Heusschen & Schrouff domeinkennis.

## Instructies

Lees en volg de instructies in:
```
~/.claude/agents/hs-docs/extractors/hs-scanner/CLAUDE.md
```

## Input

Verwacht een extractie JSON (output van `/hs-extract`):

```json
{
  "source_file": "bestandsnaam.txt",
  "extracted": {
    "potential_titles": [],
    "steps_found": [],
    "materials_found": [],
    "safety_items_found": []
  }
}
```

## Workflow

### Stap 1: Laad Kennisbank

Lees de H&S kennisbank:
```
~/.claude/agents/hs-docs/knowledge/hs-learned.json
```

### Stap 2: Match & Verrijk

Voor elk geëxtraheerd item:

| Veld | Verrijking |
|------|------------|
| Titels | Match tegen bekende processen/werkinstructies |
| Stappen | Herken H&S terminologie, standaardiseer |
| Materialen | Map naar bekende H&S tools/middelen |
| Veiligheid | Voeg standaard H&S veiligheidspunten toe |

### Stap 3: Filter & Categoriseer

- Verwijder duplicaten
- Categoriseer per relevantie (hoog/medium/laag)
- Markeer items die extra verificatie nodig hebben

## Output

Retourneer verrijkte JSON:

```json
{
  "source_file": "bestandsnaam.txt",
  "enriched": {
    "matched_process": "Naam van herkend H&S proces (indien gevonden)",
    "titles": [
      {"value": "Titel", "confidence": "high|medium|low", "hs_match": true|false}
    ],
    "steps": [
      {"original": "...", "standardized": "...", "hs_terminology": true|false}
    ],
    "materials": [
      {"value": "...", "hs_known": true|false}
    ],
    "safety_points": [
      {"value": "...", "source": "extracted|hs_standard"}
    ]
  },
  "scan_notes": "Opmerkingen over matching en verrijking"
}
```

## Standaard H&S Veiligheidspunten

Deze worden ALTIJD toegevoegd:
- HSF standaard PBM's
- HSF standaard regels, gedrag en veiligheid

## Volgende Stap

Na scanning kun je doorgaan met:
- `/hs-combine` - Combineer alle data en toon aannames
