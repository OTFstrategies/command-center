---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items, mcp__mcp-miro__create_sticky_note]
description: Create a simple 3-column Kanban board (To Do / Doing / Done)
---
# Basic Kanban Board

Create simple 3-column task board.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter tasks (comma-separated, or empty to create board only):"
Example: "Feature A, Bug B, Refactor C"

Parse into `tasks` list (can be empty).

## Step 3: Create Board
Use `mcp__mcp-miro__bulk_create_items`:

**Create 3 frames (columns):**
1. To Do:
   - Type: `frame`, Title: "📋 To Do"
   - Position: `{x: 0, y: 0}`
   - Geometry: `{width: 350, height: 600}`

2. Doing:
   - Type: `frame`, Title: "🔄 Doing"
   - Position: `{x: 400, y: 0}`
   - Geometry: `{width: 350, height: 600}`

3. Done:
   - Type: `frame`, Title: "✅ Done"
   - Position: `{x: 800, y: 0}`
   - Geometry: `{width: 350, height: 600}`

**If tasks provided, add to To Do column:**
For each task (index 0 to n-1):
- Type: `sticky_note`
- Content: task text
- Position: `{x: 50, y: index * 120 + 50}`
- Style: `{color: "yellow"}`

## Step 4: Confirm
Output: "✅ Created basic Kanban board on [board name]"
If tasks: "Added [count] tasks to To Do column"
