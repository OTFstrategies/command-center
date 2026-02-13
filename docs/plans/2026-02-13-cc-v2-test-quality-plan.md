# CC v2 — Test & Kwaliteitsplan (Serena-vervanger)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Uitputtend testen van alle zojuist toegevoegde functies (memories API, project metadata, UI, commands) en bestaande functionaliteit, inclusief security hardening voor gevonden kwetsbaarheden.

**Architecture:** Drie-fasen aanpak: (1) Fix kritieke security issues eerst, (2) Test alle API endpoints en UI met Playwright + curl, (3) Regressietest bestaande features. Subagent-architectuur met executor + validator voor dubbele controle.

**Tech Stack:** curl (API tests), Playwright (UI tests), Next.js build check, TypeScript type check

---

## Sectie 1: Overzicht en Testdoelen

### Waarom dit plan?

Er zijn 10 bestanden toegevoegd/gewijzigd met ~1300 regels nieuwe code. De code-analyse heeft **1 kritieke security bug**, **3 betrouwbaarheidsproblemen**, en **5 UX-verbeterpunten** ontdekt. Dit plan test alles en fixt de kritieke issues.

### Testdoelen

| # | Doel | Prioriteit |
|---|------|-----------|
| 1 | Geen security kwetsbaarheden in productie | P0 KRITIEK |
| 2 | Alle API endpoints retourneren correcte responses | P0 |
| 3 | UI toont memories en project info correct | P1 |
| 4 | Foutafhandeling werkt bij ongeldige input | P1 |
| 5 | Bestaande features (sync, kanban, search) blijven werken | P1 |
| 6 | Edge cases veroorzaken geen crashes | P2 |
| 7 | Performance is acceptabel (< 3s response) | P2 |

### Wat wordt getest?

| Component | Bestanden | Test Methode |
|-----------|-----------|--------------|
| Memories API (CRUD) | `api/projects/[slug]/memories/route.ts`, `[name]/route.ts` | curl + Playwright |
| Project Metadata API | `api/projects/[slug]/route.ts` | curl |
| MemoryList UI | `components/memories/MemoryList.tsx` | Playwright screenshot |
| Project Info UI | `projects/[slug]/page.tsx` | Playwright screenshot |
| Server-side queries | `lib/projects.ts` | Indirect via API tests |
| Claude Code commands | `~/.claude/commands/memory.md`, `onboard.md` | Manuele verificatie |
| Bestaande features | Sync, kanban, search, activity | Regressie via Playwright |

---

## Sectie 2: Test-Angles en Rationale

### Angle A: Security (KRITIEK)

**Rationale:** De code-analyse heeft SQL-injectie kwetsbaarheden ontdekt in de `.or()` Supabase filters. Dit is de #1 prioriteit omdat het data-lekken naar externe aanvallers mogelijk maakt.

**Scope:**
- A.1: SQL-injectie via project slug in memories GET
- A.2: SQL-injectie via project slug in memories POST
- A.3: SQL-injectie via memory name in single GET
- A.4: SQL-injectie via memory name in DELETE
- A.5: SQL-injectie via project name in `getProjectByName` (ILIKE)
- A.6: Authenticatie bypass (ontbrekende/foute API key)
- A.7: SYNC_API_KEY niet geconfigureerd op server

### Angle B: Functioneel — Memories CRUD

**Rationale:** Kern-functionaliteit die Serena memories vervangt. Moet foutloos werken.

**Scope:**
- B.1: Maak een nieuwe memory (POST)
- B.2: Lees alle memories voor een project (GET lijst)
- B.3: Lees een specifieke memory (GET single)
- B.4: Update een bestaande memory (POST met zelfde naam)
- B.5: Verwijder een memory (DELETE)
- B.6: Activity log entry aangemaakt na write/delete
- B.7: Upsert werkt correct (geen race conditions)

### Angle C: Functioneel — Project Metadata

**Rationale:** Vervangt Serena onboarding. Moet correcte data accepteren en opslaan.

