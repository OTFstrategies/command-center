---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a UML-style class diagram with relationships
---
# Class Diagram

Create UML-style class relationships.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter classes with properties (format: ClassName: prop1, prop2):"
Example: "User: id, name, email | Post: id, title, content | Comment: id, text"

Ask: "Enter relationships (format: ClassA → ClassB | relationship):"
Example: "User → Post | has many, Post → Comment | has many"

Parse into: `classes` list and `relationships` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

Calculate positions in grid layout.

**For each class (index 0 to n-1):**
1. Class box:
   - Type: `shape`, Shape: `rectangle`
   - Position: calculated grid position
   - Geometry: `{width: 300, height: 150}`
   - Style: `{fillColor: "#E3F2FD", borderColor: "#1A73E8", borderWidth: 2}`

2. Class name header:
   - Type: `sticky_note`
   - Content: class name (bold)
   - Position: top of class box
   - Style: `{color: "light_blue"}`

3. Properties list:
   - Type: `sticky_note`
   - Content: properties (comma-separated)
   - Position: below header
   - Style: `{color: "yellow"}`

**Add relationship arrows:**
For each relationship:
- Type: `sticky_note`
- Content: `"→ ${relationship_type}"`
- Position: between related classes
- Style: `{color: "cyan"}`

## Step 4: Confirm
Output: "✅ Created class diagram with [count] classes and [count] relationships on [board name]"
