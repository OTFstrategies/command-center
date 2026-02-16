---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items, mcp__mcp-miro__create_shape]
description: Create a multi-actor swimlane process diagram
---
# Swimlane Process Flow

Create horizontal lanes for different actors with process steps.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID from selection.

## Step 2: Collect Input
Ask: "Enter actors (comma-separated):" (Example: "Customer, Warehouse, Shipping")
Ask: "Enter steps for each actor (use | to separate actors, comma for steps):"
Example: "Place order, Pay | Pick items, Pack | Ship, Deliver"

Parse into: `actors = ["Customer", "Warehouse", "Shipping"]` and `steps_per_actor = [["Place order", "Pay"], ["Pick items", "Pack"], ["Ship", "Deliver"]]`

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**For each actor (index 0 to n-1):**
- Create frame: Type `frame`, Title: actor name, Position: `{x: 0, y: index * 450}`, Geometry: `{width: 1200, height: 350}`

**For each step in actor:**
- Type: `shape`, Shape: `flow_chart_process`
- Content: step text
- Position: `{x: step_index * 350 + 100, y: actor_index * 450 + 100}`
- Style: `{fillColor: "#D3E5FF"}`

## Step 4: Confirm
Output: "✅ Created swimlane flow with [actor count] lanes on [board name]"