**Scope:**
- C.1: Lees project metadata (GET)
- C.2: Update project metadata — enkel veld (PATCH)
- C.3: Update project metadata — meerdere velden (PATCH)
- C.4: Afgewezen velden worden genegeerd (PATCH met `id`, `created_at`)
- C.5: Activity log entry aangemaakt na update

### Angle D: Edge Cases en Foutafhandeling

**Rationale:** Productie-code moet graceful omgaan met foute input.

**Scope:**
- D.1: POST memory zonder `name` veld
- D.2: POST memory zonder `content` veld
- D.3: POST memory met lege JSON body
- D.4: POST memory met ongeldige JSON
- D.5: PATCH project zonder geldige velden
- D.6: PATCH project met fout type (tech_stack als string)
- D.7: GET memory met ongeldige URL-encoding in naam
- D.8: Memories voor niet-bestaand project (lege lijst, geen crash)
- D.9: DELETE memory die niet bestaat
- D.10: Extreem lange memory content (100KB+)

### Angle E: UI / Visueel

**Rationale:** Shadow beoordeelt visueel. Alles moet er correct uitzien.

**Scope:**
- E.1: Project detail pagina toont memories sectie
- E.2: MemoryList rendert memory cards correct
- E.3: Relative time ("2d ago") toont correct
- E.4: Project Info sectie toont tech_stack badges
- E.5: Project Info sectie toont commands in monospace
- E.6: Project Info sectie toont URLs als klikbare links
- E.7: Lege project info verbergt de sectie
- E.8: Dark mode rendering correct

### Angle F: Integratie (End-to-End)

**Rationale:** De volledige keten (CLI → API → DB → UI) moet werken.

**Scope:**
- F.1: Memory schrijven via curl → zichtbaar op dashboard
- F.2: Memory updaten via curl → update zichtbaar op dashboard
- F.3: Memory verwijderen via curl → verdwijnt van dashboard
- F.4: Project metadata updaten via curl → zichtbaar op dashboard
- F.5: Sync pipeline werkt nog (regressie)

### Angle G: Regressie

**Rationale:** Nieuwe code mag bestaande features niet breken.

**Scope:**
- G.1: Homepage laadt correct (stat cards, project cards)
- G.2: Registry pagina toont alle assets
- G.3: Kanban board werkt (drag-drop)
- G.4: Search dialog werkt
- G.5: Activity pagina toont logs
- G.6: Settings pagina laadt
- G.7: Build slaagt zonder errors
- G.8: TypeScript type check slaagt

---

## Sectie 3: Gedetailleerde Teststappen

### PRE-REQUISITE: Fix Kritieke Security Issues

Voordat we testen, moeten de SQL-injectie kwetsbaarheden gefixt worden. Anders falen de security tests by design.

---

### Task 1: Fix SQL-injectie in `.or()` filters

**Files:**
- Modify: `command-center-app/src/app/api/projects/[slug]/memories/route.ts`
- Modify: `command-center-app/src/app/api/projects/[slug]/memories/[name]/route.ts`
- Modify: `command-center-app/src/lib/projects.ts`

**Step 1: Fix memories collection route (GET + POST)**

In `api/projects/[slug]/memories/route.ts`, vervang alle `.or()` calls met `.in()`:

```typescript
// VOOR (kwetsbaar):
.or(`project.eq.${project},project.eq.${slug}`)

// NA (veilig):
.in('project', [project, slug])
```

**Step 2: Fix single memory route (GET + DELETE)**

In `api/projects/[slug]/memories/[name]/route.ts`, zelfde fix:

```typescript
// VOOR:
.or(`project.eq.${project},project.eq.${slug}`)

// NA:
.in('project', [project, slug])
```

**Step 3: Fix lib/projects.ts (getProjectMemories + getProjectByName)**

In `lib/projects.ts`:

```typescript
// getProjectMemories — VOOR:
.or(`project.eq.${projectName},project.eq.${slug}`)
// NA:
.in('project', [projectName, slug])

// getProjectByName — VOOR:
.or(`slug.eq.${slug},name.ilike.${projectName}`)
// NA (twee aparte queries, of gebruik .in() voor slug):
const { data: projectData } = await client
  .from('projects')
  .select('*')
  .or(`slug.eq.${slug},name.eq.${projectName}`)
// Of veiliger met .in():
.in('slug', [slug])
// Gevolgd door fallback check op name
```

