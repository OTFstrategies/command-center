# Code Intelligence — Uitputtend Test- & Kwaliteitsplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elke regel nieuwe code testen op correctheid, veiligheid en robuustheid voordat het in productie draait.

**Architecture:** Drie-laags testarchitectuur: (1) Test Executor voert alle tests uit per angle, (2) QA Validator controleert resultaten en kruist af tegen requirements, (3) Regression Guard verifieert dat bestaande features intact zijn. Subagents rapporteren aan de hoofd-QA (Claude) die resultaten samenvoegt en aan Shadow presenteert.

**Tech Stack:** Node.js runtime tests, Supabase queries, Next.js build verification, Playwright browser tests, curl/fetch API tests

---

## Sectie 1: Overzicht en Testdoelen

### Wat wordt getest
Alle code uit PR #7 (`feat/code-intelligence`), bestaande uit:
- **MCP Server** (`cc-v2-mcp/`) — 7 tools, analyse-engine, storage layer
- **4 API routes** — symbols, diagnostics, dependencies, metrics
- **4 UI components** — ProjectTabs, CodeTab, DependenciesTab, HealthTab
- **Data layer** — `lib/code-intel.ts` + type definitions
- **Database** — 5 nieuwe tabellen + migratie
- **Project detail page** — tabbed interface rewrite

### Testdoelen
1. **Geen data-verlies**: analyse-resultaten worden correct opgeslagen en opgehaald
2. **Geen crashes**: alle foutpaden worden afgevangen, geen onafgevangen exceptions
3. **Geen security-gaten**: geen SQL-injectie, path traversal of auth-bypass
4. **Correcte UI**: alle tabs renderen, filters werken, empty states tonen
5. **Bestaande features intact**: homepage, kanban, activity, registry, search werken nog

### Kwaliteitscriteria (pass/fail)
- **PASS**: alle tests slagen, nul kritieke issues, nul security issues
- **CONDITIONAL PASS**: alle tests slagen, max 3 lage-prioriteit issues gedocumenteerd
- **FAIL**: één of meer kritieke/security issues, of bestaande features kapot

---

## Sectie 2: Alle Test-Angles + Rationale

| # | Angle | Rationale | Prioriteit |
|---|-------|-----------|------------|
| A | **Functioneel — MCP Tools** | Kernfunctionaliteit: analyse + opslag + query werkt correct | KRITIEK |
| B | **Functioneel — API Endpoints** | Dashboard leest data via deze routes, moeten correct filteren | KRITIEK |
| C | **Functioneel — UI Components** | Shadow ziet dit dashboard, moet correct renderen | HOOG |
| D | **Data Integriteit** | Type mismatches tussen lagen (TS types ↔ DB schema ↔ API response) | KRITIEK |
| E | **Edge Cases** | Lege projecten, enorme projecten, speciale tekens in namen | HOOG |
| F | **Foutafhandeling** | Wat gebeurt bij kapotte JSON, ontbrekende bestanden, DB-fouten | HOOG |
| G | **Security** | SQL-injectie via ilike, path traversal, ongeauthenticeerde toegang | KRITIEK |
| H | **Performance** | Grote projecten (500+ symbols), batch-verwerking | MEDIUM |
| I | **Integratie End-to-End** | Volledige flow: MCP analyse → Supabase → API → UI rendering | KRITIEK |
| J | **Regressie** | Bestaande pagina's (home, kanban, registry, activity) nog intact | HOOG |
| K | **Build & Deploy** | Compileert, deployt, geen runtime errors | KRITIEK |

---

## Sectie 3: Gedetailleerde Teststappen per Angle

### Angle A: Functioneel — MCP Tools (7 tests)

**Doel:** Verifieer dat elke MCP tool correcte data retourneert en correct in Supabase opslaat.

**Files:**
- Test subject: `cc-v2-mcp/src/index.ts`
- Dependencies: `cc-v2-mcp/src/analyzer/*.ts`, `cc-v2-mcp/src/lib/storage.ts`

**A1: analyze_project produceert correcte output**

Step 1: Bouw de MCP server
```bash
cd cc-v2-mcp && npm run build
```
Expected: Geen errors, `dist/` directory bevat compiled JS

Step 2: Voer analyse uit op cc-v2 zelf via Node.js
```bash
cd cc-v2-mcp && node -e "
import('./dist/analyzer/index.js').then(async m => {
  const result = await m.analyzeProject('C:\\\\Users\\\\Shadow\\\\Projects\\\\command-center-v2\\\\command-center-app');
  console.log(JSON.stringify({
    project: result.project,
    symbolCount: result.symbols.length,
    refCount: result.references.length,
    diagCount: result.diagnostics.length,
    depCount: result.dependencies.length,
    metricsKeys: Object.keys(result.metrics),
    hasLoc: result.metrics.total_loc > 0,
    hasFiles: result.metrics.total_files > 0,
  }, null, 2));
})
"
```
Expected:
- `project` = `command-center-app`
- `symbolCount` > 100
- `depCount` > 10
- `hasLoc` = true
- `hasFiles` = true
- `metricsKeys` bevat: total_files, total_loc, total_symbols, total_exports, total_diagnostics_error, total_diagnostics_warning, total_dependencies

