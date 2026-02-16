---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a CI/CD style pipeline diagram
---
# Pipeline Workflow

Create CI/CD style pipeline with parallel stages.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter pipeline stages (use | for parallel stages):"
Example: "Build | Test (unit, integration, e2e) | Deploy (staging, prod)"

Parse into stages: `[{name: "Build", parallel: []}, {name: "Test", parallel: ["unit", "integration", "e2e"]}, ...]`

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

X offset starts at 0.

**For each stage (index 0 to n-1):**
1. Stage frame:
   - Type: `frame`
   - Title: stage name
   - Position: `{x: x_offset, y: 0}`
   - Geometry: `{width: 300, height: 400}`

2. If parallel substages:
   - For each substage:
     - Type: `shape`, Shape: `flow_chart_process`
     - Content: substage name
     - Position: `{x: x_offset + 50, y: substage_index * 120 + 50}`
     - Style: `{fillColor: "#D3E5FF"}`
3. Else (single stage):
   - Type: `shape`, Shape: `flow_chart_process`
   - Content: stage name
   - Position: `{x: x_offset + 50, y: 150}`
   - Style: `{fillColor: "#D3E5FF"}`

Increment x_offset by 350.

## Step 4: Confirm
Output: "✅ Created pipeline workflow with [count] stages on [board name]"