**Step 4: Voeg URL-decoding error handling toe**

In `api/projects/[slug]/memories/[name]/route.ts`, beide handlers:

```typescript
let memoryName: string
try {
  memoryName = decodeURIComponent(name)
} catch {
  return NextResponse.json(
    { error: 'Invalid URL encoding in memory name' },
    { status: 400 }
  )
}
```

**Step 5: Voeg SYNC_API_KEY existence check toe**

In alle POST/PATCH/DELETE handlers:

```typescript
const apiKey = request.headers.get('x-api-key')
const expectedKey = process.env.SYNC_API_KEY
if (!expectedKey) {
  return NextResponse.json(
    { error: 'SYNC_API_KEY not configured on server' },
    { status: 500 }
  )
}
if (apiKey !== expectedKey) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Step 6: Vervang check-then-insert door upsert in POST memories**

```typescript
// VOOR: check existing → update of insert (race condition)
// NA: upsert met ON CONFLICT
const { data, error } = await supabase
  .from('project_memories')
  .upsert(
    { project, name, content, updated_at: new Date().toISOString() },
    { onConflict: 'project,name' }
  )
  .select()
  .single()
```

**Step 7: Voeg type-validatie toe aan PATCH /projects/[slug]**

```typescript
// Na het filteren van allowed fields:
if ('tech_stack' in updates && !Array.isArray(updates.tech_stack)) {
  return NextResponse.json({ error: 'tech_stack must be an array' }, { status: 400 })
}
if ('languages' in updates && !Array.isArray(updates.languages)) {
  return NextResponse.json({ error: 'languages must be an array' }, { status: 400 })
}
for (const urlField of ['live_url', 'repo_url']) {
  if (urlField in updates && updates[urlField] !== null && typeof updates[urlField] !== 'string') {
    return NextResponse.json({ error: `${urlField} must be a string` }, { status: 400 })
  }
}
```

**Step 8: Verifieer build**

```bash
cd command-center-app && npx tsc --noEmit && npm run build
```

**Step 9: Commit**

```bash
git add command-center-app/src/
git commit -m "security: fix SQL injection in .or() filters + harden API validation"
```

---

### Task 2: Deploy naar Vercel (preview)

**Step 1: Push branch**

```bash
git push origin feat/sync-pipeline
```

**Step 2: Wacht op Vercel preview deployment**

Vercel bouwt automatisch een preview URL.

**Step 3: Haal preview URL op**

```bash
vercel ls --scope otf-strategies 2>&1 | head -5
```

Of gebruik de production URL als er geen preview is:
`https://command-center-app-nine.vercel.app`

---

### Task 3: Security Tests (Angle A)

**Doel:** Verifieer dat alle security fixes werken.

**Step 1: Test A.1 — SQL-injectie poging via GET memories**

```bash
# Probeer SQL-injectie via slug
curl -s "https://command-center-app-nine.vercel.app/api/projects/test'%20OR%201=1--/memories"
```

**Verwacht:** `{"memories":[]}` (lege array, NIET alle memories van alle projecten)

**Step 2: Test A.2 — SQL-injectie poging via POST memories**

```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/test'%20OR%201=1--/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"name":"injection-test","content":"test"}'
```

**Verwacht:** Succes response (memory aangemaakt voor het letterlijke project "test' OR 1=1--"), OF error. NIET: data van andere projecten.

**Step 3: Test A.3 — Authenticatie bypass**

```bash
# Zonder API key
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/global/memories" \
  -H "Content-Type: application/json" \
  -d '{"name":"hack","content":"unauthorized"}'
```

**Verwacht:** `{"error":"Unauthorized"}` met status 401.

**Step 4: Test A.4 — Foute API key**

```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/global/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key-here" \
  -d '{"name":"hack","content":"unauthorized"}'
```

