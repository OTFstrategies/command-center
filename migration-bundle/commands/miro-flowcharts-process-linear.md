---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a simple linear A→B→C process flow diagram
---
# Linear Process Flow

Create a simple vertical sequential process flow.

## Step 1: Select Board

Use `mcp__mcp-miro__list_boards` to get available boards.

Show the user:
```
Available boards:
1. [Board Name 1]
2. [Board Name 2]
```

Ask: "Which board? (enter number)"

Get the board ID from the selected number.

## Step 2: Collect Input

Ask the user: "Enter process steps (comma-separated):"

Example input: "Apply, Screen, Interview, Offer, Accept"

Parse steps into a list.

## Step 3: Create Diagram

Use `mcp__mcp-miro__bulk_create_items` with:

**Start with terminator:**
- Type: `shape`
- Shape: `flow_chart_terminator`
- Content: "Start"
- Position: `{x: 0, y: 0}`
- Style: `{fillColor: "#D3E5FF"}`

**For each step (index 0 to n-1):**
- Type: `shape`
- Shape: `flow_chart_process`
- Content: step text
- Position: `{x: 0, y: (index + 1) * 300}`
- Style: `{fillColor: "#D3E5FF", borderColor: "#1A73E8"}`

**End with terminator:**
- Type: `shape`
- Shape: `flow_chart_terminator`
- Content: "End"
- Position: `{x: 0, y: (steps.length + 1) * 300}`
- Style: `{fillColor: "#C8E6C9"}`

## Step 4: Confirm

Output: "✅ Created linear process flow on [board name] with [count] steps"

List the steps created for confirmation.
