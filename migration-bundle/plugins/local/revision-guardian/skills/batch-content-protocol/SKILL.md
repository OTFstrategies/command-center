---
name: batch-content-protocol
description: Use this skill when generating batch content (lists, numbered items, multiple similar outputs). Triggers on patterns like "maak een lijst", "genereer X items", "geef me Y voorbeelden", or any task requiring more than 5 similar items. Enforces revision-safe batch generation to prevent the forward-only integration pattern.
---

# Batch Content Protocol

## Wanneer Actief
Dit protocol is actief wanneer je meer dan 5 vergelijkbare items moet genereren:
lijsten, vragen, tips, regels, voorbeelden, stappen, varianten, etc.

## Het Probleem Dat Dit Voorkomt
Bij batch content generatie (10+ items) ontstaat een patroon waarbij:
1. Je genereert items op basis van je initieel begrip
2. Halverwege geeft de gebruiker feedback of correcties
3. Je past TOEKOMSTIGE items aan, maar gaat NIET terug naar eerdere items
4. Resultaat: inconsistente output waar alleen de latere items correct zijn

## Protocol

### Stap 1: Principes Eerst
VOORDAT je begint met genereren:
- Vraag de gebruiker om de kernprincipes/criteria te benoemen
- Herhaal deze principes ter bevestiging
- Leg de principes vast als referentiepunt

### Stap 2: Kleine Batches
- Genereer maximaal **5-10 items** per batch
- Presenteer de batch aan de gebruiker
- WACHT op antwoord

### Stap 3: Checkpoint Na Elke Batch
- Vraag: "Voldoen deze items aan je verwachting?"
- Vraag: "Zijn er principes die ik moet aanpassen?"
- WACHT op antwoord voordat je doorgaat

### Stap 4: Bij Feedback — VERPLICHTE REVISIE
Wanneer de gebruiker feedback geeft:
1. **STOP** onmiddellijk
2. **HERHAAL** het nieuwe inzicht
3. **GA TERUG** naar alle eerdere items
4. **CONTROLEER** elk eerder item tegen het nieuwe inzicht
5. **PAS AAN** wat niet voldoet
6. **RAPPORTEER** wat je hebt aangepast
7. **GA VERDER** met de volgende batch vanuit het nieuwe inzicht

### Stap 5: Vers Genereren
- Genereer ALTIJD vers vanuit je huidige begrip
- Presenteer NOOIT vooraf geplande content
- Bij twijfel: genereer opnieuw

### Stap 6: Afsluiting
- Controleer ALLE items op consistentie met de laatst bekende principes
- Rapporteer: "Alle [N] items zijn gecontroleerd tegen [principes]"

## Anti-patronen

| Fout | Correct |
|------|---------|
| 50 items in een keer | Max 10 per batch |
| Doorgaan na feedback | STOP, herzien, dan verder |
| "Ik heb de rest al klaar" | Genereer vers na feedback |
| Alleen toekomstige items aanpassen | ALLE items herzien |
| Aannemen dat eerdere items goed zijn | Expliciet controleren |