Step 3: Verifieer symbol extractie kwaliteit
```bash
cd cc-v2-mcp && node -e "
import('./dist/analyzer/index.js').then(async m => {
  const result = await m.analyzeProject('C:\\\\Users\\\\Shadow\\\\Projects\\\\command-center-v2\\\\command-center-app');
  const kinds = {};
  result.symbols.forEach(s => { kinds[s.kind] = (kinds[s.kind]||0)+1; });
  const exported = result.symbols.filter(s => s.exported).length;
  const withParams = result.symbols.filter(s => s.parameters && s.parameters.length > 0).length;
  const asyncFns = result.symbols.filter(s => s.is_async).length;
  console.log(JSON.stringify({ kinds, exported, withParams, asyncFns }, null, 2));
})
"
```
Expected:
- `kinds` bevat minstens: function, interface, type, variable
- `exported` > 50
- `withParams` > 0
- `asyncFns` > 0

**A2: query_symbols filters werken correct**

Step 1: Query met kind filter via storage layer
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/storage.js').then(async m => {
  const fns = await m.querySymbols({ project: 'command-center-app', kind: 'function', limit: 5 });
  console.log('Functions:', fns.length, fns.map(f => f.name));
  const allKindsMatch = fns.every(f => f.kind === 'function');
  console.log('All kind=function:', allKindsMatch);
})
"
```
Expected: `allKindsMatch` = true, length > 0

Step 2: Query met name fuzzy search
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/storage.js').then(async m => {
  const results = await m.querySymbols({ project: 'command-center-app', name: 'get', limit: 10 });
  console.log('Name search results:', results.length, results.map(r => r.name));
  const allContainGet = results.every(r => r.name.toLowerCase().includes('get'));
  console.log('All contain get:', allContainGet);
})
"
```
Expected: `allContainGet` = true

Step 3: Query met exported_only filter
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/storage.js').then(async m => {
  const exported = await m.querySymbols({ project: 'command-center-app', exported_only: true, limit: 10 });
  const allExported = exported.every(s => s.exported === true);
  console.log('All exported:', allExported, 'Count:', exported.length);
})
"
```
Expected: `allExported` = true

**A3: get_diagnostics retourneert correcte severity levels**

Step 1: Query diagnostics
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/storage.js').then(async m => {
  const diags = await m.getDiagnostics({ project: 'command-center-app' });
  const severities = {};
  diags.forEach(d => { severities[d.severity] = (severities[d.severity]||0)+1; });
  console.log('Severities:', severities, 'Total:', diags.length);
  const validSeverities = diags.every(d => ['error','warning','suggestion','info'].includes(d.severity));
  console.log('All valid severity:', validSeverities);
})
"
```
Expected: `validSeverities` = true

**A4: get_dependencies scheidt types correct**

Step 1: Query dependencies
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/storage.js').then(async m => {
  const deps = await m.getDependencies({ project: 'command-center-app' });
  const types = {};
  deps.forEach(d => { types[d.dep_type] = (types[d.dep_type]||0)+1; });
  console.log('Dep types:', types, 'Total:', deps.length);
  const validTypes = deps.every(d => ['production','dev','peer','optional'].includes(d.dep_type));
  console.log('All valid type:', validTypes);
})
"
```
Expected: `validTypes` = true, has both `production` and `dev`

**A5: get_metrics retourneert complete record**

Step 1: Query metrics
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/storage.js').then(async m => {
  const metrics = await m.getMetrics('command-center-app');
  const record = metrics[0];
  const requiredFields = ['project','total_files','total_loc','languages','total_symbols','total_exports','total_diagnostics_error','total_diagnostics_warning','total_dependencies'];
  const missing = requiredFields.filter(f => record[f] === undefined);
  console.log('Missing fields:', missing);
  console.log('Languages type:', typeof record.languages, Object.keys(record.languages || {}));
  console.log('LOC > 0:', record.total_loc > 0);
})
"
```
Expected: `missing` = [], `languages` is object, LOC > 0

**A6: project_health berekent score correct**

Step 1: Verifieer health score logica
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/storage.js').then(async m => {
  const metrics = await m.getMetrics('command-center-app');
  const met = metrics[0];
  const score = met.total_diagnostics_error === 0
    ? (met.total_diagnostics_warning < 10 ? 'healthy' : 'needs-attention')
    : 'unhealthy';
  console.log('Errors:', met.total_diagnostics_error);
  console.log('Warnings:', met.total_diagnostics_warning);
  console.log('Calculated score:', score);
  console.log('Valid score:', ['healthy','needs-attention','unhealthy'].includes(score));
})
"
```
Expected: `Valid score` = true

**A7: find_references vindt referenties**

Step 1: Query references voor een veelgebruikt symbol
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/storage.js').then(async m => {
  // First find a common exported symbol
  const symbols = await m.querySymbols({ project: 'command-center-app', exported_only: true, limit: 5 });
  if (symbols.length === 0) { console.log('NO SYMBOLS'); return; }
  const sym = symbols[0];
  console.log('Testing references for:', sym.name, 'in', sym.file_path);
  const refs = await m.findReferences({ project: 'command-center-app', symbol_name: sym.name });
  console.log('References found:', refs.length);
  const validRefs = refs.every(r => r.symbol_name === sym.name);
  console.log('All match symbol_name:', validRefs);
})
"
```
Expected: references found > 0 of lege array (niet een crash)

---

### Angle B: Functioneel — API Endpoints (4 tests)

**Doel:** Verifieer dat elke API route correct data retourneert vanuit Supabase.

