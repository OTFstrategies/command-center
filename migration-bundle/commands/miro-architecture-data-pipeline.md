---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create an ETL/data pipeline diagram with stages and stores
---
# Data Pipeline

Create ETL/data pipeline architecture.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter pipeline stages (comma-separated):"
Example: "Extract, Transform, Load, Process, Store"

Ask: "Enter data stores (format: Name | Type):"
Example: "Source DB | PostgreSQL, Staging | S3, Warehouse | Snowflake, Cache | Redis"

Parse into: `stages` list and `data_stores` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

**Data stores (bottom layer):**
For each store (index 0 to n-1):
- Type: `shape`
- Shape based on type:
  - Database: `flow_chart_magnetic_disk`
  - Cloud: `cloud`
  - File: `flow_chart_document`
- Content: `"${name}\n(${type})"`
- Position: `{x: index * 350, y: 400}`
- Style: `{fillColor: "#FFE0B2"}`

**Pipeline stages (top layer):**
For each stage (index 0 to m-1):
- Type: `shape`, Shape: `flow_chart_process`
- Content: stage name
- Position: `{x: index * 350, y: 0}`
- Style: `{fillColor: "#D3E5FF"}`

**Add flow arrows:**
Between consecutive stages:
- Type: `sticky_note`
- Content: "→"
- Position: between stages
- Style: `{color: "cyan"}`

From stages to data stores:
- Type: `sticky_note`
- Content: "↓ write/read"
- Position: connecting stage to relevant store
- Style: `{color: "light_green"}`

**Add monitoring/observability:**
- Type: `shape`, Shape: `circle`
- Content: "📊 Monitoring"
- Position: `{x: stages.length * 350, y: 200}`
- Style: `{fillColor: "#E1BEE7"}`

## Step 4: Confirm
Output: "✅ Created data pipeline with [count] stages and [count] data stores on [board name]"
