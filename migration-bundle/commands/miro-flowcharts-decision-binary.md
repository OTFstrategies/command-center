---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a binary Yes/No decision flow diagram
---
# Binary Decision Flow

Create Yes/No decision flow with diamond decision nodes.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter decision points with actions (format: Decision? | Yes action | No action)"
Example: "Valid login? | Show dashboard | Show error"

Parse into decisions list: `[{question: "Valid login?", yes: "Show dashboard", no: "Show error"}]`

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

Y offset starts at 0.

**For each decision (index 0 to n-1):**
1. Decision diamond:
   - Type: `shape`, Shape: `flow_chart_decision`
   - Content: question
   - Position: `{x: 0, y: y_offset}`
   - Style: `{fillColor: "#FFF9C4"}`

2. Yes path (right):
   - Type: `shape`, Shape: `flow_chart_process`
   - Content: yes action
   - Position: `{x: 300, y: y_offset + 150}`
   - Style: `{fillColor: "#C8E6C9"}`

3. No path (left):
   - Type: `shape`, Shape: `flow_chart_process`
   - Content: no action
   - Position: `{x: -300, y: y_offset + 150}`
   - Style: `{fillColor: "#FFCDD2"}`

Increment y_offset by 400 for next decision.

## Step 4: Confirm
Output: "✅ Created binary decision flow with [count] decisions on [board name]"