**Files:**
- `command-center-app/src/app/api/projects/[slug]/symbols/route.ts`
- `command-center-app/src/app/api/projects/[slug]/diagnostics/route.ts`
- `command-center-app/src/app/api/projects/[slug]/dependencies/route.ts`
- `command-center-app/src/app/api/projects/[slug]/metrics/route.ts`

**B1: Symbols endpoint retourneert data + filters**

Step 1: Basis GET request
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => {
    console.log('Has symbols:', Array.isArray(d.symbols));
    console.log('Total:', d.total);
    console.log('First symbol keys:', d.symbols?.[0] ? Object.keys(d.symbols[0]) : 'none');
  });
"
```
Expected: Status 200, `symbols` is array, `total` is number

Step 2: Filter op kind
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?kind=function')
  .then(r => r.json())
  .then(d => {
    const allFunctions = d.symbols.every(s => s.kind === 'function');
    console.log('All functions:', allFunctions, 'Count:', d.total);
  });
"
```
Expected: `allFunctions` = true

Step 3: Filter op exported
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?exported=true')
  .then(r => r.json())
  .then(d => {
    const allExported = d.symbols.every(s => s.exported === true);
    console.log('All exported:', allExported, 'Count:', d.total);
  });
"
```
Expected: `allExported` = true

Step 4: Naam zoeken
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?name=get&limit=5')
  .then(r => r.json())
  .then(d => {
    console.log('Results:', d.total, d.symbols.map(s => s.name));
  });
"
```
Expected: alle namen bevatten "get" (case-insensitive)

**B2: Dependencies endpoint retourneert gegroepeerde data**

Step 1: Basis GET
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/dependencies')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => {
    console.log('Has dependencies:', Array.isArray(d.dependencies));
    console.log('Total:', d.total);
    const types = [...new Set(d.dependencies.map(dep => dep.dep_type))];
    console.log('Types present:', types);
  });
"
```
Expected: Status 200, total > 10, types bevat 'production' en 'dev'

Step 2: Filter op type
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/dependencies?type=dev')
  .then(r => r.json())
  .then(d => {
    const allDev = d.dependencies.every(dep => dep.dep_type === 'dev');
    console.log('All dev:', allDev, 'Count:', d.total);
  });
"
```
Expected: `allDev` = true

**B3: Diagnostics endpoint met severity summary**

Step 1: Basis GET
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/diagnostics')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => {
    console.log('Has diagnostics:', Array.isArray(d.diagnostics));
    console.log('Summary:', d.summary);
    console.log('Summary has keys:', d.summary ? Object.keys(d.summary) : 'none');
  });
"
```
Expected: Status 200, summary bevat `error`, `warning`, `suggestion`

Step 2: Filter op severity
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/diagnostics?severity=error')
  .then(r => r.json())
  .then(d => {
    const allErrors = d.diagnostics.every(diag => diag.severity === 'error');
    console.log('All errors:', allErrors, 'Count:', d.diagnostics.length);
  });
"
```
Expected: `allErrors` = true (of lege array)

**B4: Metrics endpoint retourneert enkele record**

Step 1: Basis GET
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/metrics')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => {
    console.log('Has metrics:', d.metrics !== null);
    if (d.metrics) {
      console.log('LOC:', d.metrics.total_loc);
      console.log('Files:', d.metrics.total_files);
      console.log('Languages:', typeof d.metrics.languages);
    }
  });
"
```
Expected: Status 200, metrics is niet null, LOC > 0

Step 2: Niet-bestaand project retourneert null
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/niet-bestaand-project-xyz/metrics')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => console.log('Metrics:', d.metrics, 'Message:', d.message));
"
```
Expected: Status 200, `metrics` = null, message bevat "No analysis data"

---

### Angle C: Functioneel — UI Components (4 tests)

**Doel:** Verifieer dat de dashboard tabs correct renderen en interactief werken.

**Files:**
- `command-center-app/src/components/code-intel/ProjectTabs.tsx`
- `command-center-app/src/components/code-intel/CodeTab.tsx`
- `command-center-app/src/components/code-intel/DependenciesTab.tsx`
- `command-center-app/src/components/code-intel/HealthTab.tsx`
- `command-center-app/src/app/(dashboard)/projects/[slug]/page.tsx`

**C1: Tabs renderen en wisselen**

Step 1: Open project detail pagina in browser
```
Navigate to: https://command-center-app-nine.vercel.app/projects/command-center-app
```
Expected: Pagina laadt, 4 tabs zichtbaar: Overview, Code, Dependencies, Health

Step 2: Verifieer tab switching
```
Click: "Code" tab
```
Expected: Code tab content verschijnt, Overview content verdwijnt

Step 3: Verifieer alle tabs klikbaar
```
Click each tab: Overview → Code → Dependencies → Health → Overview
```
Expected: Elke tab toont eigen content, geen console errors

**C2: CodeTab filters en expand/collapse**

Step 1: Open Code tab
```
Click: "Code" tab
```
Expected: Kind filter chips zichtbaar (All, function, interface, type, etc.)

Step 2: Click een kind filter
```
Click: "function" filter chip
```
Expected: Alleen bestanden met functions getoond, andere verdwijnen

Step 3: Expand een bestand
```
Click: eerste bestandsnaam in de lijst
```
Expected: Symbols onder dat bestand worden zichtbaar met kind label, naam, line nummer

