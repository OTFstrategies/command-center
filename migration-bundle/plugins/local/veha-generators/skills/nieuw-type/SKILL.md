---
name: nieuw-type
description: This skill should be used when the user asks to "nieuw documenttype", "maak nieuw type", "create new document type", or "/nieuw-type". Creates new document types with Input/Output agents.
---

# VEHA New Document Type Generator

Create a complete new document type with Input/Output agents and generator script.

## Workflow

### Step 1: Define Document Type

Gather the following information from the user:

**Basic information:**
- Name of the document type (lowercase, singular, e.g. "rapport")
- Description (what is the purpose of this document type)
- Category (administrative, technical, quality, communication)

**Slash command:**
- Command name (e.g. /rapport)
- Short description for help

### Step 2: Define Data Structure

Determine what data needs to be collected:

**Required fields:**
- What information is always needed?
- What is the data type (text, number, date, list)?

**Optional fields:**
- What information is optional?

**Repeating sections:**
- Are there sections that occur multiple times (like invoice lines)?

### Step 3: Create Folder Structure

Create the following structure:

```
{documenttype}/
├── CLAUDE.md          # Routing
├── input/
│   └── CLAUDE.md      # Input Agent
├── output/
│   ├── CLAUDE.md      # Output Agent
│   └── generate_{type}.py
└── data/              # Empty folder for sessions
```

### Step 4: Generate Files

**Use templates from `Generators/_master/templates/`:**
- `input-agent-template.md` → `{type}/input/CLAUDE.md`
- `output-agent-template.md` → `{type}/output/CLAUDE.md`
- `generator-template.py` → `{type}/output/generate_{type}.py`

Customize templates with:
- Document type name
- Fields and data structure
- Specific validations

### Step 5: Update CLAUDE.md

Add new document type to:
- Main `CLAUDE.md` (slash commands table)
- New section with `<command-name>` tag

### Step 6: Create Skill (optional)

Create a SKILL.md for the new type in:
```
skills/{documenttype}/SKILL.md
```

## Templates Location

```
Generators/_master/templates/
├── input-agent-template.md
├── output-agent-template.md
└── generator-template.py
```

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Folder | lowercase, singular | `rapport` |
| Generator | generate_{type}.py | `generate_rapport.py` |
| Session | session_{timestamp}.json | `session_20260204_120000.json` |
| Output | {Type}_{identifier}_{date}.docx | `Rapport_Client_04-02-2026.docx` |

## Checklist After Creation

- [ ] Folder structure created
- [ ] Routing CLAUDE.md
- [ ] Input agent CLAUDE.md with question sequence
- [ ] Output agent CLAUDE.md with generation instructions
- [ ] Python generator script
- [ ] JSON schema (optional, in `Generators/_shared/data-schemas/`)
- [ ] Main CLAUDE.md updated
- [ ] SKILL.md created (optional)
- [ ] Test with sample data

## After Completion

Report: files created, usage instructions, follow-up steps (testing, schema).
