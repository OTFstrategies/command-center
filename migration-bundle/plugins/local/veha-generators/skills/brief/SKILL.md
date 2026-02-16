---
name: brief
description: This skill should be used when the user asks to "maak een brief", "genereer brief", "nieuwe brief", or "/brief". Generates professional VEHA business correspondence.
---

# VEHA Brief Generator

Generate business correspondence in VEHA corporate style.

## Workflow

### Step 1: Collect Letter Data

Gather the following information from the user:

**Addressee:**
- Company name (or person name for individuals)
- Attn. (contact person)
- Street + house number
- Postal code + City
- Country (if not Netherlands)

**Letter metadata:**
- Our reference (optional)
- Your reference (optional)
- Date (default: today)
- Subject line

**Salutation:**
- Choose: Dear Mr./Ms. {name} | Dear Sir/Madam | Dear {name}

**Letter content:**
- Opening (first paragraph - reason/context)
- Body (main message - can be multiple paragraphs)
- Closing (next steps, call-to-action)

**Closing phrase:**
- Choose:
  - Kind regards
  - Yours faithfully
  - Best regards

**Signatory:**
- Name
- Position
- Department (optional)

**Attachments (optional):**
- List of attachments

### Step 2: Show Summary

Display letter preview and ask for confirmation.

### Step 3: Save JSON

Save data to: `Generators/brief/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `geadresseerde` (bedrijfsnaam, tav, adres), `ons_kenmerk`, `uw_kenmerk`, `datum`, `betreft`, `aanhef`, `inhoud` (opening, kern[], afsluiting), `slotzin`, `ondertekenaar` (naam, functie), `bijlagen[]`

### Step 4: Generate Document

Execute:
```bash
python Generators/brief/output/generate_brief.py
```

Output: `_output/Brief_{Company}_{Date}.docx`

## Letter Types

| Purpose | Typical opening |
|---------|-----------------|
| Confirmation | "We hereby confirm..." |
| Offer | "We are pleased to offer..." |
| Response | "In response to your letter of..." |
| Information | "We would like to inform you about..." |
| Complaint | "Unfortunately we have noticed..." |

## After Completion

Report: JSON location, document location, generation status.
