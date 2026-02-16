---
allowed-tools: [mcp__mcp-miro__list_boards, mcp__mcp-miro__bulk_create_items]
description: Create a container diagram with technology stack
---
# Container Diagram

Create deployment architecture with tech stack.

## Step 1: Select Board
Use `mcp__mcp-miro__list_boards`, show numbered list, get board ID.

## Step 2: Collect Input
Ask: "Enter containers with technology (format: Name | Technology):"
Example: "Web App | React, API Server | Node.js + Express, Database | PostgreSQL, Cache | Redis"

Ask: "Enter connections (format: ContainerA → ContainerB | protocol):"
Example: "Web App → API Server | HTTPS/REST, API Server → Database | SQL, API Server → Cache | TCP"

Parse into: `containers` list and `connections` list.

## Step 3: Create Diagram
Use `mcp__mcp-miro__bulk_create_items`:

Create layered layout (typical web architecture):
- Tier 1 (top): Client apps
- Tier 2 (middle): Application servers
- Tier 3 (bottom): Data stores

**For each container (index 0 to n-1):**
1. Container box:
   - Type: `shape`, Shape: `rectangle`
   - Position: based on tier and index
   - Geometry: `{width: 350, height: 200}`
   - Style based on type:
     - Client: `{fillColor: "#E3F2FD"}` (blue)
     - Server: `{fillColor: "#C8E6C9"}` (green)
     - Database: `{fillColor: "#FFE0B2"}` (orange)

2. Container name:
   - Type: `sticky_note`
   - Content: container name (bold)
   - Position: top of container
   - Style: `{color: "light_blue"}`

3. Technology stack:
   - Type: `sticky_note`
   - Content: technology
   - Position: bottom of container
   - Style: `{color: "yellow"}`

**Add connection arrows:**
For each connection:
- Type: `sticky_note`
- Content: `"→ ${protocol}"`
- Position: between containers
- Style: `{color: "cyan"}`

## Step 4: Confirm
Output: "✅ Created container diagram with [count] containers and [count] connections on [board name]"
