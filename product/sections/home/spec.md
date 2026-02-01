# Home Specification

## Overview
Dashboard met één clean overzicht van alle Command Center data. Statistieken bovenaan voor snelle asset tellingen, recente activiteit in het midden voor context, optionele quick access onderaan voor frequent gebruikte items.

## User Flows
- Bekijk totaal aantal assets per type in de statistieken rij
- Klik op een statistiek om naar die asset sectie te navigeren
- Bekijk recente activiteit met type, naam, tijd en project
- Klik op een activiteit item om naar de detail pagina te gaan
- Bekijk meest gebruikte items in quick access sectie

## UI Requirements
- Statistieken rij: compact inline met 6 label:nummer pairs horizontaal
- Statistieken klikbaar, navigeert naar betreffende sectie
- Activity feed: laatste 5-10 items chronologisch
- Activity item toont: type icon, asset naam, relatieve timestamp, project naam
- Relatieve timestamps: vandaag, gisteren, X dagen geleden
- Quick access sectie: alleen tonen wanneer er data beschikbaar is
- Geen welkomstbericht of greeting
- Geen grafieken, charts of visualisaties
- Geen tips, hints of onboarding
- Geen lege states met uitleg tekst

## Configuration
- shell: true
