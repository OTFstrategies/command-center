---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a C4 Context diagram showing system boundaries
---
# C4 Context Diagram

Create system context with external dependencies.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter system name:"
Ask: "Enter users (comma-separated):" (Example: "Customer, Admin, Support Agent")
Ask: "Enter external systems (comma-separated):" (Example: "Payment Gateway, Email Service, Analytics")

Parse into: `system_name`, `users` list, `external_systems` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**Center system:**
- Type: `shape`, Shape: `rectangle`
- Content: system_name
- Position: `{x: 0, y: 0}`
- Geometry: `{width: 300, height: 200}`
- Style: `{fillColor: "#1A73E8", color: "#FFFFFF"}`

**Users (left side):**
For each user (index 0 to n-1):
- Type: `shape`, Shape: `circle`
- Content: user name
- Position: `{x: -500, y: (index - (n-1)/2) * 200}`
- Geometry: `{width: 150, height: 150}`
- Style: `{fillColor: "#4CAF50"}`

**External systems (right side):**
For each system (index 0 to m-1):
- Type: `shape`, Shape: `rectangle`
- Content: system name
- Position: `{x: 500, y: (index - (m-1)/2) * 200}`
- Geometry: `{width: 250, height: 120}`
- Style: `{fillColor: "#E0E0E0"}`

**Connection arrows (as text):**
For each user/system, add sticky note between:
- Type: `sticky_note`
- Content: "→" or "↔"
- Position: between elements
- Style: `{color: "cyan"}`

## Step 4: Confirm
Output: "✅ Created C4 context diagram for [system] on [board name] ([users] users, [systems] external systems)"
