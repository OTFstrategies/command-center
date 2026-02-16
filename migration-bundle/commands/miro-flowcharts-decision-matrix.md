---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a decision comparison matrix grid
---
# Decision Comparison Matrix

Create grid comparing options against criteria.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter options to compare (comma-separated):" (Example: "Vendor A, Vendor B, Vendor C")
Ask: "Enter criteria (comma-separated):" (Example: "Cost, Quality, Speed")

Parse into `options` and `criteria` lists.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**Column headers (options):**
For each option (index 0 to n-1):
- Type: `shape`, Shape: `rectangle`
- Content: option name
- Position: `{x: (index + 1) * 300, y: 0}`
- Style: `{fillColor: "#E3F2FD"}`

**Row headers (criteria):**
For each criterion (index 0 to m-1):
- Type: `shape`, Shape: `rectangle`
- Content: criterion name
- Position: `{x: 0, y: (index + 1) * 200}`
- Style: `{fillColor: "#FFF9C4"}`

**Grid cells:**
For each option × criterion:
- Type: `sticky_note`
- Content: "?"
- Position: `{x: (option_index + 1) * 300, y: (criterion_index + 1) * 200}`
- Style: `{color: "yellow"}`

## Step 4: Confirm
Output: "✅ Created decision matrix ([options] × [criteria]) on [board name]. Fill in scores manually."
