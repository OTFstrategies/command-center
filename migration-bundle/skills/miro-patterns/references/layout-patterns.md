# Miro Layout Patterns

Advanced positioning techniques and layout templates for professional Miro boards.

## Layout Fundamentals

### Spacing Guidelines

**Standard Spacing:**
- **Vertical flow:** 300px between items
- **Horizontal flow:** 400px between items
- **Grid spacing:** 250px × 250px cells
- **Frame padding:** 50px internal margins

**Compact Spacing (Dense Boards):**
- **Vertical:** 200px
- **Horizontal:** 300px
- **Grid:** 180px × 180px

**Generous Spacing (Presentations):**
- **Vertical:** 400px
- **Horizontal:** 500px
- **Grid:** 350px × 350px

### Origin Points

Most layouts start from origin (0, 0):
- **Single flow:** Start at (0, 0), progress down/right
- **Centered layout:** Calculate center, work outward
- **Grid layout:** Top-left at (0, 0), expand right/down
- **Radial layout:** Center at (0, 0), expand circularly

## Common Layout Patterns

### 1. Vertical Linear Flow

**Use:** Sequential processes, timelines, step-by-step
**Formula:** Each item at (0, index × 300)

```
Item 1: (0, 0)
Item 2: (0, 300)
Item 3: (0, 600)
Item 4: (0, 900)
```

**Variations:**
- **Zigzag:** Alternate x position: (0, y) then (400, y+300) then (0, y+600)
- **Staggered:** Slight x offset: (index % 2 × 100, index × 300)

### 2. Horizontal Linear Flow

**Use:** Timelines, roadmaps, pipelines
**Formula:** Each item at (index × 400, 0)

```
Item 1: (0, 0)
Item 2: (400, 0)
Item 3: (800, 0)
Item 4: (1200, 0)
```

**Variations:**
- **Wave:** Alternate y: (index × 400, index % 2 × 200)
- **Ascending:** Increase y: (index × 400, index × 100)

### 3. Grid Layout (Matrix)

**Use:** Matrices, Kanban, tables
**Formula:** Position at (col × width, row × height)

```javascript
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    x = col * 300
    y = row * 250
  }
}
```

**Example 3×3:**
```
(0,0)     (300,0)   (600,0)
(0,250)   (300,250) (600,250)
(0,500)   (300,500) (600,500)
```

### 4. Radial/Circular Layout

**Use:** Mind maps, hub-and-spoke, cyclical processes
**Formula:** Calculate using trigonometry

```javascript
centerX = 0
centerY = 0
radius = 400
angleStep = 360 / itemCount

for (let i = 0; i < itemCount; i++) {
  angle = i * angleStep * (Math.PI / 180)
  x = centerX + radius * Math.cos(angle)
  y = centerY + radius * Math.sin(angle)
}
```

**Example 6 items in circle:**
- Radius: 400px
- Angles: 0°, 60°, 120°, 180°, 240°, 300°

**Concentric Rings:**
- Ring 1: radius 300px (core concepts)
- Ring 2: radius 600px (sub-concepts)
- Ring 3: radius 900px (details)

### 5. Tree/Hierarchical Layout

**Use:** Org charts, decision trees, taxonomies
**Formula:** Binary tree positioning

```
Root: (0, 0)
Level 1: (-400, 300), (400, 300)
Level 2: (-600, 600), (-200, 600), (200, 600), (600, 600)
```

**Balanced Binary Tree:**
- Level 0: 1 node centered
- Level 1: 2 nodes, spacing = 2^(max_level - 1) × base_width
- Level 2: 4 nodes, spacing = 2^(max_level - 2) × base_width

**N-ary Tree:**
- Calculate total width needed for children
- Distribute evenly across width
- Maintain vertical spacing

### 6. Swimlane Layout

**Use:** Cross-functional flows, multi-actor processes
**Formula:** Horizontal lanes with internal flow

```javascript
laneHeight = 400
laneSpacing = 50
itemSpacing = 350

for (let lane = 0; lane < lanes; lane++) {
  laneY = lane * (laneHeight + laneSpacing)

  // Items within lane flow horizontally
  for (let item = 0; item < itemsInLane; item++) {
    x = item * itemSpacing + 100
    y = laneY + 100
  }
}
```

### 7. Cluster/Group Layout

**Use:** Categorized items, grouped features
**Formula:** Groups with internal layouts

```javascript
groupWidth = 500
groupHeight = 400
groupSpacing = 100

for (let group = 0; group < groups; group++) {
  groupX = (group % cols) * (groupWidth + groupSpacing)
  groupY = Math.floor(group / cols) * (groupHeight + groupSpacing)

  // Items within group use sub-layout (grid, list, etc.)
}
```

### 8. Force-Directed Layout (Approximation)

**Use:** Network graphs, relationship maps
**Approach:** Spread items evenly, avoid overlaps

