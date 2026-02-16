---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create an Entity Relationship Diagram (ERD)
---
# Entity Relationship Diagram (ERD)

Create database entity relationships.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter entities with key fields (format: EntityName: id, field1, field2):"
Example: "User: id, name, email | Post: id, user_id, title | Comment: id, post_id, user_id, text"

Ask: "Enter relationships (format: Entity1 relationship Entity2 | cardinality):"
Example: "User has Post | 1:N, Post has Comment | 1:N, User has Comment | 1:N"

Parse into: `entities` list and `relationships` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

Calculate positions (spread entities in grid).

**For each entity (index 0 to n-1):**
1. Entity box:
   - Type: `shape`, Shape: `rectangle`
   - Position: grid position
   - Geometry: `{width: 300, height: 200}`
   - Style: `{fillColor: "#E3F2FD", borderColor: "#1A73E8", borderWidth: 2}`

2. Entity name (header):
   - Type: `sticky_note`
   - Content: entity name (bold)
   - Position: top of box
   - Style: `{color: "light_blue"}`

3. Primary key:
   - Type: `sticky_note`
   - Content: "🔑 " + first field (typically 'id')
   - Position: below header
   - Style: `{color: "yellow"}`

4. Other fields:
   - Type: `sticky_note`
   - Content: remaining fields
   - Position: below PK
   - Style: `{color: "light_yellow"}`

**Add relationship lines:**
For each relationship:
- Type: `sticky_note`
- Content: `"${cardinality} ${relationship_type}"`
- Examples: "1:N has", "N:M belongs_to"
- Position: between related entities
- Style: `{color: "cyan"}`

**Add legend:**
- Type: `sticky_note`
- Content: "1:1 = One-to-One, 1:N = One-to-Many, N:M = Many-to-Many"
- Position: `{x: 0, y: -150}`
- Style: `{color: "orange"}`

## Step 4: Confirm
Output: "✅ Created ERD with [count] entities and [count] relationships on [board name]"
