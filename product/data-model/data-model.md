# Data Model

## Entities

### Asset
Basis entity voor alle herbruikbare Claude Code items. Bevat gedeelde velden zoals id, name, path, description, created en tags. Alle specifieke asset types erven van deze basis.

### Api
Een API configuratie met service informatie, endpoints en authenticatie details. Voorbeelden: OpenAI API, Supabase credentials, externe service configs.

### Prompt
Een herbruikbare prompt die system prompts, project-specifieke prompts of templates kan zijn. Bevat het prompt type en eventuele variabelen die ingevuld kunnen worden.

### Skill
Een skill definitie met een of meerdere bestanden. Kan dependencies hebben op andere skills voor hergebruik van functionaliteit.

### Agent
Een agent definitie met toegewezen tools en configuraties. Kan een parent agent hebben voor inheritance van eigenschappen.

### Command
Een slash command met categorie indeling. Kan subcommands bevatten voor geneste functionaliteit.

### Instruction
Workflow instructies of project-specifieke regels. Heeft een scope die aangeeft of het voor een workflow of specifiek project geldt.

### Project
Een project waaraan assets gekoppeld kunnen zijn. Assets kunnen ook global zijn (niet aan een project gekoppeld).

### Activity
Een log entry die bijhoudt wanneer een asset is aangemaakt of gebruikt. Linkt naar de betreffende asset en bevat het event type en timestamp.

## Relationships

- Asset belongs to Project (optioneel — kan ook global zijn)
- Api, Prompt, Skill, Agent, Command, Instruction zijn allen een type Asset
- Activity references Asset (welke asset triggerde het event)
- Agent can have parent Agent (voor inheritance van tools en config)
- Skill can have many Skill dependencies (voor hergebruik)
- Command can have many Command subcommands (voor geneste commands)
