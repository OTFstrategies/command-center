---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a module dependency diagram
---
# Module Dependencies

Create module/package dependency graph.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter modules (comma-separated):"
Example: "Core, Utils, Auth, API, UI"

Ask: "Enter dependencies (format: ModuleA → ModuleB):"
Example: "API → Auth, API → Core, Auth → Core, UI → API, Utils → Core"

Parse into: `modules` list and `dependencies` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

Create hierarchical layout (dependencies flow downward):
- Sort modules by dependency depth
- Place independent modules at top
- Dependent modules below

**For each module (index 0 to n-1):**
- Calculate level (depth in dependency tree)
- Type: `shape`, Shape: `rectangle`
- Content: module name
- Position: `{x: horizontal_index * 350, y: level * 250}`
- Geometry: `{width: 300, height: 150}`
- Style based on level:
  - Level 0 (no deps): `{fillColor: "#C8E6C9"}` (green - independent)
  - Level 1+: `{fillColor: "#D3E5FF"}` (blue - dependent)

**Add dependency arrows:**
For each dependency (A → B):
- Type: `sticky_note`
- Content: "imports →"
- Position: between modules
- Style: `{color: "cyan"}`

**Add legend:**
- Type: `sticky_note`
- Content: "Arrow direction shows import/dependency"
- Position: `{x: 0, y: -150}`
- Style: `{color: "yellow"}`

## Step 4: Confirm
Output: "✅ Created module dependency diagram with [count] modules and [count] dependencies on [board name]"
