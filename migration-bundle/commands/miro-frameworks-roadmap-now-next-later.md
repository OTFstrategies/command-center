---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a Now/Next/Later 3-horizon planning roadmap
---
# Now-Next-Later Roadmap

Create 3-horizon planning view.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter Now initiatives (comma-separated):"
Ask: "Enter Next initiatives (comma-separated):"
Ask: "Enter Later initiatives (comma-separated):"

Parse into 3 lists: `now_items`, `next_items`, `later_items`.

## Step 3: Create Roadmap
Use `mcp__mcp-miro__bulk_create_items`:

**Create 3 horizon frames:**
1. Now:
   - Type: `frame`, Title: "🔥 NOW (This Quarter)"
   - Position: `{x: 0, y: 0}`
   - Geometry: `{width: 400, height: 700}`

2. Next:
   - Type: `frame`, Title: "📅 NEXT (Next Quarter)"
   - Position: `{x: 450, y: 0}`
   - Geometry: `{width: 400, height: 700}`

3. Later:
   - Type: `frame`, Title: "🔮 LATER (Future)"
   - Position: `{x: 900, y: 0}`
   - Geometry: `{width: 400, height: 700}`

**Add Now items:**
For each item in now_items (index 0 to n-1):
- Type: `sticky_note`, Content: item text
- Position: `{x: 50, y: 50 + index * 100}`
- Style: `{color: "light_pink"}`

**Add Next items:**
For each item in next_items (index 0 to n-1):
- Type: `sticky_note`, Content: item text
- Position: `{x: 500, y: 50 + index * 100}`
- Style: `{color: "light_yellow"}`

**Add Later items:**
For each item in later_items (index 0 to n-1):
- Type: `sticky_note`, Content: item text
- Position: `{x: 950, y: 50 + index * 100}`
- Style: `{color: "light_blue"}`

## Step 4: Confirm
Output: "✅ Created Now-Next-Later roadmap on [board name] ([now]/[next]/[later] items)"