**Verwacht:** `{"error":"Unauthorized"}` met status 401.

**Step 5: Test A.5 — DELETE zonder auth**

```bash
curl -s -X DELETE "https://command-center-app-nine.vercel.app/api/projects/global/memories/test" \
  -H "x-api-key: wrong"
```

**Verwacht:** `{"error":"Unauthorized"}` met status 401.

**Step 6: Test A.6 — PATCH zonder auth**

```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/projects/command-center-v2" \
  -H "Content-Type: application/json" \
  -d '{"description":"hacked"}'
```

**Verwacht:** `{"error":"Unauthorized"}` met status 401.

---

### Task 4: Memories CRUD Tests (Angle B)

**Doel:** Verifieer dat de volledige CRUD cyclus werkt.

**Step 1: Test B.1 — Maak een test memory**

```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"name":"test-quality-check","content":"# Test Memory\nDit is een test memory aangemaakt door het QA-plan.\n\nTimestamp: 2026-02-13"}'
```

**Verwacht:**
```json
{
  "success": true,
  "memory": { "id": "...", "name": "test-quality-check", ... },
  "action": "created"
}
```

**Step 2: Test B.2 — Lees alle memories**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories"
```

**Verwacht:** Array met minimaal 3 memories: `architecture`, `sync-system`, `test-quality-check`

**Step 3: Test B.3 — Lees specifieke memory**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/test-quality-check"
```

**Verwacht:** `{"memory":{"name":"test-quality-check","content":"# Test Memory\n...",...}}`

**Step 4: Test B.4 — Update bestaande memory**

```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"name":"test-quality-check","content":"# Updated Test Memory\nContent is bijgewerkt."}'
```

**Verwacht:** `{"success":true,"action":"updated",...}`

**Step 5: Test B.5 — Verifieer update**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/test-quality-check"
```

**Verwacht:** Content bevat "Updated Test Memory"

**Step 6: Test B.6 — Verwijder test memory**

```bash
curl -s -X DELETE "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/test-quality-check" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f"
```

**Verwacht:** `{"success":true}`

**Step 7: Test B.7 — Verifieer verwijdering**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/test-quality-check"
```

**Verwacht:** `{"error":"Memory not found"}` met status 404.

**Step 8: Test B.8 — Niet-bestaand memory ophalen**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/does-not-exist"
```

**Verwacht:** `{"error":"Memory not found"}` met status 404.

---

### Task 5: Project Metadata Tests (Angle C)

**Step 1: Test C.1 — Lees project metadata**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/projects/command-center-v2"
```

**Verwacht:** JSON met project data inclusief `tech_stack`, `build_command`, etc. (kunnen null zijn)

**Step 2: Test C.2 — Update enkel veld**

```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/projects/command-center-v2" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"tech_stack":["Next.js 14","Supabase","Tailwind CSS v4","Lucide React","@dnd-kit"]}'
```

**Verwacht:** `{"project":{...,"tech_stack":["Next.js 14","Supabase","Tailwind CSS v4","Lucide React","@dnd-kit"],...}}`

**Step 3: Test C.3 — Update meerdere velden**

```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/projects/command-center-v2" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"languages":["typescript"],"build_command":"npm run build","dev_command":"npm run dev","live_url":"https://command-center-app-nine.vercel.app"}'
```

**Verwacht:** Project object met alle bijgewerkte velden.

**Step 4: Test C.4 — Afgewezen velden**

```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/projects/command-center-v2" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"id":"hacked-id","created_at":"1970-01-01"}'
```

**Verwacht:** `{"error":"No valid fields to update"}` met status 400 (id en created_at zijn niet in de allowed list)

**Step 5: Test C.5 — Type validatie (na fix)**

```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/projects/command-center-v2" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"tech_stack":"not-an-array"}'
```

**Verwacht:** `{"error":"tech_stack must be an array"}` met status 400.

---

### Task 6: Edge Case Tests (Angle D)

**Step 1: Test D.1 — POST zonder name**

```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"content":"no name"}'
```

**Verwacht:** `{"error":"name and content required"}` met status 400.

