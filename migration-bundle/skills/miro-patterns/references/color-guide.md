# Miro Color Guide

Comprehensive color palette and usage guidelines for Miro boards.

## Available Colors

Miro provides 16 standard colors for sticky notes and shapes:

### Primary Colors
- `gray` - #E0E0E0
- `light_yellow` - #FFF9C4
- `yellow` - #FFEB3B
- `orange` - #FF9800
- `light_green` - #C8E6C9
- `green` - #4CAF50
- `dark_green` - #2E7D32
- `cyan` - #00BCD4
- `light_pink` - #FFCDD2
- `pink` - #F48FB1
- `violet` - #CE93D8
- `red` - #F44336
- `light_blue` - #BBDEFB
- `blue` - #2196F3
- `dark_blue` - #1565C0
- `black` - #000000

## Color Psychology

### Warm Colors (Energy, Action, Urgency)
- **Red:** Critical, errors, urgent, stop
- **Orange:** Warning, important, attention needed
- **Yellow:** Caution, decision needed, highlight

### Cool Colors (Calm, Process, Structure)
- **Blue:** Process, standard, information, trust
- **Green:** Success, go, approved, complete
- **Cyan:** Information, notes, communication

### Neutral Colors
- **Gray:** Disabled, archived, low priority
- **Black:** Text-heavy, emphasis, high contrast

### Special Colors
- **Pink/Violet:** Special cases, exceptions, creative
- **Light variations:** Softer versions for backgrounds

## Usage Patterns by Diagram Type

### Process Flows
```
Start/Input: light_blue
Standard Process: light_blue
Important Process: blue
Critical Process: dark_blue
Decision: yellow or orange
Success/Approved: light_green
Error/Rejected: light_pink
End/Output: green
```

### Status Indicators
```
To Do: light_yellow
In Progress: light_blue
Review: yellow
Blocked: orange
Done: light_green
Cancelled: gray
```

### Priority Levels
```
Critical: red
High: orange
Medium: yellow
Low: light_blue
None: gray
```

### Risk Assessment
```
High Risk: red
Medium Risk: orange
Low Risk: green
No Risk: light_green
```

## Color Schemes

### Monochromatic (Professional)
Use shades of one color for cohesive look:
- **Blue scheme:** light_blue → blue → dark_blue
- **Green scheme:** light_green → green → dark_green

### Complementary (High Contrast)
Pair opposites for emphasis:
- **Blue + Orange:** Process (blue) vs. Warning (orange)
- **Green + Red:** Success (green) vs. Error (red)

### Analogous (Harmonious)
Use adjacent colors for smooth transitions:
- **Blue → Cyan → Green:** Sequential processes
- **Yellow → Orange → Red:** Escalating severity

### Triadic (Balanced)
Three evenly-spaced colors:
- **Blue + Yellow + Pink:** Balanced categories
- **Green + Orange + Violet:** Diverse but unified

## Best Practices

### Consistency
- Define color meaning at start of project
- Use same colors for same concepts across boards
- Document color scheme in legend

### Accessibility
- Avoid relying solely on color for meaning
- Use labels in addition to colors
- Consider colorblind-friendly combinations:
  - ✅ Blue + Orange
  - ✅ Blue + Yellow
  - ❌ Red + Green (avoid for critical distinctions)

### Hierarchy
Use color saturation to show hierarchy:
- **Light colors:** Background, containers, less important
- **Bright colors:** Foreground, items, important
- **Dark colors:** Headers, emphasis, critical

### Quantity
- **Limit palette:** 5-7 colors maximum per board
- **Default colors:** Establish 2-3 primary colors
- **Reserve special:** Keep 1-2 colors for exceptions

## Common Mistakes

### ❌ Too Many Colors
Using all 16 colors creates visual chaos
**✅ Solution:** Stick to 5-7 colors with clear purpose

### ❌ Inconsistent Meaning
Same color means different things
**✅ Solution:** Document color → meaning mapping

### ❌ Low Contrast
Light colors on white background are hard to see
**✅ Solution:** Use borders or darker shades for visibility

### ❌ Relying Only on Color
Colorblind users can't distinguish red/green
**✅ Solution:** Add text labels, shapes, or icons

## Template-Specific Color Schemes

### Kanban Board
```
Backlog: light_yellow
To Do: yellow
In Progress: light_blue
Review: cyan
Done: light_green
Blocked: orange
```

### Priority Matrix
```
Quick Wins (High Impact, Low Effort): light_green
Big Bets (High Impact, High Effort): light_blue
Fill Ins (Low Impact, Low Effort): light_yellow
Avoid (Low Impact, High Effort): light_pink
```

### Flowchart
```
Start: light_blue
Process: blue
Decision: yellow
Success: light_green
Error: light_pink
End: green
```

### Risk Matrix
```
Low Risk: light_green
Medium Risk: yellow
High Risk: orange
Critical Risk: red
```

## Custom Color Codes

For shapes using fillColor and borderColor, use hex codes:

```javascript
// Blue scheme
fillColor: "#BBDEFB"    // light_blue
fillColor: "#2196F3"    // blue
fillColor: "#1565C0"    // dark_blue

// Green scheme
fillColor: "#C8E6C9"    // light_green
fillColor: "#4CAF50"    // green
fillColor: "#2E7D32"    // dark_green

// Status scheme
fillColor: "#FFF9C4"    // pending (light_yellow)
fillColor: "#BBDEFB"    // in progress (light_blue)
fillColor: "#C8E6C9"    // complete (light_green)
fillColor: "#FFCDD2"    // error (light_pink)
```

## Testing Your Color Scheme

Before finalizing:
1. **View from distance:** Colors should be distinguishable from 6 feet away
2. **Check contrast:** Text readable on colored backgrounds
3. **Simulate colorblindness:** Use tools to check accessibility
4. **Get feedback:** Show to 2-3 people unfamiliar with project
5. **Document scheme:** Add legend to board explaining colors

## Color Evolution

As your board grows:
- **Phase 1 (Simple):** 3 colors - primary workflow
- **Phase 2 (Moderate):** 5 colors - add status/priority
- **Phase 3 (Complex):** 7 colors - full categorization
- **Never exceed:** 10 colors - becomes unmanageable