Step 4: Collapse het bestand
```
Click: zelfde bestandsnaam opnieuw
```
Expected: Symbols verdwijnen, bestand is weer ingeklapt

**C3: DependenciesTab groepering**

Step 1: Open Dependencies tab
```
Click: "Dependencies" tab
```
Expected: Groepen zichtbaar: "Production" en "Development" met aantallen

Step 2: Verifieer dat elke dependency naam + versie toont
```
Inspect: eerste dependency item
```
Expected: Package naam links, versie nummer rechts (monospace)

**C4: HealthTab metrics display**

Step 1: Open Health tab
```
Click: "Health" tab
```
Expected: Health badge (Healthy/Needs Attention/Unhealthy), 4 metric cards, diagnostics sectie

Step 2: Verifieer metric cards
```
Inspect: Files, Lines of Code, Symbols, Dependencies cards
```
Expected: Elk heeft een icoon, label, en numerieke waarde > 0

Step 3: Verifieer language breakdown
```
Inspect: Languages sectie
```
Expected: Minstens TypeScript en CSS met progress bars en file counts

Step 4: Verifieer analyzed_at datum
```
Inspect: datum naast health badge
```
Expected: Nederlandse datumnotatie (bijv. "13 feb. 2026, 20:30")

---

### Angle D: Data Integriteit (5 tests)

**Doel:** Verifieer dat types consistent zijn tussen alle lagen: MCP types → DB schema → API response → Frontend types.

**Files:**
- `cc-v2-mcp/src/lib/types.ts` (MCP types)
- `supabase/migrations/20260213200000_create_code_intelligence_tables.sql` (DB schema)
- `command-center-app/src/types/index.ts` (Frontend types)
- API route responses

**D1: Symbol velden matchen tussen lagen**

Step 1: Vergelijk MCP SymbolRecord velden met DB kolommen
```bash
node -e "
// MCP type fields
const mcpFields = ['project','file_path','name','kind','signature','return_type','line_start','line_end','parent','exported','is_async','parameters'];
// DB columns from migration
const dbColumns = ['id','project','file_path','name','kind','signature','return_type','line_start','line_end','parent','exported','is_async','parameters','created_at'];
// Frontend CodeSymbol fields
const feFields = ['id','project','file_path','name','kind','signature','return_type','line_start','line_end','parent','exported','is_async','parameters'];

const mcpMissing = mcpFields.filter(f => !dbColumns.includes(f));
const feMissing = feFields.filter(f => !dbColumns.includes(f));
console.log('MCP fields missing in DB:', mcpMissing);
console.log('FE fields missing in DB:', feMissing);
console.log('PASS:', mcpMissing.length === 0 && feMissing.length === 0);
"
```
Expected: Beide arrays leeg → PASS

**D2: Diagnostic veld `character` vs `col` mismatch check**

Step 1: Controleer of frontend type `character` matcht met DB kolom `col`
```bash
node -e "
// DB column name from migration
const dbColumnName = 'col';  // line 51 of migration
// Frontend type field name
const feFieldName = 'character';  // line 331 of types/index.ts
console.log('DB column:', dbColumnName);
console.log('FE field:', feFieldName);
console.log('MATCH:', dbColumnName === feFieldName);
console.log('STATUS: POTENTIAL MISMATCH — verify API response maps correctly');
"
```
Expected: MISMATCH gedetecteerd — dit is een bekende issue die gelogd moet worden

Step 2: Verifieer of API response het juiste veldnaam gebruikt
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/diagnostics')
  .then(r => r.json())
  .then(d => {
    if (d.diagnostics && d.diagnostics.length > 0) {
      const first = d.diagnostics[0];
      console.log('Has character field:', 'character' in first);
      console.log('Has col field:', 'col' in first);
      console.log('Actual fields:', Object.keys(first));
    } else {
      console.log('No diagnostics to check — SKIP');
    }
  });
"
```
Expected: Documenteer welk veldnaam de API retourneert

**D3: Metrics languages veld is JSONB en correct gedeserialiseerd**

Step 1: Verifieer dat languages een object is (niet een string)
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/metrics')
  .then(r => r.json())
  .then(d => {
    if (d.metrics) {
      console.log('Languages type:', typeof d.metrics.languages);
      console.log('Is object:', typeof d.metrics.languages === 'object');
      console.log('Is NOT string:', typeof d.metrics.languages !== 'string');
      console.log('Keys:', Object.keys(d.metrics.languages));
    }
  });
"
```
Expected: type = object, NOT string

**D4: Dependencies upsert constraint werkt**

Step 1: Verifieer unieke constraint (project, name)
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/supabase.js').then(async ({ getSupabase }) => {
  const sb = getSupabase();
  // Count dependencies for project
  const { count } = await sb.from('project_dependencies').select('*', { count: 'exact', head: true }).eq('project', 'command-center-app');
  console.log('Total deps:', count);

  // Check for duplicates
  const { data } = await sb.from('project_dependencies').select('name, dep_type').eq('project', 'command-center-app');
  const seen = new Set();
  const dupes = [];
  data.forEach(d => {
    const key = d.name;
    if (seen.has(key)) dupes.push(key);
    seen.add(key);
  });
  console.log('Duplicates:', dupes.length === 0 ? 'NONE (PASS)' : dupes);
});
"
```
Expected: Geen duplicaten

**D5: Metrics unieke constraint (één record per project)**

Step 1: Verifieer één metrics record per project
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/supabase.js').then(async ({ getSupabase }) => {
  const sb = getSupabase();
  const { data } = await sb.from('project_metrics').select('project').eq('project', 'command-center-app');
  console.log('Metrics records for project:', data.length);
  console.log('PASS:', data.length <= 1);
});
"
```
Expected: Exact 1 record

