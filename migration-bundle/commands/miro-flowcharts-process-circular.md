---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a cyclical/iterative process flow
---
# Circular Process Flow

Create a cyclical process diagram in circular arrangement.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter cycle steps (comma-separated):" (Example: "Plan, Build, Test, Review, Retrospect")
Parse into steps list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

Calculate positions in circle:
- Radius: 400px
- Center: (0, 0)
- Angle step: 360° / step_count

**For each step (index 0 to n-1):**
- Angle: `index * (360 / step_count)` degrees
- X: `radius * cos(angle_in_radians)`
- Y: `radius * sin(angle_in_radians)`
- Type: `shape`, Shape: `flow_chart_process`
- Content: step text
- Position: `{x: calculated_x, y: calculated_y}`
- Style: `{fillColor: "#D3E5FF"}`

**Add cycle indicator:**
- Type: `shape`, Shape: `right_arrow`
- Content: "↻ Repeat"
- Position: `{x: 0, y: radius + 150}`
- Style: `{fillColor: "#FFF9C4"}`

## Step 4: Confirm
Output: "✅ Created circular flow with [count] steps on [board name]"
