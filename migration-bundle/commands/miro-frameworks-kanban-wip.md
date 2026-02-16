---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a Kanban board with WIP (Work In Progress) limits
---
# WIP-Limited Kanban Board

Create Kanban with work-in-progress limits.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter WIP limits for Doing and Review columns (format: doing,review):"
Example: "3,2"

Parse into `wip_doing` and `wip_review` numbers.

## Step 3: Create Board
Use `mcp__mcp-miro__bulk_create_items`:

**Create 3 frames with WIP indicators:**
1. To Do:
   - Type: `frame`, Title: "📋 To Do (∞)"
   - Position: `{x: 0, y: 0}`
   - Geometry: `{width: 350, height: 600}`

2. Doing:
   - Type: `frame`, Title: `"🔄 Doing (WIP: ${wip_doing})"`
   - Position: `{x: 400, y: 0}`
   - Geometry: `{width: 350, height: 600}`

3. Review:
   - Type: `frame`, Title: `"👀 Review (WIP: ${wip_review})"`
   - Position: `{x: 800, y: 0}`
   - Geometry: `{width: 350, height: 600}`

4. Done:
   - Type: `frame`, Title: "✅ Done (∞)"
   - Position: `{x: 1200, y: 0}`
   - Geometry: `{width: 350, height: 600}`

**Add WIP limit indicators:**
For Doing column:
- Type: `sticky_note`
- Content: `"Limit: ${wip_doing} items"`
- Position: `{x: 450, y: -100}`
- Style: `{color: "orange"}`

For Review column:
- Type: `sticky_note`
- Content: `"Limit: ${wip_review} items"`
- Position: `{x: 850, y: -100}`
- Style: `{color: "orange"}`

## Step 4: Confirm
Output: "✅ Created WIP-limited Kanban on [board name] (Doing: [limit], Review: [limit])"
