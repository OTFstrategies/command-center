---
name: Miro Patterns
description: This skill should be used when working with Miro boards, creating diagrams, flowcharts, or visualizations, or when the user asks about "Miro shapes", "Miro colors", "positioning items", "layout best practices", or "which shape to use". Provides knowledge about Miro shape types, color conventions, positioning patterns, and MCP tool usage.
version: 0.1.0
---

# Miro Patterns

This skill provides essential knowledge for creating effective Miro boards using the Miro MCP tools. It covers shape selection, color conventions, positioning strategies, and tool usage patterns.

## Core Concepts

### Shape Types

Miro provides various shape types optimized for different diagram purposes:

**Process & Workflow Shapes:**
- `flow_chart_process` - Standard process box (rectangle)
- `flow_chart_predefined_process` - Subprocess indicator (double-line rectangle)
- `flow_chart_preparation` - Setup/preparation step (hexagon)
- `flow_chart_manual_operation` - Manual intervention required (trapezoid)

**Decision & Control:**
- `flow_chart_decision` - Decision point (diamond/rhombus)
- `flow_chart_or` - Logical OR operation (circle)

**Start/End Points:**
- `flow_chart_terminator` - Start or end (rounded rectangle)

**Data & Storage:**
- `flow_chart_document` - Document or report
- `flow_chart_multidocuments` - Multiple documents
- `flow_chart_input_output` - Input/output operation (parallelogram)
- `flow_chart_magnetic_disk` - Database or persistent storage
- `flow_chart_magnetic_drum` - Legacy storage representation
- `flow_chart_online_storage` - Cloud or online storage

**Connectors & Special:**
- `flow_chart_connector` - Off-page connector (small circle)
- `flow_chart_offpage_connector` - Links to another page (pentagon)
- `flow_chart_delay` - Wait or delay (half-circle)
- `flow_chart_note_*` - Annotations (various curly/square notes)

**Basic Shapes:**
- `rectangle` - General purpose box
- `circle` - General purpose circle
- `triangle`, `hexagon`, `octagon` - Polygons
- `rhombus` - Diamond
- `star`, `cloud`, `cross` - Special symbols
- `right_arrow`, `left_arrow`, `left_right_arrow` - Directional indicators

### Color Conventions

Use consistent colors to convey meaning:

**Process Status:**
- `light_blue` - Standard process steps
- `blue` - Important/highlighted processes
- `dark_blue` - Critical path processes

**Decision Points:**
- `yellow` - Decisions requiring attention
- `orange` - Important decisions
- `light_yellow` - Minor decisions

**Results & Status:**
- `light_green` - Success, completion, approved
- `green` - Go/proceed state
- `dark_green` - Final success state

**Warnings & Errors:**
- `light_pink` - Warnings, needs review
- `pink` - Errors or problems
- `red` - Critical issues, blocking

**Information:**
- `cyan` - Information, notes
- `violet` - Special cases
- `gray` - Disabled, archived, or deprecated

**Neutral:**
- `black` - Text-heavy content or emphasis

### Positioning Strategies

**Vertical Flows:**
```
Standard spacing: y += 300 between items
Compact spacing: y += 200 for dense flows
Generous spacing: y += 400 for readable layouts
```

**Horizontal Flows:**
```
Standard spacing: x += 400 between items
Compact spacing: x += 300 for dense flows
Generous spacing: x += 500 for readable layouts
```

**Grid Layouts (Matrices, Kanban):**
```
Grid cell size: 250px × 250px
Column spacing: 300px between columns
Row spacing: 300px between rows
```

**Radial Layouts (Mind Maps):**
```
Center: x=0, y=0
Ring 1 radius: 400px (main branches)
Ring 2 radius: 700px (sub-branches)
Angular spacing: 360° / number_of_branches
```

**Swimlane Layouts:**
```
Lane height: 400px
Lane spacing: 50px vertical gap
Item spacing within lane: 350px horizontal
```

## Tool Usage Patterns

### Bulk Creation

Use `mcp__mcp-miro__bulk_create_items` for creating multiple items efficiently (max 20 items per call):

```javascript
{
  "boardId": "board-id",
  "items": [
    {
      "type": "sticky_note",
      "data": { "content": "Text" },
      "position": { "x": 0, "y": 0 },
      "style": { "color": "yellow" }
    },
    {
      "type": "shape",
      "data": { "content": "Process", "shape": "flow_chart_process" },
      "position": { "x": 400, "y": 0 },
      "style": { "fillColor": "#D3E5FF" }
    }
  ]
}
```

### Individual Shape Creation

Use `mcp__mcp-miro__create_shape` for single shapes with detailed styling:

```javascript
{
  "boardId": "board-id",
  "shape": "flow_chart_process",
  "content": "Process Step",
  "position": { "x": 0, "y": 0, "origin": "center" },
  "geometry": { "width": 200, "height": 100, "rotation": 0 },
  "style": {
    "fillColor": "#D3E5FF",
    "borderColor": "#1A73E8",
    "borderWidth": 2,
    "fontSize": 14
  }
}
```

### Sticky Notes

Use `mcp__mcp-miro__create_sticky_note` for quick notes:

```javascript
{
  "boardId": "board-id",
  "content": "Note text",
  "x": 0,
  "y": 0,
  "color": "yellow"  // or light_green, light_blue, light_pink, etc.
}
```

## Best Practices

### Shape Selection
- Use flowchart shapes for process diagrams (flow_chart_*)
- Use rectangles/circles for conceptual diagrams
- Use sticky notes for brainstorming and flexible content
- Match shape to semantic meaning (decision = diamond)

### Color Usage
- Maintain consistency within a board
- Use color to indicate status or category
- Avoid too many colors (5-7 max)
- Consider colorblind-friendly combinations

### Positioning
- Start from origin (0, 0) or calculate center
- Maintain consistent spacing
- Align items on grid for professional appearance
- Group related items spatially

### Text Content
- Keep text concise (2-8 words per shape)
- Use sentence case for readability
- Include only essential information
- Consider font size for readability (12-16pt)

## Workflow Patterns

### Linear Process Flow
1. List process steps
2. Calculate vertical positions (y = index × 300)
3. Create flow_chart_process shapes
4. Use flow_chart_terminator for start/end
5. Add arrows or connectors (manual or as text)

### Decision Tree
1. Identify decision points
2. Use flow_chart_decision for decisions
3. Use flow_chart_process for actions
4. Position branches horizontally from decisions
5. Color-code paths (green=yes, pink=no)

### Kanban Board
1. Create frames for columns
2. Position frames horizontally (x = index × 350)
3. Add sticky notes within frames
4. Use consistent colors per column or category

### Matrix Grid
1. Calculate grid dimensions
2. Create frames for cells
3. Position in grid: (column × 300, row × 300)
4. Add content within frames

## Additional Resources

### Reference Files

For detailed shape catalogs and advanced patterns:
- **`references/shape-catalog.md`** - Complete shape type reference with visual examples
- **`references/color-guide.md`** - Comprehensive color palette and usage guidelines
- **`references/layout-patterns.md`** - Advanced positioning techniques and templates

### Example Files

Working code patterns in `examples/`:
- **`flowchart-example.json`** - Complete flowchart item structure
- **`kanban-example.json`** - Kanban board template
- **`matrix-example.json`** - 2×2 matrix template

Consult these resources when working with complex layouts or when detailed shape/color information is needed.
