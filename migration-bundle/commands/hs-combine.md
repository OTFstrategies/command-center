---
description: Combineer data en presenteer aannames ter verificatie (losse fase)
---

# H&S Combiner Fase

Combineer alle verrijkte data en presenteer aannames voor gebruikersverificatie.

## Instructies

Lees en volg de instructies in:
```
~/.claude/agents/hs-docs/extractors/combiner/CLAUDE.md
```

## Input

Verwacht verrijkte JSON (output van `/hs-scan`):

```json
{
  "source_file": "bestandsnaam.txt",
  "enriched": {
    "titles": [...],
    "steps": [...],
    "materials": [...],
    "safety_points": [...]
  }
}
```

## Workflow

### Stap 1: Combineer Data

Als er meerdere bronnen zijn:
- Merge overlappende items
- Behoud unieke items van elke bron
- Prioriteer high-confidence items

### Stap 2: Identificeer Aannames

Markeer alle aannames met categorieën:

| Code | Categorie | Beschrijving |
|------|-----------|--------------|
| `[A]` | Automatisch afgeleid | Logisch afgeleid uit context |
| `[B]` | H&S standaard | Toegevoegd vanuit H&S kennisbank |
| `[C]` | Conflicterend | Bronnen spreken elkaar tegen |

### Stap 3: Presenteer voor Verificatie

Toon de gebruiker een overzicht:

```
## Gecombineerde Data

### Titel
"[Voorgestelde titel]" [A]

### Materialen
- Item 1
- Item 2 [B] (H&S standaard toegevoegd)

### Veiligheidspunten
- HSF standaard PBM's [B]
- HSF standaard regels [B]
- [Specifiek punt uit bron]

### Stappen
1. Stap 1
2. Stap 2 [A] (volgorde aangenomen)

---
## Aannames ter verificatie

[A] Aannames:
- Titel afgeleid uit bestandsnaam
- Stapvolgorde gebaseerd op document structuur

[B] H&S Standaarden toegevoegd:
- Standaard veiligheidspunten

[C] Conflicten (keuze nodig):
- Geen conflicten gevonden

Klopt dit? Wat moet aangepast worden?
```

## Output

Na verificatie door gebruiker, retourneer definitieve JSON:

```json
{
  "verified": true,
  "combined_data": {
    "title": "...",
    "materials": [...],
    "safety_points": [...],
    "steps": [...]
  },
  "assumptions_accepted": ["A1", "A2", "B1"],
  "user_corrections": []
}
```

## Volgende Stap

Na combineren en verificatie:
- Ga door naar L4/L5 intake voor conversationele verfijning
- Of genereer direct de finale JSON output
