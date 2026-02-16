---
name: werkbon
description: This skill should be used when the user asks to "maak een werkbon", "genereer werkbon", "nieuwe werkbon", or "/werkbon". Generates professional VEHA work orders.
---

# VEHA Werkbon Generator

Generate work orders for completed work in VEHA corporate style.

## Workflow

### Step 1: Collect Work Order Data

Gather the following information from the user:

**Work order details:**
- Work order number (format: WB{YYYY}-{NNN}, e.g. WB2026-001)
- Execution date
- Project reference (optional)

**Client/principal:**
- Company name
- Contact person
- Phone/email (optional)

**Work location:**
- Address (street + house number)
- Postal code + City

**Technician:**
- Technician name
- Employee number (optional)

**Work performed** (repeat until user is done):
- Work description
- Start time
- End time
- Hours

**Materials used** (optional, repeat until user is done):
- Material description
- Quantity
- Unit

**Notes:**
- Remarks (optional)
- Work status: completed / follow-up needed

### Step 2: Show Summary

Display overview with all details and ask for confirmation.

### Step 3: Save JSON

Save data to: `Generators/werkbon/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `werkbonnummer`, `datum`, `klant` (bedrijfsnaam, contactpersoon), `werklocatie` (adres), `monteur` (naam), `werkzaamheden[]` (omschrijving, starttijd, eindtijd, uren), `materialen[]` (omschrijving, aantal), `totaal_uren`, `status`

### Step 4: Generate Document

Execute:
```bash
python Generators/werkbon/output/generate_werkbon.py
```

Output: `_output/Werkbon_{Client}_{Date}.docx`

## Validation Rules

| Field | Validation |
|-------|------------|
| Work order number | Format: WB{YYYY}-{NNN} |
| Date | Format: DD-MM-YYYY |
| Time | Format: HH:MM |
| Hours | Positive number |

## After Completion

Report: JSON location, document location, generation status.