```javascript
// Simple grid-based spread
gridSize = Math.ceil(Math.sqrt(itemCount))
cellSize = 400

for (let i = 0; i < itemCount; i++) {
  row = Math.floor(i / gridSize)
  col = i % gridSize

  x = col * cellSize + (Math.random() * 100 - 50)
  y = row * cellSize + (Math.random() * 100 - 50)
}
```

## Template-Specific Layouts

### Kanban Board Layout
```
Column width: 350px
Column spacing: 50px
Card height: 100px
Card spacing: 20px

Column 1: x=0
Column 2: x=400
Column 3: x=800

Cards stack vertically within column:
Card 1: y=50
Card 2: y=170
Card 3: y=290
```

### Priority Matrix (2×2)
```
Quadrant size: 400×350
Spacing: 50px

Top-Left (High/Low): (0, 0)
Top-Right (High/High): (450, 0)
Bottom-Left (Low/Low): (0, 400)
Bottom-Right (Low/High): (450, 400)
```

### Timeline Layout
```
Timeline bar: center horizontally, y=200
Milestone spacing: 350px apart
Milestone markers: 40px circles on timeline
Labels above: y=50
Labels below: y=300
```

### Mind Map Layout
```
Central concept: (0, 0), size=200×200
Main branches: radius=400, 4-8 items
Sub-branches: radius=700, 2-4 per main
Details: radius=1000, as needed
```

## Alignment Strategies

### Grid Alignment
- **Snap to grid:** Round x and y to nearest 50px
- **Consistent spacing:** Use multiples of base unit (50px)
- **Visual rhythm:** Maintain regular intervals

### Visual Balance
- **Symmetric:** Mirror items across center axis
- **Asymmetric:** Balance visual weight (larger items closer to center)
- **Rule of thirds:** Place important items at 1/3 and 2/3 points

### Whitespace
- **Breathing room:** Minimum 100px between major groups
- **Frame padding:** 50px inside frames
- **Edge margins:** 100px from board edges

## Advanced Techniques

### Layering
```
Background: y = 0-1000 (grids, guides)
Content: y = 1000-2000 (main items)
Annotations: y = 2000-3000 (notes, labels)
Foreground: y = 3000+ (highlights)
```

### Responsive Sizing
Adjust spacing based on content:
```javascript
itemCount = items.length
spacing = itemCount < 5 ? 400 :
          itemCount < 10 ? 300 :
          200  // compact for many items
```

### Dynamic Centering
Center group of items:
```javascript
totalWidth = (itemCount - 1) * spacing
startX = -totalWidth / 2

for (let i = 0; i < itemCount; i++) {
  x = startX + (i * spacing)
}
```

### Connection Optimization
Minimize crossing lines:
```
1. Sort items by connection count
2. Place highly connected items centrally
3. Place leaf items on periphery
4. Use routing hints (straight, curved, right-angle)
```

## Layout Validation Checklist

Before finalizing layout:
- [ ] No overlapping items (minimum 50px clearance)
- [ ] Consistent spacing within same type
- [ ] Alignment to grid (when applicable)
- [ ] Readable at 100% zoom
- [ ] Clear flow direction
- [ ] Grouped related items
- [ ] Sufficient whitespace
- [ ] Proper use of frames/containers
- [ ] Labels readable
- [ ] Connection lines clear

## Performance Considerations

### Large Boards (>100 items)
- **Use frames:** Group items into frames
- **Limit viewport:** Don't create items outside working area
- **Batch creation:** Use bulk_create_items
- **Optimize spacing:** Use tighter spacing (200px instead of 300px)

### Complex Layouts
- **Limit levels:** Max 3-4 hierarchy levels
- **Simplify connections:** Avoid fully connected graphs
- **Use color coding:** Reduce need for text labels
- **Chunk information:** Multiple boards instead of one huge board

## Common Layout Mistakes

### ❌ Uneven Spacing
**Problem:** Items at 300px, 350px, 290px intervals
**Solution:** Use consistent spacing constant

### ❌ Overlapping Items
**Problem:** Items too close, labels overlap
**Solution:** Calculate bounds, add padding

### ❌ No Visual Hierarchy
**Problem:** All items same size/color/position
**Solution:** Vary size, use frames, apply color scheme

### ❌ Poor Flow Direction
**Problem:** Unclear which direction to read
**Solution:** Use arrows, establish clear top-to-bottom or left-to-right flow

### ❌ Wasted Space
**Problem:** Items clustered in corner, rest empty
**Solution:** Center layout, use available space

## Layout Testing

Test your layout:
1. **Zoom out to 25%:** Should see overall structure
2. **Zoom to 100%:** Should read all text
3. **Zoom to 200%:** Details clear
4. **Move through flow:** Can follow process without jumping
5. **Check connections:** Lines don't cross unnecessarily

## Reference Implementations

See examples/ directory for:
- `flowchart-example.json` - Vertical flow layout
- `kanban-example.json` - Grid + swimlane layout
- `matrix-example.json` - 2×2 matrix layout

Each shows complete positioning calculation.