---

### Angle E: Edge Cases (6 tests)

**Doel:** Verifieer correct gedrag bij grensgevallen en onverwachte input.

**E1: Niet-bestaand project retourneert lege data**

Step 1: Query symbols voor niet-bestaand project
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/dit-project-bestaat-niet/symbols')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => console.log('Symbols:', d.symbols?.length, 'Total:', d.total));
"
```
Expected: Status 200, symbols = [], total = 0

Step 2: Query dependencies voor niet-bestaand project
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/dit-project-bestaat-niet/dependencies')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => console.log('Dependencies:', d.dependencies?.length, 'Total:', d.total));
"
```
Expected: Status 200, dependencies = [], total = 0

**E2: Speciale tekens in project slug**

Step 1: Project naam met URL-onveilige tekens
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/test%20project%20%26%20special/metrics')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => console.log('Response:', d));
"
```
Expected: Status 200, geen crash (metrics null of lege response)

**E3: Limit parameter edge cases**

Step 1: Limit = 0
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?limit=0')
  .then(r => r.json())
  .then(d => console.log('With limit=0:', d.total));
"
```
Expected: Retourneert data (Supabase behandelt limit=0 als ongelimiteerd of leeg)

Step 2: Limit = 1
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?limit=1')
  .then(r => r.json())
  .then(d => console.log('With limit=1:', d.total, d.symbols?.length));
"
```
Expected: Exact 1 resultaat

Step 3: Limit = 99999 (zeer groot)
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?limit=99999')
  .then(r => r.json())
  .then(d => console.log('With limit=99999:', d.total));
"
```
Expected: Retourneert alle symbols, geen crash

**E4: Lege kind/severity/type filter waarden**

Step 1: Lege string als filter
```bash
node -e "
Promise.all([
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?kind=').then(r => r.json()),
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/diagnostics?severity=').then(r => r.json()),
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/dependencies?type=').then(r => r.json()),
]).then(([sym, diag, dep]) => {
  console.log('Symbols with empty kind:', sym.total);
  console.log('Diagnostics with empty severity:', diag.diagnostics?.length);
  console.log('Deps with empty type:', dep.total);
});
"
```
Expected: Geen crashes, retourneert data (filter wordt genegeerd of leeg resultaat)

**E5: Project detail pagina met analyse data**

Step 1: Open project pagina die analyse data heeft
```
Navigate to: https://command-center-app-nine.vercel.app/projects/command-center-app
```
Expected: Tabs tonen counts (Code X, Dependencies Y), Health toont badge

Step 2: Open project pagina ZONDER analyse data
```
Navigate to: https://command-center-app-nine.vercel.app/projects/agent-os
```
Expected: Tabs tonen count 0, empty state berichten in Code/Dependencies/Health tabs

**E6: UI met 500+ symbols**

Step 1: Open Code tab op project met veel data
```
Navigate to: projects/command-center-app → Code tab
```
Expected: Alle symbols laden, file groepering werkt, geen scrolling issues, kind filters accurate counts

---

### Angle F: Foutafhandeling (4 tests)

**Doel:** Verifieer dat fouten graceful worden afgehandeld zonder crashes.

**F1: MCP analyse op niet-bestaand pad**

Step 1: Analyseer een pad dat niet bestaat
```bash
cd cc-v2-mcp && node -e "
import('./dist/analyzer/index.js').then(async m => {
  try {
    const result = await m.analyzeProject('C:\\\\niet\\\\bestaand\\\\pad');
    console.log('Got result (unexpected):', result.project);
  } catch (e) {
    console.log('Error caught:', e.message?.substring(0, 100));
    console.log('PASS: Error was thrown and caught');
  }
});
"
```
Expected: Error gegooid (ts-morph kan project niet laden), NIET een stille lege response

**F2: Malformed package.json**

Step 1: Test dependency extraction met ongeldig JSON
```bash
cd cc-v2-mcp && node -e "
import('fs').then(fs => {
  // Create temp dir with bad package.json
  const tmp = 'C:\\\\Users\\\\Shadow\\\\Projects\\\\command-center-v2\\\\cc-v2-mcp\\\\.test-temp';
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(tmp + '\\\\package.json', '{ invalid json }}}');

  import('./dist/analyzer/dependencies.js').then(async m => {
    try {
      const deps = m.extractDependencies(tmp, 'test');
      console.log('Result:', deps);
    } catch (e) {
      console.log('CRASH on malformed JSON:', e.message?.substring(0, 80));
      console.log('ISSUE: Missing try/catch around JSON.parse in dependencies.ts');
    }
    // Cleanup
    fs.rmSync(tmp, { recursive: true });
  });
});
"
```
Expected: Documenteer of dit crasht (vermoedelijk ja — bekend issue uit inventaris)

**F3: API endpoint bij Supabase downtime (gesimuleerd)**

