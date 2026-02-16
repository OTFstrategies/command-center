---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a 5-column extended Kanban workflow board
---
# Extended Kanban Board

Create full 5-column workflow board.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter tasks (comma-separated, or empty):"

Parse into `tasks` list.

## Step 3: Create Board
Use `mcp__mcp-miro__bulk_create_items`:

**Create 5 frames (columns):**
Columns: ["📦 Backlog", "📋 To Do", "🔄 In Progress", "👀 Review", "✅ Done"]

For each column (index 0 to 4):
- Type: `frame`
- Title: column name
- Position: `{x: index * 300, y: 0}`
- Geometry: `{width: 280, height: 700}`

**If tasks provided, add to Backlog:**
For each task (index 0 to n-1):
- Type: `sticky_note`
- Content: task text
- Position: `{x: 30, y: index * 100 + 30}`
- Style: `{color: "light_yellow"}`

## Step 4: Confirm
Output: "✅ Created extended Kanban board (5 columns) on [board name]"
If tasks: "Added [count] tasks to Backlog"