**Step 2: Test D.2 — POST zonder content**

```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"name":"empty"}'
```

**Verwacht:** `{"error":"name and content required"}` met status 400.

**Step 3: Test D.3 — POST met lege body**

```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{}'
```

**Verwacht:** `{"error":"name and content required"}` met status 400.

**Step 4: Test D.4 — POST met ongeldige JSON**

```bash
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d 'this is not json'
```

**Verwacht:** Error response (400 of 500), GEEN crash.

**Step 5: Test D.5 — PATCH zonder geldige velden**

```bash
curl -s -X PATCH "https://command-center-app-nine.vercel.app/api/projects/command-center-v2" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"invalid_field":"test"}'
```

**Verwacht:** `{"error":"No valid fields to update"}` met status 400.

**Step 6: Test D.6 — Memories voor niet-bestaand project**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/projects/does-not-exist-project/memories"
```

**Verwacht:** `{"memories":[]}` (lege array, geen crash)

**Step 7: Test D.7 — Ongeldige URL-encoding (na fix)**

```bash
curl -s "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/%E0%A4%A"
```

**Verwacht:** `{"error":"Invalid URL encoding in memory name"}` met status 400 (na fix), OF 404/500 (voor fix).

---

### Task 7: UI Tests met Playwright (Angle E)

**Doel:** Verifieer dat de UI correct rendert met echte data.

**Step 1: Test E.1+E.2 — Project detail met memories**

```
1. Navigeer naar https://command-center-app-nine.vercel.app/projects/command-center-v2
2. Controleer: "Memories" sectie is zichtbaar
3. Controleer: Memory cards tonen "architecture" en "sync-system"
4. Neem screenshot
```

**Verwacht:** Memories sectie met twee cards, elk met naam, tijd, en content preview.

**Step 2: Test E.3 — Relative time**

```
1. Op dezelfde pagina, bekijk memory cards
2. Controleer: Elke card toont een relatieve tijd (bijv. "1d ago")
```

**Verwacht:** Tijd is realistisch (niet "0m ago" of "NaN").

**Step 3: Test E.4+E.5+E.6 — Project Info sectie (na metadata update)**

```
1. Na Task 5 (metadata update), herlaad projectpagina
2. Controleer: "Project Info" sectie is zichtbaar
3. Controleer: Tech stack badges (Next.js 14, Supabase, etc.)
4. Controleer: Commands in monospace (dev: npm run dev, build: npm run build)
5. Controleer: Live URL is een klikbare link
```

**Verwacht:** Alle metadata correct weergegeven met juiste styling.

**Step 4: Test E.7 — Lege project info verbergt sectie**

```
1. Navigeer naar een project ZONDER metadata (bijv. /projects/agent-os)
2. Controleer: "Project Info" sectie is NIET zichtbaar
```

**Verwacht:** Geen lege "Project Info" kaart.

**Step 5: Test E.8 — Dark mode**

```
1. Schakel naar dark mode
2. Herlaad project detail pagina
3. Controleer: Memories en Project Info sectie correct in dark mode
4. Neem screenshot
```

**Verwacht:** Leesbare tekst, juiste contrast, zinc palette.

---

### Task 8: End-to-End Integratie Tests (Angle F)

**Doel:** Test de volledige keten: schrijf via API → verifieer op dashboard.

**Step 1: Test F.1 — Memory schrijven en zien**

```bash
# 1. Schrijf memory
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"name":"e2e-test","content":"# E2E Test\nAangemaakt door het testplan."}'

# 2. Open Playwright, navigeer naar project pagina
# 3. Controleer: "e2e-test" memory is zichtbaar
# 4. Neem screenshot als bewijs
```

**Step 2: Test F.2 — Memory updaten en zien**

```bash
# 1. Update memory
curl -s -X POST "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"name":"e2e-test","content":"# E2E Test — UPDATED\nContent is bijgewerkt."}'

# 2. Herlaad pagina in Playwright
# 3. Controleer: content toont "UPDATED"
```

**Step 3: Test F.3 — Memory verwijderen en weg**

```bash
# 1. Verwijder memory
curl -s -X DELETE "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/e2e-test" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f"

