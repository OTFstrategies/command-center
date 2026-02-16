---
description: Start L5 werkinstructie intake - complete flow van extractie tot DOCX output
---

# L5 Werkinstructie Generator

Genereer een H&S L5 Werkinstructie document (.docx).

## Wat je krijgt

```
JIJ: /hs-l5 "IBC container vullen"
     ↓
SYSTEEM: output/WI-023-IBC-Container-Vullen.docx
```

## Workflow

### Stap 1: Intake
Verzamel de volgende informatie van de gebruiker:

| Veld | Vraag |
|------|-------|
| Titel | "Wat is de titel van de werkinstructie? (bijv. WI-023 IBC Vullen)" |
| Benodigdheden | "Welke materialen/tools zijn nodig?" (bullets) |
| Veiligheidspunten | "Welke veiligheidspunten zijn relevant?" (bullets) |
| Stappen | "Wat zijn de instructiestappen?" |
| Foto's per stap | "Welke stappen hebben een foto nodig?" |

### Stap 2: JSON Genereren
Bouw de JSON structuur (flat formaat):

```json
{
  "header": {
    "title": "WI-XXX Titel van de Werkinstructie",
    "version": "V1.0",
    "date": "dd/mm/yyyy"
  },
  "materials": [
    "Materiaal of tool 1",
    "Materiaal of tool 2"
  ],
  "safety": [
    "Draag veiligheidsschoenen en handschoenen",
    "Veiligheidspunt 2"
  ],
  "steps": [
    {
      "number": "1",
      "text": "Staptekst in gebiedende wijs.",
      "photo": "[FOTO: beschrijving]"
    },
    {
      "number": "2",
      "text": "Tweede stap.",
      "photo": null
    }
  ]
}
```

### Stap 3: DOCX Genereren
1. Schrijf JSON naar tijdelijk bestand: `output/temp-l5-input.json`
2. Genereer DOCX:
   ```bash
   node scripts/generate-docx.js l5 output/temp-l5-input.json output/[titel].docx
   ```
3. Verwijder tijdelijk JSON bestand
4. Rapporteer output pad aan gebruiker

### Stap 2.5: Optionele Kwaliteitscontrole

Voordat je het document genereert, kun je optioneel:

| Flag | Commando | Beschrijving |
|------|----------|-------------|
| Auto-fix | `node scripts/generate-docx.js l5 input.json output.docx --fix` | Herstel veelvoorkomende fouten |
| Validate | `node scripts/generate-docx.js l5 input.json --validate-only` | Check zonder te genereren |
| Stages | `node scripts/generate-docx.js l5 input.json --stages` | 5-staps progressieve validatie |

## L5 Formaat (Strikt)

Het uniforme L5 formaat bevat ALLEEN:
- **Benodigdheden** - Tools en materialen
- **Veiligheid** - Veiligheidspunten (inclusief standaard H&S)
- **Stappentabel** - 50/50 kolommen: Beschrijving | Foto

Geen extra secties toevoegen. Uniformiteit is kritiek.

## Schrijfstijl Transformatie

| Van (passief) | Naar (gebiedende wijs) |
|---------------|------------------------|
| "De operator moet..." | "Doe..." |
| "Er wordt geopend..." | "Open..." |
| "Men controleert..." | "Controleer..." |

## Standaard Veiligheidspunten (Altijd)

Voeg altijd toe:
- Draag veiligheidsschoenen en handschoenen
- Volg HSF standaard regels en veiligheid

## Output Locatie

```
~/.claude/agents/hs-docs/output/
├── WI-023-IBC-Container-Vullen.docx
└── ...
```

## Voorbeeld Gebruik

```
Gebruiker: /hs-l5
Claude: Wat is de titel van de werkinstructie?
Gebruiker: IBC container vullen
Claude: Welke materialen zijn nodig?
Gebruiker: IBC, vulslang, weegschaal
... (verdere intake)
Claude: Document gegenereerd: output/WI-023-IBC-Container-Vullen.docx
```
