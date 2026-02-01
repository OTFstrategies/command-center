# Data Model

## Entities

### Project
Een project groepeert gerelateerde assets samen. Kan een codebase, applicatie of domein vertegenwoordigen. Assets die niet aan een specifiek project gekoppeld zijn vallen onder "global".

### RegistryItem
Een geregistreerd asset in het Command Center. Heeft een type (api, prompt, skill, agent, command of instruction), een naam, pad naar het bronbestand, en type-specifieke metadata. Behoort tot een project.

### ActivityLogEntry
Een event dat een wijziging of sync vastlegt. Bevat de actie (created, updated, deleted, synced), het item type, naam en tijdstip. Optioneel gekoppeld aan een specifiek RegistryItem.

## Relationships

- Project has many RegistryItems
- RegistryItem belongs to Project
- ActivityLogEntry optionally references RegistryItem
- RegistryItem has type-specific metadata based on its type
