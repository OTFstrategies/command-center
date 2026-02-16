---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create an Impact/Effort priority matrix (2×2)
---
# Priority Matrix (Impact/Effort)

Create 2×2 prioritization matrix.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter items to prioritize (comma-separated):"
Example: "Feature A, Bug fix B, Refactor C, New API D"

Parse into `items` list.

## Step 3: Create Matrix
Use `mcp__mcp-miro__bulk_create_items`:

**Create 4 quadrant frames:**
1. Quick Wins (High Impact, Low Effort):
   - Type: `frame`, Title: "🏆 Quick Wins (DO FIRST)"
   - Position: `{x: 0, y: 0}`
   - Geometry: `{width: 400, height: 350}`

2. Big Bets (High Impact, High Effort):
   - Type: `frame`, Title: "📈 Big Bets (PLAN)"
   - Position: `{x: 450, y: 0}`
   - Geometry: `{width: 400, height: 350}`

3. Fill Ins (Low Impact, Low Effort):
   - Type: `frame`, Title: "✅ Fill Ins (IF TIME)"
   - Position: `{x: 0, y: 400}`
   - Geometry: `{width: 400, height: 350}`

4. Avoid (Low Impact, High Effort):
   - Type: `frame`, Title: "❌ Avoid (SKIP)"
   - Position: `{x: 450, y: 400}`
   - Geometry: `{width: 400, height: 350}`

**Add axis labels:**
- Type: `shape`, Shape: `rectangle`, Content: "HIGH IMPACT", Position: `{x: -150, y: 175}`, Style: `{fillColor: "#FFF9C4"}`
- Type: `shape`, Shape: `rectangle`, Content: "LOW IMPACT", Position: `{x: -150, y: 575}`, Style: `{fillColor: "#E0E0E0"}`
- Type: `shape`, Shape: `rectangle`, Content: "LOW EFFORT", Position: `{x: 200, y: -100}`, Style: `{fillColor: "#C8E6C9"}`
- Type: `shape`, Shape: `rectangle`, Content: "HIGH EFFORT", Position: `{x: 650, y: -100}`, Style: `{fillColor: "#FFCDD2"}`

**Add items as sticky notes:**
Place all items in center for user to categorize:
For each item (index 0 to n-1):
- Type: `sticky_note`, Content: item text
- Position: `{x: 425, y: 375 + index * 30}` (center pile)
- Style: `{color: "yellow"}`

## Step 4: Confirm
Output: "✅ Created priority matrix on [board name]. Move [count] items to appropriate quadrants."
