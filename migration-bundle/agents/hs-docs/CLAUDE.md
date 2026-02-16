# H&S Document Platform

Volledig autonoom kwaliteitssysteem voor Heusschen & Schrouff operationele documenten.

---

## Systeem Overzicht

Dit platform genereert, valideert en beheert H&S documenten (L4 procedures en L5 werkinstructies)
met een 7-fase pipeline, 3 specialistische engines, en een zelf-lerende kennisbank.

### Kerncomponenten

| Component | Locatie | Functie |
|-----------|---------|---------|
| Pipeline Agents | `Agents/Up2date versions/` | 6 fase-agents (intake, optimalisatie, generatie) |
| Validator | `Agents/Up2date versions/Validator/` | 18 regelmodules, progressieve 5-staps validatie |
| DOCX Converter | `Agents/Up2date versions/DOCX Converter/` | JSON naar Word conversie (L4, L5, FO templates) |
| Codebook | `Kennisbank/codebook/` | 16 JSON categorieen + 15 engine modules |
| CLI | `scripts/generate-docx.js` | Command-line interface met 15+ flags |
| Templates | `templates/` | HTML/CSS productie-templates |

### Engines

| Engine | Module | Functie |
|--------|--------|---------|
| GlossaryEngine | `Kennisbank/codebook/lib/glossary-engine.js` | Terminologie conflictdetectie (Levenshtein) |
| SchrijverEngine | `Kennisbank/codebook/lib/schrijver-engine.js` | Schrijfstijl handhaving (4 checks + score) |
| IFSEngine | `Kennisbank/codebook/lib/ifs-engine.js` | IFS compliance scoring + gap analysis |

### Flow Modules

| Module | Functie |
|--------|---------|
| `Kennisbank/codebook/lib/auto-fixer.js` | Automatische reparatie (--fix) |
| `Kennisbank/codebook/lib/codebook-check.js` | Kennisbank gereedheidscheck |
| `Kennisbank/codebook/lib/approval-preview.js` | Dry-run preview (--dry-run) |
| `Agents/Up2date versions/Validator/progressive-validator.js` | 5-staps progressieve validatie (--stages) |

---

## 7-Fase Document Pipeline

```
Fase 0a: Extractie (parallel)
  extractors/txt-extractor/     -> Tekst extractie
  extractors/docx-extractor/    -> Word extractie
  extractors/hs-scanner/        -> H&S domeinverrijking
  extractors/combiner/          -> Data combinatie + aannames
      |
Fase 0b: Intake (conversationeel)
  l4-intake/ of l5-intake/      -> Gestructureerde intake
      |
Fase 1: Optimalisatie
  l4-optimize/ of l5-optimize/  -> 6-staps kwaliteitscheck
      |
Fase 2: Generatie
  l4-generate/ of l5-generate/  -> MD/HTML/Pre-DOCX output
      |
Fase 3: Validatie
  Agents/.../Validator/         -> 18 regelmodules + progressieve validatie
      |
Fase 4: Conversie
  Agents/.../DOCX Converter/    -> Word document generatie
      |
Fase 5: Goedkeuring
  scripts/generate-docx.js --approve  -> Codebook extractie (9 categorieen)
```

---

## CLI Commando's

Gebruik vanuit de project root:

```bash
# Document generatie
node scripts/generate-docx.js l4 input.json output.docx
node scripts/generate-docx.js l5 input.json output.docx
node scripts/generate-docx.js fo input.json output.docx

# Validatie
node scripts/generate-docx.js l5 input.json --validate-only
node scripts/generate-docx.js l5 input.json output.docx --validate
node scripts/generate-docx.js l5 input.json --stages

# Auto-reparatie
node scripts/generate-docx.js l5 input.json output.docx --fix

# Goedkeuring + kennisbank
node scripts/generate-docx.js l5 input.json output.docx --approve
node scripts/generate-docx.js l5 input.json --approve --dry-run

# Engines (standalone)
node scripts/generate-docx.js --glossary-check
node scripts/generate-docx.js --style-check l5 input.json
node scripts/generate-docx.js --ifs-check input.json

# Kennisbank
node scripts/generate-docx.js --sync
```

---

## Slash Commands

| Command | Beschrijving |
|---------|-------------|
| `/hs-docs` | Hoofdmenu -- kies L4 of L5 |
| `/hs-l4` | Complete L4 procedure flow |
| `/hs-l5` | Complete L5 werkinstructie flow |
| `/hs-extract` | Losse extractie fase |
| `/hs-scan` | Losse H&S scanning fase |
| `/hs-combine` | Losse data combinatie fase |

---

## Agent Definities

Elke subfolder bevat een CLAUDE.md met instructies voor die specifieke agent:

| Agent | Map | Fase |
|-------|-----|------|
| TXT Extractor | `extractors/txt-extractor/` | 0a |
| DOCX Extractor | `extractors/docx-extractor/` | 0a |
| H&S Scanner | `extractors/hs-scanner/` | 0a |
| Combiner | `extractors/combiner/` | 0a |
| L4 Intake | `l4-intake/` | 0b |
| L5 Intake | `l5-intake/` | 0b |
| L4 Optimizer | `l4-optimize/` | 1 |
| L5 Optimizer | `l5-optimize/` | 1 |
| L4 Generator | `l4-generate/` | 2 |
| L5 Generator | `l5-generate/` | 2 |
| Validator | `validate/` | 3 |
| Converter | `convert/` | 4 |

---

## Kennisbank

### Codebook (16 categorieen)
Locatie: `Kennisbank/codebook/`

Termen, afkortingen, actiewerkwoorden, veiligheidszinnen, materialen, locaties,
requirements, stijlregels, resources, procedures, changelog, standaardzinnen,
IFS/HSF requirements, IFS tools/templates, IFS doctrine.

### H&S Geleerde Kennis
Locatie: `knowledge/hs-learned.json`

Afkortingen, veiligheidstriggers, filterpatronen, standaard veiligheid,
afdelingen, locaties.

---

## Development

### Tests draaien

```bash
# Alle tests (1019+)
npx jest --no-coverage

# Per module
cd "Kennisbank/codebook" && npx jest --no-coverage        # 432 tests
cd "Agents/Up2date versions/Validator" && npx jest --no-coverage  # 275 tests
cd "Agents/Up2date versions/DOCX Converter" && npx jest --no-coverage  # 269 tests
npx jest scripts/__tests__/ --no-coverage                  # 43 tests
```

### Dependencies

```bash
npm install
```

### Git

```bash
git remote -v   # origin: OTFstrategies/project-style-agents
```

---

## Bronbestanden

| Type | Locatie |
|------|---------|
| Agent system prompts | `Agents/Up2date versions/*/system_prompt.md` |
| Agent schemas | `Agents/Up2date versions/*/schema_input.json` |
| Stijlanalyse | `Kennisbank/stijlanalyse/` |
| Python tools | `tools/read_docx.py`, `tools/update-knowledge.py` |
| Template voorbeelden | `templates/examples/` |
| H&S huisstijl | `templates/styles.json` |
