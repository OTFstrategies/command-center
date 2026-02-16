---
name: procedure
description: This skill should be used when the user asks to "maak een procedure", "genereer procedure", "nieuwe procedure", or "/procedure". Generates formal VEHA procedure documents.
---

# VEHA Procedure Generator

Generate formal procedure descriptions in VEHA corporate style.

## Workflow

### Step 1: Collect Procedure Data

Gather the following information from the user:

**Procedure metadata:**
- Title of the procedure
- Document number (format: PROC-{XXX}-{NN})
- Version number (e.g. 1.0)
- Department/domain

**Responsibilities:**
- Process owner (ultimately responsible)
- Approver (who approves)
- Executor(s) (who executes)

**Purpose and scope:**
- Purpose of the procedure (why it exists)
- Scope (when applicable)
- Target audience (for whom)

**Definitions (optional):**
- Terms that need clarification

**Process steps** (repeat until user is done):
Per step:
- Step number (automatic)
- Who (role/function)
- Action (what needs to be done)
- Output/result (what comes out)
- System/tool (optional)

**Exceptions (optional):**
- What to do with deviations

**Records:**
- Which records/documents are maintained

**Related documents:**
- References to other procedures, work instructions, forms

### Step 2: Show Summary

Display process flow and ask for confirmation.

### Step 3: Save JSON

Save data to: `Generators/procedure/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `titel`, `documentnummer`, `versie`, `afdeling`, `verantwoordelijkheden` (proceseigenaar, goedkeurder, uitvoerders[]), `doel`, `scope`, `doelgroep`, `definities[]` (term, beschrijving), `stappen[]` (nummer, wie, actie, output, systeem), `uitzonderingen[]`, `registraties[]`, `goedkeuring`

### Step 4: Generate Document

Execute:
```bash
python Generators/procedure/output/generate_procedure.py
```

Output: `_output/Procedure_{Title}_{Date}.docx`

## Process Matrix

The document contains a process matrix table:

| Step | Who | Action | Output |
|------|-----|--------|--------|
| 1 | ... | ... | ... |

## After Completion

Report: JSON location, document location, generation status.
