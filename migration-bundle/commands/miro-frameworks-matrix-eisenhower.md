---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create an Urgent/Important Eisenhower matrix (2×2)
---
# Eisenhower Matrix (Urgent/Important)

Create 2×2 task management matrix.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter tasks (comma-separated):"
Example: "Client meeting, Email responses, Strategic planning, Social media"

Parse into `tasks` list.

## Step 3: Create Matrix
Use `mcp__mcp-miro__bulk_create_items`:

**Create 4 quadrant frames:**
1. Do Now (Urgent & Important):
   - Type: `frame`, Title: "🔥 DO NOW"
   - Position: `{x: 0, y: 0}`
   - Geometry: `{width: 400, height: 350}`

2. Plan (Important, Not Urgent):
   - Type: `frame`, Title: "📅 PLAN"
   - Position: `{x: 450, y: 0}`
   - Geometry: `{width: 400, height: 350}`

3. Delegate (Urgent, Not Important):
   - Type: `frame`, Title: "👥 DELEGATE"
   - Position: `{x: 0, y: 400}`
   - Geometry: `{width: 400, height: 350}`

4. Drop (Not Urgent, Not Important):
   - Type: `frame`, Title: "🗑️ DROP"
   - Position: `{x: 450, y: 400}`
   - Geometry: `{width: 400, height: 350}`

**Add axis labels:**
- Type: `shape`, Content: "IMPORTANT", Position: `{x: -150, y: 175}`, Style: `{fillColor: "#FFF9C4"}`
- Type: `shape`, Content: "NOT IMPORTANT", Position: `{x: -150, y: 575}`, Style: `{fillColor: "#E0E0E0"}`
- Type: `shape`, Content: "URGENT", Position: `{x: 200, y: -100}`, Style: `{fillColor: "#FFCDD2"}`
- Type: `shape`, Content: "NOT URGENT", Position: `{x: 650, y: -100}`, Style: `{fillColor: "#C8E6C9"}`

**Add tasks:**
For each task (index 0 to n-1):
- Type: `sticky_note`, Content: task text
- Position: `{x: 425, y: 375 + index * 30}` (center)
- Style: `{color: "yellow"}`

## Step 4: Confirm
Output: "✅ Created Eisenhower matrix on [board name]. Categorize [count] tasks."
