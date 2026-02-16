---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a microservices architecture map
---
# Microservices Map

Create distributed microservices architecture diagram.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter services (comma-separated):"
Example: "Auth Service, User Service, Order Service, Payment Service, Notification Service"

Ask: "Enter dependencies (format: ServiceA → ServiceB):"
Example: "Order Service → Payment Service, Order Service → Notification Service, User Service → Auth Service"

Parse into: `services` list and `dependencies` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

Calculate grid layout:
- Columns: ceil(sqrt(services.length))
- Rows: ceil(services.length / columns)

**For each service (index 0 to n-1):**
- Row: floor(index / columns)
- Col: index % columns
- Type: `shape`, Shape: `rectangle`
- Content: service name
- Position: `{x: col * 400, y: row * 350}`
- Geometry: `{width: 350, height: 200}`
- Style: `{fillColor: "#D3E5FF", borderColor: "#1A73E8", borderWidth: 2}`

**Add dependency arrows:**
For each dependency:
- Type: `sticky_note`
- Content: "→"
- Position: midpoint between source and target services
- Style: `{color: "cyan"}`

**Add shared infrastructure (bottom):**
- Type: `shape`, Shape: `flow_chart_magnetic_disk`
- Content: "Database"
- Position: `{x: (columns * 400) / 2, y: rows * 350 + 200}`
- Style: `{fillColor: "#FFE0B2"}`

- Type: `shape`, Shape: `cloud`
- Content: "Message Queue"
- Position: `{x: (columns * 400) / 2 + 400, y: rows * 350 + 200}`
- Style: `{fillColor: "#E1BEE7"}`

## Step 4: Confirm
Output: "✅ Created microservices map with [count] services on [board name]"