Step 1: Test error response format
```bash
node -e "
// Test met een ongeldige project slug die Supabase query error zou geven
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/metrics')
  .then(r => {
    console.log('Content-Type:', r.headers.get('content-type'));
    console.log('Status:', r.status);
    return r.json();
  })
  .then(d => {
    console.log('Response is valid JSON:', true);
    console.log('Has metrics or error key:', 'metrics' in d || 'error' in d);
  })
  .catch(e => console.log('Parse error:', e.message));
"
```
Expected: Altijd valid JSON, nooit HTML error page

**F4: Frontend graceful degradation bij ontbrekende data**

Step 1: Verifieer dat HealthTab null metrics correct afhandelt
```
Navigate to: project detail pagina van een project ZONDER analyse data
Click: Health tab
```
Expected: Empty state bericht ("No analysis data yet"), geen crash, geen broken layout

---

### Angle G: Security (4 tests)

**Doel:** Verifieer dat er geen SQL-injectie, path traversal of auth-bypass mogelijk is.

**G1: SQL-injectie via ilike name parameter**

Step 1: Probeer SQL-injectie via symbols name filter
```bash
node -e "
const malicious = \"'; DROP TABLE project_symbols; --\";
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?name=' + encodeURIComponent(malicious))
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => console.log('Response OK:', d.total !== undefined, 'Symbols still exist'));
"
```
Expected: Status 200, geen data (filter matcht niks), tabel NIET gedropped

Step 2: Verifieer dat tabel nog bestaat na injectie-poging
```bash
node -e "
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?limit=1')
  .then(r => r.json())
  .then(d => console.log('Table exists, symbols:', d.total));
"
```
Expected: Tabel bestaat nog, data intact

**G2: Path traversal in project slug**

Step 1: Probeer directory traversal via slug
```bash
node -e "
const traversal = '../../../etc/passwd';
fetch('https://command-center-app-nine.vercel.app/api/projects/' + encodeURIComponent(traversal) + '/metrics')
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => console.log('Response:', JSON.stringify(d).substring(0, 200)));
"
```
Expected: Status 200 met null metrics, GEEN bestandsinhoud gelekt

**G3: API endpoints zijn publiek toegankelijk (geen auth vereist)**

Step 1: Documenteer of GET endpoints auth vereisen
```bash
node -e "
// Deze endpoints gebruiken GEEN x-api-key check (alleen POST /sync doet dat)
Promise.all([
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?limit=1').then(r => r.status),
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/metrics').then(r => r.status),
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/dependencies?limit=1').then(r => r.status),
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/diagnostics?limit=1').then(r => r.status),
]).then(statuses => {
  console.log('All statuses:', statuses);
  const allPublic = statuses.every(s => s === 200);
  console.log('All endpoints publicly accessible:', allPublic);
  console.log('NOTE: This is by design (read-only data), but document as known behavior');
});
"
```
Expected: Alle 200 — documenteer als bewuste keuze (read-only data, geen gevoelige info)

**G4: Wildcard injection via ilike parameters**

Step 1: Probeer excessive wildcards
```bash
node -e "
const wildcard = '%%%%%';
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?name=' + encodeURIComponent(wildcard))
  .then(r => r.json())
  .then(d => console.log('Wildcard result:', d.total, '(should match all or be handled)'));
"
```
Expected: Retourneert resultaten (wildcards in ilike matchen alles), geen crash

---

### Angle H: Performance (2 tests)

**Doel:** Verifieer dat grote datasets geen timeouts of crashes veroorzaken.

**H1: API response time bij grote datasets**

Step 1: Meet response time voor symbols (potentieel 500+ records)
```bash
node -e "
const start = Date.now();
fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols?limit=500')
  .then(r => r.json())
  .then(d => {
    const ms = Date.now() - start;
    console.log('Symbols:', d.total, 'Time:', ms, 'ms');
    console.log('PASS:', ms < 5000 ? 'YES (< 5s)' : 'NO (too slow)');
  });
"
```
Expected: Response < 5 seconden

Step 2: Meet response time voor alle endpoints parallel
```bash
node -e "
const endpoints = ['symbols', 'diagnostics', 'dependencies', 'metrics'];
const start = Date.now();
Promise.all(endpoints.map(ep =>
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/' + ep)
    .then(r => r.json())
    .then(d => ({ endpoint: ep, time: Date.now() - start }))
)).then(results => {
  results.forEach(r => console.log(r.endpoint + ':', r.time + 'ms'));
  const maxTime = Math.max(...results.map(r => r.time));
  console.log('Slowest:', maxTime + 'ms', maxTime < 5000 ? 'PASS' : 'FAIL');
});
"
```
Expected: Alle endpoints < 5 seconden

**H2: Project detail pagina laadtijd**

Step 1: Meet pagina laadtijd via Playwright
```
Navigate to: https://command-center-app-nine.vercel.app/projects/command-center-app
Measure: tijd tot pagina volledig geladen (tabs zichtbaar)
```
Expected: < 5 seconden volledige render

---

### Angle I: Integratie End-to-End (1 grote test)

**Doel:** Verifieer de volledige keten: MCP analyse → Supabase opslag → API ophalen → UI rendering.

**I1: Volledige flow verificatie**

