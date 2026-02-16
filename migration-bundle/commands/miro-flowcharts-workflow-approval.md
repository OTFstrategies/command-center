---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create an approval chain workflow diagram
---
# Approval Chain Workflow

Create multi-stage approval process diagram.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter approval stages (comma-separated):" (Example: "Developer, Tech Lead, QA, Merge")

Parse into `stages` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**Start node:**
- Type: `shape`, Shape: `flow_chart_terminator`
- Content: "Submit"
- Position: `{x: 0, y: 0}`
- Style: `{fillColor: "#E3F2FD"}`

**For each stage (index 0 to n-1):**
- Type: `shape`, Shape: `flow_chart_process`
- Content: stage name + " approval"
- Position: `{x: 0, y: (index + 1) * 250}`
- Style: `{fillColor: "#FFF9C4"}`

**Add rejection path (horizontal from center):**
- Type: `shape`, Shape: `flow_chart_process`
- Content: "Rejected - Revise"
- Position: `{x: -400, y: stages.length * 125}`
- Style: `{fillColor: "#FFCDD2"}`

**End node:**
- Type: `shape`, Shape: `flow_chart_terminator`
- Content: "Approved"
- Position: `{x: 0, y: (stages.length + 1) * 250}`
- Style: `{fillColor: "#C8E6C9"}`

## Step 4: Confirm
Output: "✅ Created approval workflow with [count] stages on [board name]"
