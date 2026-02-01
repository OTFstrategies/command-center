# Notes Specification

## Overview
Canvas-style notitieruimte per project. Miro/Obsidian-geïnspireerd met vrije positionering van notities, links tussen notities, en markdown ondersteuning.

## User Flows
- Selecteer project om notities te bekijken
- Maak nieuwe notitie aan op canvas
- Sleep notities naar gewenste positie
- Link notities aan elkaar
- Zoek in notities

## Components

### Canvas View
- Oneindige canvas met zoom/pan
- Grid achtergrond (subtiel, optioneel)
- Notities als kaarten op canvas

### Note Card
- Titel
- Markdown content
- Positie (x, y)
- Grootte (width, height)
- Kleur (optioneel, monochroom)

### Connections
- Lijnen tussen notities
- Simpele pijlen, geen labels

### Project Selector
- Dropdown of tabs per project
- "Global" optie voor project-onafhankelijke notities

## Data

### Per Note
- id, title, content (markdown)
- position: { x, y }
- size: { width, height }
- project: string
- connections: string[] (note ids)
- created, updated

## UI Requirements
- Clean, minimalistisch
- Geen toolbar clutter - contextmenu bij rechtermuisklik
- Keyboard shortcuts voor common actions
- Auto-save
- Smooth pan/zoom

## Empty State
Leeg canvas met subtiele hint: "Dubbelklik om notitie toe te voegen"