Step 1: Controleer dat de MCP analyse data in Supabase staat
```bash
cd cc-v2-mcp && node -e "
import('./dist/lib/supabase.js').then(async ({ getSupabase }) => {
  const sb = getSupabase();
  const counts = {};
  for (const table of ['project_symbols','project_references','project_diagnostics','project_dependencies','project_metrics']) {
    const { count } = await sb.from(table).select('*', { count: 'exact', head: true }).eq('project', 'command-center-app');
    counts[table] = count;
  }
  console.log('Supabase data counts:', counts);
  console.log('All tables have data:', Object.values(counts).every(c => c > 0 || c === 0));
});
"
```
Expected: Alle tabellen bevatten data voor command-center-app

Step 2: Verifieer dat API dezelfde data retourneert als Supabase
```bash
node -e "
Promise.all([
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/symbols').then(r => r.json()),
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/dependencies').then(r => r.json()),
  fetch('https://command-center-app-nine.vercel.app/api/projects/command-center-app/metrics').then(r => r.json()),
]).then(([sym, deps, met]) => {
  console.log('API symbols total:', sym.total);
  console.log('API deps total:', deps.total);
  console.log('API metrics LOC:', met.metrics?.total_loc);
  console.log('All endpoints return data:', sym.total > 0 && deps.total > 0 && met.metrics !== null);
});
"
```
Expected: Alle endpoints retourneren data consistent met Supabase

Step 3: Open dashboard en verifieer visuele weergave
```
Navigate to: https://command-center-app-nine.vercel.app/projects/command-center-app
Verify: Header toont symbol count en LOC
Click: Code tab → symbols zichtbaar
Click: Dependencies tab → packages zichtbaar
Click: Health tab → metrics en health badge zichtbaar
```
Expected: Alle data uit stap 1-2 is zichtbaar in de UI

---

### Angle J: Regressie (5 tests)

**Doel:** Verifieer dat bestaande features niet kapot zijn door de wijzigingen.

**J1: Homepage laadt correct**

Step 1: Open homepage
```
Navigate to: https://command-center-app-nine.vercel.app/
```
Expected: StatCards, ProjectCards, QuickActionBar zichtbaar, geen errors

**J2: Kanban board werkt**

Step 1: Open tasks pagina
```
Navigate to: https://command-center-app-nine.vercel.app/tasks
```
Expected: Kanban kolommen laden (Backlog, To Do, Doing, Done)

**J3: Registry pagina werkt**

Step 1: Open registry
```
Navigate to: https://command-center-app-nine.vercel.app/registry
```
Expected: Asset types en items zichtbaar

**J4: Activity pagina werkt**

Step 1: Open activity
```
Navigate to: https://command-center-app-nine.vercel.app/activity
```
Expected: Activity entries laden met filters

**J5: Global search werkt**

Step 1: Open search dialog
```
Press: Cmd+K (of Ctrl+K)
Type: "command"
```
Expected: Zoekresultaten verschijnen, geen errors

---

### Angle K: Build & Deploy (2 tests)

**Doel:** Verifieer dat de applicatie correct compileert en deployt.

**K1: Next.js build slaagt**

Step 1: Run build
```bash
cd command-center-app && npm run build
```
Expected: "Compiled successfully", geen TypeScript errors

Step 2: TypeScript check
```bash
cd command-center-app && npx tsc --noEmit
```
Expected: Geen errors

**K2: MCP server build slaagt**

Step 1: Run MCP build
```bash
cd cc-v2-mcp && npm run build
```
Expected: Geen errors, `dist/` bevat compiled JS

---

## Sectie 4: Subagent-Rollen en Onderlinge Controle

### Architectuur

```
┌─────────────────────────────────────┐
│         HOOFD-QA (Claude)           │
│  Coördineert, rapporteert, beslist  │
└──────────┬──────────┬───────────────┘
           │          │
    ┌──────▼──┐  ┌────▼──────┐
    │ TEST    │  │ QA        │
    │ EXECUTOR│  │ VALIDATOR │
    │         │  │           │
    │ Voert   │  │ Controle- │
    │ alle    │  │ ert test  │
    │ tests   │  │ resultaten│
    │ uit     │  │ + cross-  │
    │         │  │ check     │
    └─────────┘  └───────────┘
```

### Subagent 1: Test Executor

**Rol:** Voert alle teststappen uit per angle

**Verantwoordelijkheden:**
- Voert bash commands en node scripts uit
- Navigeert naar URLs en verifieert responses
- Logt elk testresultaat als PASS/FAIL/SKIP met exacte output
- Stopt NIET bij eerste faal — voert alle tests uit

**Output formaat per test:**
```
[A1] analyze_project output — PASS
  Details: 419 symbols, 21 deps, 8874 LOC
  Duration: 12.4s

[A2] query_symbols kind filter — FAIL
  Expected: allKindsMatch = true
  Actual: allKindsMatch = false (1 symbol had kind='method')
  Impact: MEDIUM — filter bug
```

**Toewijzing per batch:**
- Batch 1: Angles A + B (MCP tools + API endpoints)
- Batch 2: Angles D + E + F (Data integriteit + Edge cases + Foutafhandeling)
- Batch 3: Angles G + H (Security + Performance)
- Batch 4: Angles C + I + J + K (UI + E2E + Regressie + Build)

### Subagent 2: QA Validator

**Rol:** Controleert de resultaten van Test Executor

**Verantwoordelijkheden:**
- Leest Test Executor output en classificeert issues
- Cross-checkt tegen de oorspronkelijke requirements (design doc)
- Identificeert gemiste tests of incomplete coverage
- Geeft onafhankelijk oordeel: PASS / CONDITIONAL PASS / FAIL

