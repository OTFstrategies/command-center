---
name: werkinstructie
description: This skill should be used when the user asks to "maak een werkinstructie", "genereer werkinstructie", "nieuwe werkinstructie", or "/werkinstructie". Generates professional VEHA work instructions.
---

# VEHA Werkinstructie Generator

Generate step-by-step work instructions in VEHA corporate style.

## Workflow

### Step 1: Collect Work Instruction Data

Gather the following information from the user:

**Instruction metadata:**
- Title of the work instruction
- Document number (format: WI-{XXX}-{NN}, e.g. WI-INS-01)
- Version number (e.g. 1.0)
- Target audience (who performs this)

**Purpose and scope:**
- Purpose of the instruction (why)
- Application area (when/where)

**Requirements** (optional):
- Materials
- Tools
- PPE (personal protective equipment)

**Steps** (repeat until user is done):
Per step:
- Step number (automatic)
- Action (what needs to be done)
- Warning (optional, safety)
- Tip (optional, best practice)
- Image reference (optional)

**Verification after completion:**
- How to verify work was performed correctly

### Step 2: Show Summary

Display all steps and ask for confirmation.

### Step 3: Save JSON

Save data to: `Generators/werkinstructie/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `titel`, `documentnummer`, `versie`, `doelgroep`, `doel`, `toepassingsgebied`, `benodigdheden` (materialen, gereedschappen, pbm), `stappen[]` (nummer, actie, waarschuwing, tip), `controle`, `goedkeuring`

### Step 4: Generate Document

Execute:
```bash
python Generators/werkinstructie/output/generate_werkinstructie.py
```

Output: `_output/Werkinstructie_{Title}_{Date}.docx`

## Formatting

| Element | Display |
|---------|---------|
| Warning | Yellow box with warning icon |
| Tip | Blue box with tip icon |
| Step | Numbered with clear action |

## After Completion

Report: JSON location, document location, generation status.
