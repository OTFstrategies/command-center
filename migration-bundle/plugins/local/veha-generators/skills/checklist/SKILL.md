---
name: checklist
description: This skill should be used when the user asks to "maak een checklist", "genereer checklist", "nieuwe checklist", or "/checklist". Generates professional VEHA quality control checklists.
---

# VEHA Checklist Generator

Generate quality control checklists in VEHA corporate style.

## Workflow

### Step 1: Collect Checklist Data

Gather the following information from the user:

**Checklist metadata:**
- Title of the checklist
- Category (e.g. handover, maintenance, inspection, safety)
- Version number (e.g. 1.0)
- Responsible department

**Project/context (optional):**
- Project name
- Location
- Date

**Sections** (repeat until user is done):
Per section:
- Section title
- Check items in this section

**Per check item:**
- Description
- Type: yes/no | ok/nok | value (input field) | n/a option
- Required or optional

### Step 2: Show Summary

Display checklist structure and ask for confirmation.

### Step 3: Save JSON

Save data to: `Generators/checklist/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `titel`, `categorie`, `versie`, `afdeling`, `project` (naam, locatie, datum), `secties[]` (titel, items[]: omschrijving, type, verplicht), `controleur`

### Step 4: Generate Document

Execute:
```bash
python Generators/checklist/output/generate_checklist.py
```

Output: `_output/Checklist_{Title}_{Date}.docx`

## Item Types

| Type | Display |
|------|---------|
| ja_nee | Checkbox Yes / No |
| ok_nok | Checkbox OK / NOK |
| waarde | Input field |
| nvt_optie | Checkbox with N/A option |

## After Completion

Report: JSON location, document location, generation status.
