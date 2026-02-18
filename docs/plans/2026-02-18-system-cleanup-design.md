# Volledige Systeemschoonmaak — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Het hele systeem (git repos, projecten, ~/.claude/, diskruimte) opschonen en standaardiseren conform de Command Center app als bron van waarheid.

**Standaard:** De Command Center app definieert wat een correct geregistreerd project is: registry_items, projects metadata, code intelligence, project memories.

---

## Context

Na de migratie van Shadow PC (Windows) naar Linux/WSL2 is een portability cleanup uitgevoerd. De volgende stap is een volledige systeemschoonmaak: git standaardisatie, project triage, CC-onboarding, ~/.claude/ opschoning, en diskruimte vrijmaken.

### Huidige Staat

**Git repos (14 in ~/projects/):**

- 8x `master` branch, 6x `main` — inconsistent
- 1 verouderde stash (command-center)
- 1 orphan directory zonder git (docs/)
- Alle repos clean en gepusht

**Projecten:**

- 5 actief in CC: command-center, veha-hub, veha-app, proceshuis-veha, proceshuis-hsf
- 2 actief maar niet volledig in CC: veha-website, veha-doc-generator
- 7 dormant/experimenteel: agent-os, bryntum-analysis, claude-config-shadow, design-os, prompt-library-mcp, v95-omega-prime, veha-design
- 1 archief: command-center-v2 in done/ (770MB)

**~/.claude/:**

- 112 geregistreerde items (79 commands, 20 agents, 6 instructions, 4 APIs, 2 skills, 1 prompt)
- 218 bestanden in agents/ (bloat)
- 1004 bestanden in plugins/ (15MB, meeste = official cache)
- 2 Windows-scripts in security-os (scheduled-scan.bat, setup-scheduler.ps1)
- Security OS config met verouderde branch namen

**Diskruimte:**

- ~/projects/ totaal: 4.0 GB
- node_modules: 3.3 GB (82% van totaal)
- Archief (done/command-center-v2): 770 MB

---

## Fase 1: Git Standaardisatie

### Branch Rename master → main

Alle 8 repos met `master` als default branch hernoemen naar `main`:

| Repo                 | Huidige branch |
| -------------------- | -------------- |
| bryntum-analysis     | master         |
| claude-config-shadow | master         |
| command-center       | master         |
| prompt-library-mcp   | master         |
| v95-omega-prime      | master         |
| veha-app             | master         |
| veha-hub             | master         |
| veha-website         | master         |

Per repo:

1. `git branch -m master main`
2. `git push origin main`
3. `gh repo edit --default-branch main`
4. `git push origin --delete master`
5. `git branch -u origin/main main`

### Stash Opruimen

- `command-center`: `git stash drop` (verouderd WIP op commit 66c7368)

### Security OS Config Updaten

- `security-os.json` → `default_branches`: alle entries naar `main`, verouderde projecten verwijderen

---

## Fase 2: Project Triage & Archivering

### Actieve Projecten (blijven in ~/projects/)

| Project            | Reden                                  |
| ------------------ | -------------------------------------- |
| command-center     | Production CC dashboard, Vercel deploy |
| veha-hub           | Production SSO/RBAC, Vercel deploy     |
| veha-app           | Production VEHA dashboard              |
| proceshuis-veha    | Production proceshuis                  |
| proceshuis-hsf     | Production proceshuis                  |
| veha-website       | VEHA bedrijfswebsite                   |
| veha-doc-generator | VEHA document generator                |

### Archiveren (naar ~/projects/done/)

| Project              | Reden                                          |
| -------------------- | ---------------------------------------------- |
| agent-os             | Spec-driven dev framework, geen actief gebruik |
| bryntum-analysis     | Analyse-tool, afgerond                         |
| claude-config-shadow | Oude Windows config backup, vervangen          |
| design-os            | Product design planner, dormant                |
| prompt-library-mcp   | Experimenteel, 1 commit                        |
| v95-omega-prime      | Onbekend systeem, dormant                      |
| veha-design          | Design OS voor VEHA, vervangen door veha-app   |

### Verwijderen

| Item                              | Reden                                                    |
| --------------------------------- | -------------------------------------------------------- |
| ~/projects/docs/                  | Orphan directory zonder git, geen waarde                 |
| ~/projects/done/command-center-v2 | Backup beschikbaar op GitHub (command-center-v1-archive) |

---

## Fase 3: Actieve Projecten Onboarden in CC

Per actief project dat nog niet volledig in CC staat:

1. **`/connect-project`** — Scan .claude/ folder, registreer assets in registry_items
2. **`/onboard`** — Detect en vul metadata:
   - tech_stack (uit package.json dependencies)
   - build_command, dev_command, test_command (uit package.json scripts)
   - languages (uit tsconfig, file extensions)
   - live_url (Vercel URL indien beschikbaar)
   - repo_url (git remote URL)
3. **`analyze_project`** — Code intelligence via cc-v2-mcp (TypeScript projecten)
4. **Ontbrekende docs** genereren:
   - STATUS.md (indien ontbreekt)
   - LOGBOEK.md (indien ontbreekt)
   - BOOM.md (indien ontbreekt)
   - .claude/project-guardian.md (indien ontbreekt)

### Status per project

| Project            | In CC?   | Ontbrekende docs    |
| ------------------ | -------- | ------------------- |
| command-center     | Ja       | Geen                |
| veha-hub           | Ja       | Geen                |
| veha-app           | Ja       | LOGBOEK.md, BOOM.md |
| proceshuis-veha    | Ja       | Geen                |
| proceshuis-hsf     | Ja       | Geen                |
| veha-website       | Onbekend | Alles               |
| veha-doc-generator | Onbekend | Alles               |

---

## Fase 4: ~/.claude/ Opschonen

### Windows-scripts Vervangen

| Bestand                                                 | Actie                                               |
| ------------------------------------------------------- | --------------------------------------------------- |
| `plugins/local/security-os/scripts/scheduled-scan.bat`  | Vervang door `scheduled-scan.sh` (bash equivalent)  |
| `plugins/local/security-os/scripts/setup-scheduler.ps1` | Vervang door `setup-scheduler.sh` (bash equivalent) |

### Security OS Config

- Verwijder verouderde projecten uit `default_branches` (gantt-dashboard, design-os1, design-os-template)
- Verwijder dubbele entries
- Update alle branch namen naar `main`

### Registry Audit

- Check elk van de 112 geregistreerde items of het bestand nog bestaat op het opgegeven pad
- Verwijder entries die naar niet-bestaande bestanden verwijzen
- Verwijder entries van gearchiveerde projecten

### Agents Map Opschonen

- 218 bestanden in agents/ beoordelen
- Agents van gearchiveerde projecten verwijderen
- Duplicaten of verouderde agents verwijderen

### Plugin Cache Trimmen

- Verwijder oude versies van officieel gepubliceerde plugins
- Behoud alleen de laatst gebruikte versie per plugin

---

## Fase 5: Diskruimte Vrijmaken

### Vooraf: node_modules verwijderen bij te archiveren projecten

Voordat projecten naar done/ verplaatst worden, node_modules verwijderen:

- agent-os, bryntum-analysis, claude-config-shadow, design-os, prompt-library-mcp, v95-omega-prime, veha-design

### Archief opschonen

- `~/projects/done/command-center-v2` volledig verwijderen (770MB)

### Actieve projecten

- node_modules van niet-actief-gebouwde projecten opruimen (herstelbaar via `npm ci`)

### Verwachte besparing

| Actie                         | Besparing       |
| ----------------------------- | --------------- |
| Archief node_modules          | ~500-800 MB     |
| command-center-v2 verwijderen | ~770 MB         |
| Plugin cache trim             | ~5-10 MB        |
| **Totaal**                    | **~1.3-1.6 GB** |

---

## Fase 6: Verificatie

Na afronding van alle fases:

1. **Git:** Alle actieve repos op `main`, clean, gepusht
2. **Projecten:** Alleen actieve projecten in ~/projects/, rest in done/
3. **CC Dashboard:** Alle actieve projecten zichtbaar met correcte metadata
4. **Registry:** `/sync-cc` draait succesvol, geen broken referenties
5. **~/.claude/:** Geen Windows-scripts, geen verouderde configs, opgeschoonde registry
6. **Disk:** Minimaal 1.3 GB vrijgemaakt

---

## Volgorde van Uitvoering

```
Fase 1 (Git) → Fase 2 (Triage) → Fase 3 (Onboarding) → Fase 4 (~/.claude/) → Fase 5 (Disk) → Fase 6 (Verificatie)
```

Fase 1 moet eerst omdat branch renames de basis leggen.
Fase 2 moet voor Fase 3 omdat we eerst moeten weten welke projecten actief zijn.
Fase 4 en 5 kunnen parallel maar worden sequentieel uitgevoerd voor controle.
