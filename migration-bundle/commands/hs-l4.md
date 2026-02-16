---
description: Start L4 procedure intake - complete flow van extractie tot DOCX output
---

# L4 Procedure Generator

Genereer een H&S L4 Procedure document (.docx).

## Wat je krijgt

```
JIJ: /hs-l4 "inkomende goederen controle"
     ↓
SYSTEEM: output/PR-007-Inkomende-Goederen-Controle.docx
```

## Workflow

### Stap 1: Intake
Verzamel de volgende informatie van de gebruiker:

| Veld | Vraag |
|------|-------|
| Titel | "Wat is de titel van de procedure?" |
| Document nummer | "Wat is het document nummer? (bijv. PR-007)" |
| Doel | "Wat is het doel van deze procedure?" |
| Scope | "Wat valt binnen de scope?" (bullets) |
| RACI rollen | "Welke rollen zijn betrokken?" |
| RACI activiteiten | "Wat zijn de activiteiten met R/A/C/I per rol?" |
| Stappen | "Wat zijn de processtappen?" |
| Control punten | "Hoe wordt dit gecontroleerd?" |
| Afkortingen | "Welke afkortingen worden gebruikt?" |

### Stap 2: JSON Genereren
Bouw de JSON structuur volgens `templates/examples/l4-input-example.json`:

```json
{
  "header": {
    "title": "...",
    "document_number": "PR-XXX",
    "version": "V1.0",
    "document_type": { "checkboxes": { "PR": true, "WI": false, "DS": false, "FO": false } },
    "created_by": "...",
    "department": "...",
    "date": "dd/mm/yyyy",
    "approved_by": "...",
    "certification_standard": "..."
  },
  "change_history": { ... },
  "sections": {
    "purpose_scope": { ... },
    "raci": { ... },
    "content": { ... },
    "control": { ... },
    "abbreviations": { ... }
  }
}
```

### Stap 3: DOCX Genereren
1. Schrijf JSON naar tijdelijk bestand: `output/temp-l4-input.json`
2. Genereer DOCX:
   ```bash
   node scripts/generate-docx.js l4 output/temp-l4-input.json output/[document_number]-[titel].docx
   ```
3. Verwijder tijdelijk JSON bestand
4. Rapporteer output pad aan gebruiker

### Stap 2.5: Optionele Kwaliteitscontrole

Voordat je het document genereert, kun je optioneel:

| Flag | Commando | Beschrijving |
|------|----------|-------------|
| Auto-fix | `node scripts/generate-docx.js l4 input.json output.docx --fix` | Herstel veelvoorkomende fouten |
| Validate | `node scripts/generate-docx.js l4 input.json --validate-only` | Check zonder te genereren |
| Stages | `node scripts/generate-docx.js l4 input.json --stages` | 5-staps progressieve validatie |

## Output Locatie

```
~/.claude/agents/hs-docs/output/
├── PR-007-Inkomende-Goederen-Controle.docx
└── ...
```

## H&S Styling (Automatisch)

Het .docx bestand bevat automatisch:
- H&S kleuren (#002060 blauw)
- Arial font, 11pt
- A4 formaat
- Correcte tabellen en secties

## Voorbeeld Gebruik

```
Gebruiker: /hs-l4
Claude: Wat is de titel van de procedure?
Gebruiker: Inkomende goederen controle
Claude: Wat is het document nummer?
Gebruiker: PR-007
... (verdere intake)
Claude: Document gegenereerd: output/PR-007-Inkomende-Goederen-Controle.docx
```
