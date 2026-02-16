---
description: Extraheer data uit .txt en .docx bestanden (losse fase)
---

# H&S Extractie Fase

Alleen de extractie fase uitvoeren - haalt ruwe data uit input bestanden.

## Gebruik

```bash
/hs-extract "C:\pad\naar\bestand.txt"
/hs-extract "C:\pad\naar\document.docx"
```

## Workflow

### Stap 1: Bestandstype Detectie

Bepaal het bestandstype en route naar de juiste extractor:

| Extensie | Extractor |
|----------|-----------|
| `.txt` | `~/.claude/agents/hs-docs/extractors/txt-extractor/CLAUDE.md` |
| `.docx` | `~/.claude/agents/hs-docs/extractors/docx-extractor/CLAUDE.md` |

### Stap 2: TXT Extractie

Voor `.txt` bestanden:
1. Lees het bestand
2. Detecteer structuur (transcript, notities, lijst)
3. Extraheer:
   - Potentiële titels
   - Stappen/acties
   - Materialen/tools genoemd
   - Veiligheidsitems
   - Ongestructureerde content

### Stap 3: DOCX Extractie

Voor `.docx` bestanden:
1. Gebruik `~/.claude/agents/hs-docs/tools/read_docx.py` om te lezen:
   ```bash
   python ~/.claude/agents/hs-docs/tools/read_docx.py "pad/naar/document.docx"
   ```
2. Extraheer dezelfde velden als TXT
3. Behoud ook formatting hints (headers, lijsten, tabellen)

## Output

Retourneer een JSON object met ruwe extractie:

```json
{
  "source_file": "bestandsnaam.txt",
  "source_type": "txt|docx",
  "extracted": {
    "potential_titles": [],
    "steps_found": [],
    "materials_found": [],
    "safety_items_found": [],
    "unstructured_content": ""
  },
  "extraction_notes": "Opmerkingen over de extractie"
}
```

## Volgende Stap

Na extractie kun je doorgaan met:
- `/hs-scan` - Verrijk met H&S domeinkennis
- `/hs-combine` - Combineer en toon aannames
