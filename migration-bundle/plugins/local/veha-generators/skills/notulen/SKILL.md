---
name: notulen
description: This skill should be used when the user asks to "maak notulen", "genereer notulen", "nieuwe notulen", or "/notulen". Generates professional VEHA meeting minutes.
---

# VEHA Notulen Generator

Generate meeting minutes in VEHA corporate style.

## Workflow

### Step 1: Collect Meeting Data

Gather the following information from the user:

**Meeting details:**
- Subject/title of meeting
- Date
- Time (start - end)
- Location (physical or online)
- Meeting type (project meeting, MT, team meeting, etc.)

**Attendees:**
- Chair
- Secretary/minute taker
- Other attendees (name + position/organization)
- Absent with notice

**Agenda items** (repeat until user is done):
Per agenda item:
- Number
- Subject
- Discussion/explanation
- Decision(s) made
- Action items

**Per action item:**
- Action description
- Who (responsible)
- Deadline

**Any other business:**
- Points from AOB (optional)

**Next meeting:**
- Date
- Time
- Location

### Step 2: Show Summary

Display all agenda items with decisions and actions, ask for confirmation.

### Step 3: Save JSON

Save data to: `Generators/notulen/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `titel`, `datum`, `tijd_start`, `tijd_eind`, `locatie`, `voorzitter`, `notulist`, `aanwezigen[]` (naam, functie), `agendapunten[]` (nummer, onderwerp, besluiten[], acties[]: omschrijving, verantwoordelijke, deadline), `volgende_vergadering`

### Step 4: Generate Document

Execute:
```bash
python Generators/notulen/output/generate_notulen.py
```

Output: `_output/Notulen_{Title}_{Date}.docx`

## Action List

The document contains a separate action list table with:
- Action
- Who
- Deadline
- Status

## After Completion

Report: JSON location, document location, generation status.
