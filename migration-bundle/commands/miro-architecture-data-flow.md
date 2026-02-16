---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a data flow diagram with sources, transforms, and destinations
---
# Data Flow Diagram

Create data processing flow diagram.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter data sources (comma-separated):"
Example: "CSV Files, API Endpoint, Database"

Ask: "Enter transformations (comma-separated):"
Example: "Parse, Validate, Transform, Enrich"

Ask: "Enter destinations (comma-separated):"
Example: "Data Warehouse, Cache, Analytics Dashboard"

Parse into: `sources`, `transformations`, `destinations` lists.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**Sources (left column):**
For each source (index 0 to n-1):
- Type: `shape`, Shape: `flow_chart_document`
- Content: source name
- Position: `{x: 0, y: index * 200}`
- Style: `{fillColor: "#E3F2FD"}`

**Transformations (middle column):**
For each transformation (index 0 to m-1):
- Type: `shape`, Shape: `flow_chart_process`
- Content: transformation name
- Position: `{x: 400, y: index * 150}`
- Style: `{fillColor: "#FFF9C4"}`

**Destinations (right column):**
For each destination (index 0 to p-1):
- Type: `shape`, Shape: `flow_chart_magnetic_disk`
- Content: destination name
- Position: `{x: 800, y: index * 200}`
- Style: `{fillColor: "#C8E6C9"}`

**Add flow arrows:**
- Between sources and first transformation
- Between transformations
- Between last transformation and destinations
- Type: `sticky_note`, Content: "→", Style: `{color: "cyan"}`

## Step 4: Confirm
Output: "✅ Created data flow diagram on [board name] ([sources] sources → [transforms] steps → [destinations] destinations)"
