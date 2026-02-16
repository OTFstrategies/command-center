---
name: factuur
description: This skill should be used when the user asks to "maak een factuur", "genereer factuur", "nieuwe factuur", or "/factuur". Generates professional VEHA invoices.
---

# VEHA Factuur Generator

Generate professional invoices in VEHA corporate style.

## Workflow

### Step 1: Collect Invoice Data

Gather the following information from the user:

**Client details:**
- Company name (required)
- Contact person (optional)
- Street + house number
- Postal code + City
- VAT number (NL format, optional)

**Invoice details:**
- Invoice number (format: F{YYYY}-{NNN}, e.g. F2026-001)
- Invoice date (default: today)
- Payment term (14 or 30 days)
- Reference/PO number (optional)
- Subject/description

**Invoice lines** (repeat until user is done):
- Description
- Quantity
- Unit (hour/piece/day/month)
- Unit price (EUR)

### Step 2: Show Summary

Display overview with:
- All client and invoice details
- All lines with amounts
- Subtotal, VAT 21%, Total

Ask confirmation: "Is this correct?"

### Step 3: Save JSON

Save data to: `Generators/factuur/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `factuurnummer`, `factuurdatum`, `vervaldatum`, `betalingstermijn`, `klant` (bedrijfsnaam, adres, btw_nummer), `regels[]` (omschrijving, aantal, eenheid, prijs), `subtotaal`, `btw_bedrag`, `totaal`

### Step 4: Generate Document

Execute:
```bash
python Generators/factuur/output/generate_factuur.py
```

Output: `_output/Factuur_{Client}_{Date}.docx`

## Validation Rules

| Field | Validation |
|-------|------------|
| Invoice number | Format: F{YYYY}-{NNN} |
| Date | Format: DD-MM-YYYY |
| Amounts | Two decimals, non-negative |
| VAT number | NL + 9 digits + B + 2 digits |
| Postal code | 4 digits + space + 2 letters |

## After Completion

Report: JSON location, document location, generation status.
