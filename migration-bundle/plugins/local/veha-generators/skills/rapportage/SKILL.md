---
name: rapportage
description: This skill should be used when the user asks to "maak een rapport", "genereer rapportage", "nieuw rapport", or "/rapportage". Generates professional VEHA reports and analyses.
---

# VEHA Rapportage Generator

Generate reports and analyses in VEHA corporate style.

## Workflow

### Step 1: Collect Report Data

Gather the following information from the user:

**Report metadata:**
- Report title
- Report number (format: RAP-{YYYY}-{NNN})
- Report type (inspection, research, progress, advisory)
- Report date
- Version

**Principal:**
- Company name
- Contact person
- Reference/order number

**Report author:**
- Name
- Position
- Department

**Summary:**
- Brief summary (management summary, max 3-5 sentences)

**Introduction:**
- Background/reason
- Objective
- Scope/delimitation
- Method

**Findings** (repeat until user is done):
Per finding:
- Title/subject
- Description
- Severity/priority (high/medium/low)
- Evidence/substantiation

**Conclusions:**
- Main conclusions (1-5 points)

**Recommendations** (optional):
Per recommendation:
- Description
- Priority
- Responsible party (optional)
- Deadline (optional)

### Step 2: Show Summary

Display structure and ask for confirmation.

### Step 3: Save JSON

Save data to: `Generators/rapportage/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `titel`, `rapportnummer`, `type`, `datum`, `opdrachtgever` (bedrijfsnaam, contactpersoon), `auteur` (naam, functie), `samenvatting`, `inleiding` (aanleiding, doelstelling, scope, methode), `bevindingen[]` (titel, beschrijving, ernst), `conclusies[]`, `aanbevelingen[]` (beschrijving, prioriteit)

### Step 4: Generate Document

Execute:
```bash
python Generators/rapportage/output/generate_rapportage.py
```

Output: `_output/Rapportage_{Title}_{Date}.docx`

## Report Types

| Type | Typical content |
|------|-----------------|
| inspectie | Visual findings, photos |
| onderzoek | Analysis, data, graphs |
| voortgang | Status, KPIs, planning |
| advies | Recommendations, options |

## After Completion

Report: JSON location, document location, generation status.
