---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a horizontal timeline roadmap with milestones
---
# Timeline Roadmap

Create horizontal timeline with date-based milestones.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter milestones (format: Date | Milestone):"
Example: "Q1 2024 | MVP Launch, Q2 2024 | Beta Release, Q3 2024 | Public Launch, Q4 2024 | Enterprise Features"

Parse into list: `[{date: "Q1 2024", milestone: "MVP Launch"}, ...]`

## Step 3: Create Timeline
Use `mcp__mcp-miro__bulk_create_items`:

**Timeline base:**
- Type: `shape`, Shape: `rectangle`
- Content: ""
- Position: `{x: (milestones.length * 350) / 2, y: 200}`
- Geometry: `{width: milestones.length * 350, height: 10}`
- Style: `{fillColor: "#1A73E8"}`

**For each milestone (index 0 to n-1):**
1. Milestone marker:
   - Type: `shape`, Shape: `circle`
   - Content: ""
   - Position: `{x: index * 350, y: 200}`
   - Geometry: `{width: 40, height: 40}`
   - Style: `{fillColor: "#1A73E8"}`

2. Date label (above):
   - Type: `shape`, Shape: `rectangle`
   - Content: date
   - Position: `{x: index * 350, y: 50}`
   - Style: `{fillColor: "#E3F2FD"}`

3. Milestone label (below):
   - Type: `sticky_note`
   - Content: milestone text
   - Position: `{x: index * 350, y: 300}`
   - Style: `{color: "light_blue"}`

## Step 4: Confirm
Output: "✅ Created timeline roadmap with [count] milestones on [board name]"
