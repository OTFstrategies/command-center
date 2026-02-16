---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a 3×3 risk assessment matrix (Probability × Impact)
---
# Risk Assessment Matrix

Create 3×3 risk evaluation grid.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter risks to assess (comma-separated):"
Example: "Server outage, Data breach, Budget overrun, Missed deadline"

Parse into `risks` list.

## Step 3: Create Matrix
Use `mcp__mcp-miro__bulk_create_items`:

**Create 9 cells (3×3 grid):**
Impact levels (rows): ["High", "Medium", "Low"]
Probability levels (columns): ["Low", "Medium", "High"]

For each cell (row 0-2, col 0-2):
- Type: `frame`
- Title: `"${impact} Impact / ${probability} Probability"`
- Position: `{x: col * 300, y: row * 250}`
- Geometry: `{width: 280, height: 230}`
- Color based on risk level:
  - High Impact + High Probability: Red border
  - Medium combinations: Orange
  - Low combinations: Green

**Add axis labels:**
- Type: `shape`, Content: "HIGH IMPACT", Position: `{x: -150, y: 115}`, Style: `{fillColor: "#FFCDD2"}`
- Type: `shape`, Content: "MEDIUM IMPACT", Position: `{x: -150, y: 365}`, Style: `{fillColor: "#FFE0B2"}`
- Type: `shape`, Content: "LOW IMPACT", Position: `{x: -150, y: 615}`, Style: `{fillColor: "#C8E6C9"}`
- Type: `shape`, Content: "LOW PROB", Position: `{x: 140, y: -100}`, Style: `{fillColor: "#C8E6C9"}`
- Type: `shape`, Content: "MEDIUM PROB", Position: `{x: 440, y: -100}`, Style: `{fillColor: "#FFE0B2"}`
- Type: `shape`, Content: "HIGH PROB", Position: `{x: 740, y: -100}`, Style: `{fillColor: "#FFCDD2"}`

**Add risks:**
For each risk (index 0 to n-1):
- Type: `sticky_note`, Content: risk text
- Position: `{x: 440, y: 365 + index * 30}` (center)
- Style: `{color: "yellow"}`

## Step 4: Confirm
Output: "✅ Created 3×3 risk matrix on [board name]. Place [count] risks in appropriate cells."
