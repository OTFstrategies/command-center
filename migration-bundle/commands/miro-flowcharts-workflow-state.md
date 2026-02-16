---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a state machine diagram with transitions
---
# State Machine Workflow

Create state transitions diagram.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter states (comma-separated):" (Example: "Draft, Pending, Confirmed, Shipped, Delivered")
Ask: "Enter transitions (format: From → To):" (Example: "Draft → Pending, Pending → Confirmed, Confirmed → Shipped, Shipped → Delivered")

Parse into `states` list and `transitions` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**For each state (index 0 to n-1):**
- Position in horizontal line with spacing
- X: `index * 350`
- Y: 0
- Type: `shape`, Shape: `circle`
- Content: state name
- Style based on position:
  - First state: `{fillColor: "#E3F2FD"}` (initial)
  - Last state: `{fillColor: "#C8E6C9"}` (terminal)
  - Others: `{fillColor: "#FFF9C4"}` (intermediate)
- Geometry: `{width: 150, height: 150}`

**Add transition labels:**
For each transition:
- Type: `sticky_note`
- Content: "→"
- Position: between from/to states
- Style: `{color: "cyan"}`

## Step 4: Confirm
Output: "✅ Created state machine with [count] states and [count] transitions on [board name]"
