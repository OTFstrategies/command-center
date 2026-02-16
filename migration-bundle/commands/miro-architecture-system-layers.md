---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a layered architecture diagram (UI/Business/Data)
---
# Layered Architecture

Create N-tier layered architecture diagram.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter layers from top to bottom (comma-separated):"
Example: "Presentation Layer, Business Logic Layer, Data Access Layer, Database Layer"

Ask: "Enter components per layer (use | to separate layers):"
Example: "Web UI, Mobile App | Order Service, Payment Service | Repository, ORM | PostgreSQL, Redis"

Parse into:
- `layers`: ["Presentation Layer", ...]
- `components_per_layer`: [["Web UI", "Mobile App"], ...]

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**For each layer (index 0 to n-1):**
1. Layer frame:
   - Type: `frame`
   - Title: layer name
   - Position: `{x: 0, y: index * 350}`
   - Geometry: `{width: 1200, height: 300}`

2. Components in layer:
   For each component (comp_index 0 to m-1):
   - Type: `shape`, Shape: `rectangle`
   - Content: component name
   - Position: `{x: comp_index * 300 + 100, y: index * 350 + 100}`
   - Geometry: `{width: 250, height: 120}`
   - Style: `{fillColor: "#D3E5FF"}`

**Add layer separators:**
For each layer boundary:
- Type: `shape`, Shape: `rectangle`
- Content: "↓"
- Position: `{x: 600, y: index * 350 + 320}`
- Style: `{fillColor: "#FFF9C4"}`

## Step 4: Confirm
Output: "✅ Created [count]-layer architecture on [board name]"