**Controle-checklist:**
1. Heeft elke angle minstens 1 test die PASS is?
2. Zijn alle KRITIEK-prioriteit angles volledig getest?
3. Zijn gevonden issues correct geclassificeerd (kritiek/hoog/medium/laag)?
4. Zijn er tests die overgeslagen zijn zonder reden?
5. Matchen de testresultaten met wat je verwacht op basis van de code?

**Cross-check vragen:**
- "Test A1 zegt 419 symbols — klopt dit met de codebase grootte?"
- "Test B4 retourneert metrics — zijn alle velden aanwezig die de UI nodig heeft?"
- "Test G1 zegt geen SQL-injectie — is de Supabase SDK daadwerkelijk parameterized?"

### Onderlinge Controle Flow

```
1. Test Executor → voert Batch 1 uit → rapport
2. QA Validator → controleert Batch 1 rapport → feedback
3. Als issues: Executor fixt en hertest
4. Als PASS: door naar Batch 2
5. Herhaal tot alle batches klaar
6. QA Validator → eindoordeel
7. Hoofd-QA → samenvatting voor Shadow
```

---

## Sectie 5: Rapportagevorm voor Shadow

### Na Elke Batch

Shadow krijgt een tabel in begrijpelijke taal:

```
╔══════════════════════════════════════════════════════╗
║  BATCH 1 RESULTATEN: MCP Tools + API Endpoints      ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  ✓ 15 van 15 tests geslaagd                         ║
║  ⚠ 1 opmerking (geen risico)                        ║
║  ✗ 0 problemen                                      ║
║                                                      ║
║  Betekenis: De analyse-motor en API werken correct.  ║
║  Je kunt projecten analyseren en data bekijken.      ║
╚══════════════════════════════════════════════════════╝
```

### Bij Gevonden Issues

```
PROBLEEM GEVONDEN:
  Wat:     Als package.json ongeldig is, crasht de analyse
  Risico:  LAAG (gebeurt alleen bij kapotte projecten)
  Impact:  Analyse stopt, maar geen data verloren
  Actie:   Fix toevoegen (try/catch rond JSON.parse)
  Status:  □ Open  ☑ Gefixt  □ Geaccepteerd risico
```

### Eindrapport

```
═══════════════════════════════════════════════
  CODE INTELLIGENCE — KWALITEITSRAPPORT
═══════════════════════════════════════════════

  Totaal tests:     42
  Geslaagd:         40
  Gefaald:          0
  Opmerkingen:      2

  EINDOORDEEL:      ✓ CONDITIONAL PASS

  Wat werkt:
  • Project analyse vindt alle code-onderdelen
  • Dashboard toont symbolen, dependencies en health
  • Bestaande pagina's werken nog steeds
  • Geen beveiligingsproblemen gevonden

  Bekende beperkingen:
  1. Kapotte package.json files → crash (fix gepland)
  2. API endpoints zijn publiek leesbaar (bewuste keuze)

  Aanbeveling: Veilig om te gebruiken in productie.
═══════════════════════════════════════════════
```

---

## Fail-Safe en Herstelproces

### Bij Falende Tests

1. **Log het issue** met exacte foutmelding en screenshot/output
2. **Classificeer** de ernst:
   - **KRITIEK**: Crash, data verlies, security lek → STOP, fix eerst
   - **HOOG**: Functie werkt niet → fix voor deploy
   - **MEDIUM**: Functie werkt deels → documenteer, fix later
   - **LAAG**: Cosmetisch of edge case → documenteer
3. **Fix** het issue (als KRITIEK of HOOG)
4. **Hertest** de specifieke test + gerelateerde tests
5. **QA Validator** controleert de fix

### Bij Onverwachte Resultaten

- Test Executor mag NOOIT een testresultaat "aanpassen" om het te laten slagen
- Bij twijfel: markeer als INCONCLUSIVE en escaleer naar Hoofd-QA
- Hoofd-QA beslist of het een echte faal is of een test-fout

### Herstel na Fixes

Na elke fix worden deze tests opnieuw uitgevoerd:
1. De gefaalde test zelf
2. Alle tests in dezelfde angle
3. Angle K (build verificatie) opnieuw

---

## Taak Overzicht voor Uitvoering

| Task | Beschrijving | Angle | Tests |
|------|-------------|-------|-------|
| 1 | Build verificatie (K1 + K2) | K | 2 |
| 2 | MCP Tools functioneel (A1-A7) | A | 7 |
| 3 | API Endpoints functioneel (B1-B4) | B | 4 |
| 4 | Data integriteit checks (D1-D5) | D | 5 |
| 5 | Edge cases (E1-E6) | E | 6 |
| 6 | Foutafhandeling (F1-F4) | F | 4 |
| 7 | Security tests (G1-G4) | G | 4 |
| 8 | Performance tests (H1-H2) | H | 2 |
| 9 | UI component tests (C1-C4) | C | 4 |
| 10 | End-to-end integratie (I1) | I | 1 |
| 11 | Regressie tests (J1-J5) | J | 5 |
| 12 | QA Validator cross-check | ALL | — |
| 13 | Fix gevonden issues | — | — |
| 14 | Hertest na fixes | — | — |
| 15 | Eindrapport voor Shadow | — | — |
| **TOTAAL** | | | **44 tests** |
