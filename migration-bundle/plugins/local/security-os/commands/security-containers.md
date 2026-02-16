---
name: security-containers
description: Scan Docker containers en configuratie
user_invocable: true
---

# /security-containers

Scan container configuratie en images.

## Wat het doet
1. `trivy config .` -- Dockerfile best practice check
2. `trivy fs .` -- filesystem scan op kwetsbaarheden
3. `trivy image {name}` -- image scan (als Docker draait en image beschikbaar is)
4. Rapporteert per bevinding met fix-suggestie

## Wanneer relevant
- Alleen als er een Dockerfile of docker-compose.yml in het project staat
- Als er geen containers zijn: meldt "Geen container configuratie gevonden"
