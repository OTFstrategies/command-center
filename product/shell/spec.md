# Application Shell Specification

## Overview

Minimalistische sidebar navigatie met icon-only weergave en tooltips on hover. De shell biedt een vaste navigatie aan de linkerkant met de hoofdcontent rechts ervan.

## Navigation Structure

- **Home** → Dashboard met statistieken per asset type en recente activiteit
- **Registry** → Asset beheer met tabs voor APIs, Prompts, Skills, Agents, Commands, Instructions
- **Activity** → Chronologische activiteiten feed
- **Settings** → Connectie status en voorkeuren

## Layout Pattern

- **Sidebar:** 64px breed, fixed left, icons only
- **Tooltips:** Verschijnen rechts van icon on hover
- **Active state:** Blue highlight op actieve navigatie item
- **Content area:** Volledige breedte minus sidebar, scrollable
- **Responsive:** Sidebar blijft zichtbaar op alle schermformaten