# 2. Herlaad pagina in Playwright
# 3. Controleer: "e2e-test" is NIET meer zichtbaar
```

**Step 4: Test F.4 — Sync pipeline regressie**

```bash
SYNC_API_KEY="09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" node scripts/sync-registry.mjs
```

**Verwacht:** Alle 6 types succesvol gesynct, 102+ items.

---

### Task 9: Regressie Tests (Angle G)

**Doel:** Verifieer dat bestaande features niet gebroken zijn.

**Step 1: Test G.1 — Homepage**

```
1. Navigeer naar https://command-center-app-nine.vercel.app/
2. Controleer: Stat cards zichtbaar (agents, commands, etc.)
3. Controleer: Project cards zichtbaar
4. Neem screenshot
```

**Step 2: Test G.2 — Registry pagina**

```
1. Navigeer naar /registry
2. Controleer: Assets worden getoond (agents, commands, etc.)
```

**Step 3: Test G.3 — Kanban board**

```
1. Navigeer naar /tasks
2. Controleer: Kolommen zichtbaar (Backlog, To Do, Doing, Done)
3. Controleer: Taken zijn zichtbaar (indien aanwezig)
```

**Step 4: Test G.4 — Search dialog**

```
1. Klik op zoek-icoon of druk Ctrl+K
2. Type een zoekterm
3. Controleer: Resultaten verschijnen
```

**Step 5: Test G.5 — Activity pagina**

```
1. Navigeer naar /activity
2. Controleer: Activity entries zichtbaar
```

**Step 6: Test G.6 — Settings pagina**

```
1. Navigeer naar /settings
2. Controleer: Sync status en configuratie zichtbaar
```

**Step 7: Test G.7+G.8 — Build en TypeScript check**

```bash
cd command-center-app && npx tsc --noEmit && npm run build
```

**Verwacht:** Geen errors.

---

### Task 10: Opruimen en Rapporteren

**Step 1: Verwijder test data**

```bash
# Verwijder eventuele test memories
curl -s -X DELETE "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/e2e-test" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f"

curl -s -X DELETE "https://command-center-app-nine.vercel.app/api/projects/command-center-v2/memories/test-quality-check" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f"
```

**Step 2: Maak testrapport**

Vul de resultaten-tabel in sectie 5.

**Step 3: Commit alle fixes**

```bash
git add -A
git commit -m "test: complete QA cycle — security fixes + all tests passed"
```

---

## Sectie 4: Subagent-Rollen en Onderlinge Controle

### Subagent 1: Security Fixer (Task 1)

| Eigenschap | Waarde |
|------------|--------|
| **Naam** | `security-fixer` |
| **Type** | `Bash` agent |
| **Doel** | Fix alle SQL-injectie kwetsbaarheden en hardening |
| **Input** | Lijst van 6 bestanden met `.or()` kwetsbaarheden |
| **Output** | Gecommitte code, build-verificatie |
| **Tools** | Read, Edit, Bash (tsc, build) |
| **Succeskriterium** | Build slaagt, alle `.or()` met interpolatie zijn vervangen |

### Subagent 2: Test Executor (Tasks 3-9)

| Eigenschap | Waarde |
|------------|--------|
| **Naam** | `test-executor` |
| **Type** | `general-purpose` agent |
| **Doel** | Voer ALLE tests uit (curl + Playwright) |
| **Input** | Dit testplan, productie URL, API key |
| **Output** | Test resultaten per angle (PASS/FAIL + bewijs) |
| **Tools** | Bash (curl), Playwright (screenshots), Read |
| **Succeskriterium** | Alle tests uitgevoerd, resultaten gelogd |

### Subagent 3: QA Validator (Task 10)

| Eigenschap | Waarde |
|------------|--------|
| **Naam** | `qa-validator` |
| **Type** | `general-purpose` agent |
| **Doel** | Controleer testresultaten, cross-check tegen requirements |
| **Input** | Testresultaten van executor, origineel plan |
| **Output** | Gevalideerd rapport, issue-lijst |
| **Tools** | Read, Bash (curl voor steekproeven) |
| **Succeskriterium** | Alle claims geverifieerd, geen onopgeloste P0/P1 issues |

### Interactielogica

```
┌──────────────┐     fixes code     ┌──────────────┐
│   Security   │ ──────────────────→│   Deploy     │
│   Fixer      │                    │   (Vercel)   │
└──────────────┘                    └──────┬───────┘
                                           │ preview URL
                                           ▼
                                    ┌──────────────┐
                                    │    Test      │
                                    │   Executor   │
                                    └──────┬───────┘
                                           │ test results
                                           ▼
                                    ┌──────────────┐
                          steekproef│     QA       │
                          ◄─────── │   Validator  │
                                    └──────┬───────┘
                                           │ rapport
                                           ▼
                                    ┌──────────────┐
                                    │  Rapport aan │
                                    │   Shadow     │
                                    └──────────────┘
