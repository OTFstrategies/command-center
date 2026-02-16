---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a multi-track swimlane roadmap with timeline
---
# Swimlane Roadmap

Create multi-track roadmap with horizontal lanes.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter tracks (comma-separated):" (Example: "Frontend, Backend, Infrastructure")
Ask: "Enter time periods (comma-separated):" (Example: "Q1, Q2, Q3, Q4")
Ask: "Enter items per track (use | to separate tracks, comma for items):"
Example: "Login UI, Dashboard | API Gateway, Database | CI/CD, Monitoring | Mobile App, Analytics | Auth Service, Cache | Kubernetes, CDN"

Parse into:
- `tracks`: ["Frontend", "Backend", "Infrastructure"]
- `periods`: ["Q1", "Q2", "Q3", "Q4"]
- `items_per_track`: [["Login UI", "Dashboard"], ["API Gateway", "Database"], ...]

## Step 3: Create Roadmap
Use `mcp__mcp-miro__bulk_create_items`:

**Create period headers (columns):**
For each period (index 0 to n-1):
- Type: `shape`, Shape: `rectangle`
- Content: period name
- Position: `{x: (index + 1) * 350, y: -100}`
- Style: `{fillColor: "#E3F2FD"}`

**Create track lanes (rows):**
For each track (index 0 to m-1):
- Type: `frame`
- Title: track name
- Position: `{x: 0, y: index * 300}`
- Geometry: `{width: periods.length * 350 + 200, height: 250}`

**Add items to cells:**
For each track × period combination:
- Type: `sticky_note`
- Content: item text (if provided)
- Position: `{x: (period_index + 1) * 350 + 50, y: track_index * 300 + 50}`
- Style: `{color: "light_blue"}`

## Step 4: Confirm
Output: "✅ Created swimlane roadmap ([tracks] × [periods]) on [board name]"
