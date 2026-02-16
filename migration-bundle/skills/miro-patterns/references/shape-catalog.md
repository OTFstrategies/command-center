# Miro Shape Catalog

Complete reference of all available Miro shapes with visual descriptions and use cases.

## Process & Workflow Shapes

### flow_chart_process
**Visual:** Rectangle
**Use:** Standard process step, action, or task
**Example:** "Process Payment", "Validate Input", "Send Email"

### flow_chart_predefined_process
**Visual:** Rectangle with double vertical lines on sides
**Use:** Subprocess, module, or pre-defined routine
**Example:** "Authentication Module", "Data Validation Routine"

### flow_chart_preparation
**Visual:** Hexagon
**Use:** Setup, initialization, or preparation step
**Example:** "Initialize Variables", "Load Configuration", "Set Up Environment"

### flow_chart_manual_operation
**Visual:** Trapezoid (slanted top)
**Use:** Manual intervention required
**Example:** "Manual Review", "User Approval", "Physical Inspection"

## Decision & Control Shapes

### flow_chart_decision
**Visual:** Diamond/Rhombus
**Use:** Decision point, conditional branching
**Example:** "Is Valid?", "Has Permission?", "Retry?"

### flow_chart_or
**Visual:** Circle
**Use:** Logical OR operation
**Example:** OR gate in logic diagrams

## Start/End Shapes

### flow_chart_terminator
**Visual:** Rounded rectangle (pill shape)
**Use:** Start or end point of process
**Example:** "Start", "End", "Exit", "Complete"

## Data & Storage Shapes

### flow_chart_document
**Visual:** Rectangle with wavy bottom
**Use:** Document, report, or printout
**Example:** "Invoice", "Report", "Receipt"

### flow_chart_multidocuments
**Visual:** Stack of documents (3 wavy rectangles)
**Use:** Multiple documents or file collection
**Example:** "Batch Reports", "Document Set"

### flow_chart_input_output
**Visual:** Parallelogram (slanted sides)
**Use:** Input or output operation
**Example:** "Read File", "Write Log", "User Input"

### flow_chart_magnetic_disk
**Visual:** Cylinder
**Use:** Database, disk storage, persistent data
**Example:** "PostgreSQL", "User Database", "Cache Storage"

### flow_chart_magnetic_drum
**Visual:** Drum shape (legacy storage)
**Use:** Historical/legacy storage representation
**Example:** Rarely used in modern diagrams

### flow_chart_online_storage
**Visual:** Cloud-like shape
**Use:** Cloud storage, online database
**Example:** "S3 Bucket", "Cloud Storage", "Remote DB"

## Connector Shapes

### flow_chart_connector
**Visual:** Small circle
**Use:** Off-page connector, continued on another page
**Example:** Connect split flows across pages

### flow_chart_offpage_connector
**Visual:** Pentagon pointing down
**Use:** Reference to another page or diagram
**Example:** "See Page 2", "Continued in Diagram B"

## Special Purpose Shapes

### flow_chart_delay
**Visual:** Half-circle or D-shape
**Use:** Wait, delay, or timer
**Example:** "Wait 5 seconds", "Delay Process", "Timer"

### flow_chart_note_curly_left
**Visual:** Rectangle with curly left brace
**Use:** Annotation or note pointing left
**Example:** Add explanatory notes

### flow_chart_note_curly_right
**Visual:** Rectangle with curly right brace
**Use:** Annotation or note pointing right
**Example:** Add explanatory notes

### flow_chart_note_square
**Visual:** Rectangle with right angle bracket
**Use:** Square bracket style note
**Example:** Add comments or clarifications

## Basic Geometric Shapes

### rectangle
**Use:** General purpose box, container
**Example:** Labels, categories, generic containers

### circle
**Use:** State, node, endpoint
**Example:** State machines, network nodes

### triangle
**Use:** Warning, direction indicator
**Example:** Alerts, pointers

### rhombus
**Use:** Decision (alternative to flow_chart_decision)
**Example:** Same as diamond for decisions

### hexagon
**Use:** Preparation (alternative to flow_chart_preparation)
**Example:** Setup steps

### octagon
**Use:** Stop sign, halt condition
**Example:** Error states, stop conditions

### star
**Use:** Highlight, special marker
**Example:** Important items, favorites

### cloud
**Use:** Cloud services, thoughts
**Example:** AWS, Azure, ideas

### cross
**Use:** Error, deletion, negative
**Example:** Mark errors, exclusions

## Arrow Shapes

### right_arrow
**Use:** Forward direction, progression
**Example:** Flow direction, next step

### left_arrow
**Use:** Backward direction, return
**Example:** Go back, previous step

### left_right_arrow
**Use:** Bidirectional flow, exchange
**Example:** Two-way communication, sync

## Shape Selection Guide

**For Process Flows:**
- Use flow_chart_process for standard steps
- Use flow_chart_terminator for start/end
- Use flow_chart_decision for branching

**For Data Flows:**
- Use flow_chart_document for files
- Use flow_chart_magnetic_disk for databases
- Use flow_chart_input_output for I/O operations

**For System Diagrams:**
- Use rectangle for components
- Use circle for nodes/services
- Use cloud for cloud services

**For State Machines:**
- Use circle for states
- Use arrows for transitions
- Use rhombus for choice states

## Color Recommendations by Shape Type

- **Process shapes:** light_blue (#D3E5FF)
- **Decision shapes:** yellow (#FFF9C4)
- **Terminator shapes:** light_green for end, light_blue for start
- **Data shapes:** orange (#FFE0B2)
- **Error/Warning:** light_pink (#FFCDD2)
- **Notes/Annotations:** cyan (#B2EBF2)