```

**Controle-mechanisme:**
1. Security Fixer commit code → Build MOET slagen anders: stop
2. Test Executor voert tests uit → Logt PASS/FAIL per test
3. QA Validator herhaalt 20% van de tests als steekproef
4. Als Validator een afwijking vindt → Test Executor moet test herhalen
5. Alleen als Validator akkoord: rapport wordt opgeleverd

### Fail-Safe en Herstel

| Situatie | Actie |
|----------|-------|
| Build faalt na security fix | Security Fixer herstelt, commit opnieuw |
| API test faalt | Log de input, output, en verwachting. Markeer als FAIL. |
| Playwright timeout | Herlaad pagina, probeer opnieuw (max 2x) |
| >3 tests falen in zelfde angle | STOP executor, escaleer naar QA Validator |
| QA Validator vindt afwijking | Executor herhaalt specifieke test |
| Kritieke security test faalt | STOP alles, fix eerst security, begin opnieuw |

---

## Sectie 5: Rapportageformaat

### Voor Shadow (begrijpelijke taal)

Na afloop krijg je een rapport in dit formaat:

---

**CC v2 Testrapport — [datum]**

### Samenvatting (stoplichtkleuren)

| Gebied | Status | Toelichting |
|--------|--------|------------|
| Veiligheid | GROEN/ORANJE/ROOD | Kan een buitenstaander bij je data? |
| Memories opslaan/lezen | GROEN/ORANJE/ROOD | Werkt het opslaan en terughalen van notities? |
| Project info | GROEN/ORANJE/ROOD | Worden tech stack en commands correct getoond? |
| Dashboard | GROEN/ORANJE/ROOD | Ziet alles er goed uit op het scherm? |
| Bestaande functies | GROEN/ORANJE/ROOD | Werkt alles wat eerder al werkte nog steeds? |

### Wat is er getest?

- **X** tests uitgevoerd in **Y** categorieën
- **Z** tests geslaagd, **W** gefaald
- Alle screenshots zijn opgeslagen als bewijs

### Gevonden problemen

| # | Wat | Ernst | Status |
|---|-----|-------|--------|
| 1 | [beschrijving in gewone taal] | Kritiek/Belangrijk/Klein | Gefixt/Open |

### Screenshots

| Test | Screenshot |
|------|-----------|
| Homepage | `test-homepage.png` |
| Memories | `test-memories.png` |
| Dark mode | `test-darkmode.png` |

### Conclusie

[1-3 zinnen: Is het veilig om te gebruiken? Wat is het risico? Aanbeveling.]

---

## Totaaloverzicht Tests

| Angle | Tests | Beschrijving |
|-------|-------|-------------|
| A: Security | 6 | SQL-injectie, auth bypass |
| B: Memories CRUD | 8 | Create, read, update, delete |
| C: Project Metadata | 5 | GET, PATCH, validatie |
| D: Edge Cases | 7 | Foute input, ongeldige data |
| E: UI/Visueel | 5 | Rendering, dark mode |
| F: Integratie E2E | 4 | Volledige keten API→UI |
| G: Regressie | 8 | Bestaande features |
| **Totaal** | **43** | |
