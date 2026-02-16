---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a multi-choice decision tree (3-5 options)
---
# Multi-Choice Decision Tree

Create decision flow with multiple choice branches.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter decision question:"
Ask: "Enter options (comma-separated):" (Example: "Credit Card, PayPal, Bank Transfer, Crypto")

Parse into: `question` and `options` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**Decision node:**
- Type: `shape`, Shape: `flow_chart_decision`
- Content: question
- Position: `{x: 0, y: 0}`
- Style: `{fillColor: "#FFF9C4"}`

**For each option (index 0 to n-1):**
- Calculate angle: `(index - (n-1)/2) * 60` degrees
- X: `400 * sin(angle_in_radians)`
- Y: `300 + 100 * cos(angle_in_radians)`
- Type: `shape`, Shape: `flow_chart_process`
- Content: option
- Position: `{x: calculated_x, y: calculated_y}`
- Style: `{fillColor: "#D3E5FF"}`

## Step 4: Confirm
Output: "✅ Created multi-choice decision with [count] options on [board name]"
