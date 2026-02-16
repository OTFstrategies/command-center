---
name: offerte
description: This skill should be used when the user asks to "maak een offerte", "genereer offerte", "nieuwe offerte", or "/offerte". Generates professional VEHA quotes and proposals.
---

# VEHA Offerte Generator

Generate quotes with specifications and pricing in VEHA corporate style.

## Workflow

### Step 1: Collect Quote Data

Gather the following information from the user:

**Quote details:**
- Quote number (format: OFF-{YYYY}-{NNN})
- Quote date (default: today)
- Valid until (default: 30 days)
- Reference/request number (optional)

**Client details:**
- Company name
- Attn. (contact person)
- Street + house number
- Postal code + City
- Customer number (optional)

**Project/assignment:**
- Project name/description
- Work location (if different)
- Brief scope description

**Introduction:**
- Opening text (e.g. "Following your request...")

**Quote lines** (repeat until user is done):
Per line:
- Description
- Quantity
- Unit (pieces, hour, m², etc.)
- Unit price (EUR)

**Optional items** (optional):
Per optional item:
- Description
- Price

**Terms:**
- Payment terms (e.g. 14/30 days)
- Delivery time/execution period
- Warranty (optional)
- Special conditions (optional)

**Closing:**
- Closing text
- Signatory name
- Signatory position

### Step 2: Show Summary

Display overview with all lines, totals and terms.

### Step 3: Save JSON

Save data to: `Generators/offerte/data/session_{YYYYMMDD}_{HHMMSS}.json`

Key fields: `offertenummer`, `offertedatum`, `geldig_tot`, `klant` (bedrijfsnaam, adres), `project` (naam, locatie, scope), `regels[]` (omschrijving, aantal, eenheid, prijs), `optionele_posten[]`, `subtotaal`, `btw_bedrag`, `totaal`, `voorwaarden` (betaling, levertijd, garantie), `ondertekenaar`

### Step 4: Generate Document

Execute:
```bash
python Generators/offerte/output/generate_offerte.py
```

Output: `_output/Offerte_{Client}_{Date}.docx`

## After Completion

Report: JSON location, document location, generation status.
