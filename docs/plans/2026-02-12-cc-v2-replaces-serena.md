# CC v2 Vervangt Serena — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Command Center v2 neemt alle Serena-functionaliteit over die relevant is voor Shadow als product owner. Na implementatie wordt Serena uitgeschakeld.

**Architecture:** CC v2 krijgt een project memories systeem (Supabase + API + UI), uitgebreide project metadata (tech stack, build commands, onboarding data), en een session tracking feature. Claude Code communiceert via API met CC v2 in plaats van Serena's MCP tools.

**Tech Stack:** Next.js 14, Supabase (bestaand), Tailwind v4 (zinc palette), Lucide React

---

## Wat Serena doet vs CC v2 status

### Al gedekt door Claude Code native (GEEN CC v2 werk nodig)

| Serena Tool | Claude Code Equivalent | Status |
|---|---|---|
| `read_file` | Read tool | Native |
| `list_dir` | Glob, LS | Native |
| `find_file` | Glob | Native |
| `find_symbol` | Grep + typescript-lsp plugin | Native |
| `find_referencing_symbols` | Grep + typescript-lsp plugin | Native |
| `search_for_pattern` | Grep | Native |
| `create_text_file` | Write tool | Native |
| `replace_content` | Edit tool | Native |
| `replace_symbol_body` | Edit tool | Native |
| `insert_after_symbol` | Edit tool | Native |
| `insert_before_symbol` | Edit tool | Native |
| `rename_symbol` | Edit + Grep (manual) | Native |
| `delete_lines` | Edit tool | Native |
| `execute_shell_command` | Bash tool | Native |
| `think_about_*` | Claude-intern (geen tool nodig) | N/A |
| `switch_modes` | Commands/skills in Claude Code | N/A |

### Al gedekt door CC v2 (BESTAAT)

| Serena Feature | CC v2 Equivalent | Status |
|---|---|---|
| `open_dashboard` | CC v2 web app | Klaar |
| `activate_project` | ProjectSwitcher dropdown | Klaar |
| `get_current_config` | Settings page + sync status | Klaar |
| Project listing | Homepage project cards | Klaar |
| Activity tracking | Activity page + activity_log | Klaar |

### MOET GEBOUWD in CC v2 (de gap)

| Serena Feature | Wat CC v2 nodig heeft | Prioriteit |
|---|---|---|
| `write_memory` / `read_memory` | **Project Memories** — CRUD API + UI per project | P1 |
| `list_memories` / `delete_memory` | Onderdeel van memories feature | P1 |
| `edit_memory` | Onderdeel van memories feature | P1 |
| `onboarding` (auto-detect structuur) | **Project Onboarding** — tech stack, commands, key files per project | P2 |
| `prepare_for_new_conversation` | **Session Tracking** — session summaries per project | P3 |
| `summarize_changes` | Onderdeel van session tracking | P3 |

---

## Bestaande Database Structuur (relevant)

### `projects` tabel (huidig)
```sql
id UUID PK
name TEXT
slug TEXT UNIQUE
description TEXT
updated_at TIMESTAMP
```

### `types/index.ts` — Note interface (bestaat al, niet gebouwd)
```typescript
interface Note {
  id: string
  title: string
  content: string
  position: Position  -- canvas-gerelateerd, niet nodig voor memories
  size: Size          -- canvas-gerelateerd, niet nodig voor memories
  project: string
  connections: string[]
  created: string
  updated: string
}
```

> Note: Het bestaande Note type is voor een canvas-feature. Memories zijn simpeler: markdown documenten per project.

---

## Task 1: Supabase tabel `project_memories`

**Doel:** Database tabel voor project memories die Serena's `.serena/memories/` vervangt.

**Files:**
- Create: SQL migration (via Supabase dashboard of CLI)

**Step 1: Maak de tabel**

```sql
CREATE TABLE project_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project, name)
);

-- Index voor snelle lookups
CREATE INDEX idx_project_memories_project ON project_memories(project);

-- RLS uitschakelen (we gebruiken service role key)
ALTER TABLE project_memories ENABLE ROW LEVEL SECURITY;
```

**Step 2: Verifieer tabel**

```bash
curl -s "https://ikpmlhmbooaxfrlpzcfa.supabase.co/rest/v1/project_memories?select=*&limit=1" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>"
```

Expected: Lege array `[]` (tabel bestaat, geen data)

**Step 3: Commit**

Geen git commit nodig — dit is een database migratie.

---

## Task 2: API routes voor memories CRUD

**Doel:** REST API endpoints waarmee Claude Code en de UI memories kunnen lezen/schrijven.

**Files:**
- Create: `command-center-app/src/app/api/projects/[slug]/memories/route.ts`
- Create: `command-center-app/src/app/api/projects/[slug]/memories/[name]/route.ts`

**Step 1: Maak de collection route**

`app/api/projects/[slug]/memories/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

interface Props {
  params: Promise<{ slug: string }>
}

// GET /api/projects/[slug]/memories — List all memories for project
export async function GET(_request: NextRequest, { params }: Props) {
  const { slug } = await params
  const project = slug.replace(/-/g, ' ')

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('project_memories')
      .select('id, project, name, content, created_at, updated_at')
      .or(`project.eq.${project},project.eq.${slug}`)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ memories: data || [] })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[slug]/memories — Create or update a memory
export async function POST(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, content } = await request.json()
    if (!name || !content) {
      return NextResponse.json(
        { error: 'name and content required' },
        { status: 400 }
      )
    }

    const project = slug.replace(/-/g, ' ')
    const supabase = getSupabase()

    // Upsert: update if exists, insert if not
    const { data: existing } = await supabase
      .from('project_memories')
      .select('id')
      .eq('project', project)
      .eq('name', name)
      .limit(1)
      .single()

    let result
    if (existing) {
      result = await supabase
        .from('project_memories')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('project_memories')
        .insert({ project, name, content })
        .select()
        .single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      item_type: 'memory',
      item_name: `${project}/${name}`,
      action: existing ? 'updated' : 'created',
      details: { project, memory_name: name },
    })

    return NextResponse.json({
      success: true,
      memory: result.data,
      action: existing ? 'updated' : 'created',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Maak de single memory route**

`app/api/projects/[slug]/memories/[name]/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

interface Props {
  params: Promise<{ slug: string; name: string }>
}

// GET /api/projects/[slug]/memories/[name] — Read a single memory
export async function GET(_request: NextRequest, { params }: Props) {
  const { slug, name } = await params
  const project = slug.replace(/-/g, ' ')
  const memoryName = decodeURIComponent(name)

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('project_memories')
      .select('*')
      .or(`project.eq.${project},project.eq.${slug}`)
      .eq('name', memoryName)
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }

    return NextResponse.json({ memory: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[slug]/memories/[name] — Delete a memory
export async function DELETE(request: NextRequest, { params }: Props) {
  const { slug, name } = await params
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = slug.replace(/-/g, ' ')
  const memoryName = decodeURIComponent(name)

  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('project_memories')
      .delete()
      .or(`project.eq.${project},project.eq.${slug}`)
      .eq('name', memoryName)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Verifieer routes**

```bash
# List memories (should be empty)
curl -s "https://command-center-app-nine.vercel.app/api/projects/global/memories"

# Create a memory
curl -X POST "https://command-center-app-nine.vercel.app/api/projects/global/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <SYNC_API_KEY>" \
  -d '{"name": "test", "content": "# Test Memory\nThis is a test."}'

# Read it back
curl -s "https://command-center-app-nine.vercel.app/api/projects/global/memories/test"

# Delete it
curl -X DELETE "https://command-center-app-nine.vercel.app/api/projects/global/memories/test" \
  -H "x-api-key: <SYNC_API_KEY>"
```

**Step 4: Commit**

```bash
git add command-center-app/src/app/api/projects/
git commit -m "feat: add project memories CRUD API (replaces Serena memories)"
```

---

## Task 3: Memories UI op project detail pagina

**Doel:** Memories sectie toevoegen aan de project detail pagina zodat Shadow memories kan bekijken.

**Files:**
- Create: `command-center-app/src/components/memories/MemoryList.tsx`
- Modify: `command-center-app/src/app/(dashboard)/projects/[slug]/page.tsx`
- Modify: `command-center-app/src/lib/projects.ts`

**Step 1: Maak server-side memory query**

Voeg toe aan `lib/projects.ts`:
```typescript
export interface ProjectMemory {
  id: string
  project: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export async function getProjectMemories(projectName: string): Promise<ProjectMemory[]> {
  try {
    const client = getSupabase()
    const slug = projectName.toLowerCase().replace(/\s+/g, '-')
    const { data, error } = await client
      .from('project_memories')
      .select('*')
      .or(`project.eq.${projectName},project.eq.${slug}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching memories:', error)
      return []
    }
    return data || []
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}
```

**Step 2: Maak MemoryList component**

`components/memories/MemoryList.tsx`:
```tsx
import { BookOpen, Clock } from 'lucide-react'
import type { ProjectMemory } from '@/lib/projects'

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface Props {
  memories: ProjectMemory[]
}

export function MemoryList({ memories }: Props) {
  if (memories.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
        Memories
      </h2>
      <div className="mt-4 space-y-3">
        {memories.map((memory) => (
          <div
            key={memory.id}
            className="rounded-xl px-4 py-4 bg-white/30 dark:bg-zinc-800/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {memory.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(memory.updated_at)}
              </div>
            </div>
            <pre className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
              {memory.content}
            </pre>
          </div>
        ))}
      </div>
    </section>
  )
}
```

**Step 3: Integreer in project detail pagina**

Voeg memories toe aan de data fetch in `projects/[slug]/page.tsx`:
```typescript
// In de Promise.all, voeg toe:
import { getProjectMemories } from '@/lib/projects'

const [commands, agents, skills, prompts, apis, instructions, changelog, memories] = await Promise.all([
  // ... bestaande calls ...
  getProjectMemories(finalProject.name),
])
```

Voeg de MemoryList component toe in de JSX (na changelog, voor assets):
```tsx
import { MemoryList } from '@/components/memories/MemoryList'

{/* Na changelog sectie */}
<MemoryList memories={memories} />
```

**Step 4: Commit**

```bash
git add command-center-app/src/components/memories/ command-center-app/src/app/\(dashboard\)/projects/ command-center-app/src/lib/projects.ts
git commit -m "feat: add memories UI to project detail page"
```

---

## Task 4: Claude Code command `/memory`

**Doel:** Een command waarmee Claude Code memories kan schrijven/lezen via CC v2's API, ter vervanging van Serena's `write_memory`/`read_memory`.

**Files:**
- Create: `~/.claude/commands/memory.md`

**Step 1: Schrijf het command**

`~/.claude/commands/memory.md`:
```markdown
---
name: memory
description: Beheer project memories in Command Center (vervangt Serena memories)
user-invocable: true
category: command-center
allowed-tools: Bash(*), Read, AskUserQuestion
---

# Project Memory Management

Schrijf, lees of verwijder project memories via de Command Center API.

## Instructies

1. **Bepaal de actie** op basis van de context:
   - Als de gebruiker een memory wil opslaan: WRITE
   - Als de gebruiker een memory wil lezen: READ
   - Als de gebruiker een memory wil verwijderen: DELETE
   - Als onduidelijk: vraag via AskUserQuestion

2. **Bepaal het project** — gebruik de huidige working directory naam, of vraag.

3. **Lees de API key:**
   ```
   Lees: ~/Projects/command-center-v2/command-center-app/.env.local
   Zoek: SYNC_API_KEY
   ```

4. **Voer de actie uit:**

   **WRITE:**
   ```bash
   curl -X POST "https://command-center-app-nine.vercel.app/api/projects/<slug>/memories" \
     -H "Content-Type: application/json" \
     -H "x-api-key: <key>" \
     -d '{"name": "<memory-naam>", "content": "<markdown-content>"}'
   ```

   **READ (lijst):**
   ```bash
   curl -s "https://command-center-app-nine.vercel.app/api/projects/<slug>/memories"
   ```

   **READ (specifiek):**
   ```bash
   curl -s "https://command-center-app-nine.vercel.app/api/projects/<slug>/memories/<naam>"
   ```

   **DELETE:**
   ```bash
   curl -X DELETE "https://command-center-app-nine.vercel.app/api/projects/<slug>/memories/<naam>" \
     -H "x-api-key: <key>"
   ```

5. **Rapporteer het resultaat.**
```

**Step 2: Verifieer**

In een Claude Code sessie: `/memory` moet beschikbaar zijn.

---

## Task 5: Uitbreiding projects tabel met onboarding data

**Doel:** Project metadata uitbreiden zodat tech stack, build commands en key files opgeslagen kunnen worden — vervangt Serena's onboarding feature.

**Files:**
- SQL migration
- Modify: `command-center-app/src/lib/projects.ts`
- Modify: `command-center-app/src/app/(dashboard)/projects/[slug]/page.tsx`

**Step 1: Voeg kolommen toe aan projects tabel**

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS build_command TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS test_command TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dev_command TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_url TEXT;
```

**Step 2: Update de API voor project metadata**

Maak een PATCH endpoint: `app/api/projects/[slug]/route.ts`
```typescript
// PATCH /api/projects/[slug] — Update project metadata
export async function PATCH(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const allowed = ['description', 'tech_stack', 'build_command', 'test_command', 'dev_command', 'languages', 'live_url', 'repo_url']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}
```

**Step 3: Toon onboarding data op project detail pagina**

Voeg een "Project Info" sectie toe boven de assets die toont:
- Tech stack badges
- Build/test/dev commands als code blocks
- Languages badges
- Live URL en repo URL als links

**Step 4: Commit**

```bash
git add command-center-app/src/app/api/projects/ command-center-app/src/app/\(dashboard\)/projects/ command-center-app/src/lib/projects.ts
git commit -m "feat: add project onboarding metadata (replaces Serena onboarding)"
```

---

## Task 6: Claude Code command `/onboard`

**Doel:** Command dat automatisch project-info detecteert en naar CC v2 pusht.

**Files:**
- Create: `~/.claude/commands/onboard.md`

**Step 1: Schrijf het command**

```markdown
---
name: onboard
description: Detecteer project structuur en sla op in Command Center
user-invocable: true
category: command-center
allowed-tools: Bash(*), Read, Glob, Grep, AskUserQuestion
---

# Project Onboarding

Analyseer het huidige project en sla de metadata op in Command Center.

## Instructies

1. **Detecteer project info:**
   - Lees `package.json` voor tech stack en scripts (build, test, dev)
   - Lees `CLAUDE.md` voor project beschrijving
   - Check voor `tsconfig.json`, `pyproject.toml`, `Cargo.toml`, etc. voor taal
   - Check voor `.env*` bestanden (niet de inhoud, alleen bestaan)
   - Check voor deployment config (vercel.json, Dockerfile, etc.)

2. **Stel samen:**
   ```json
   {
     "description": "...",
     "tech_stack": ["Next.js", "Supabase", "Tailwind"],
     "build_command": "npm run build",
     "test_command": "npm test",
     "dev_command": "npm run dev",
     "languages": ["typescript"],
     "live_url": "https://...",
     "repo_url": "https://github.com/..."
   }
   ```

3. **Toon aan gebruiker en vraag bevestiging**

4. **Push naar CC v2:**
   ```bash
   curl -X PATCH "https://command-center-app-nine.vercel.app/api/projects/<slug>" \
     -H "Content-Type: application/json" \
     -H "x-api-key: <key>" \
     -d '<json>'
   ```
```

---

## Task 7: Migreer bestaande Serena memories naar CC v2

**Doel:** Eventuele Serena memories overzetten naar CC v2.

**Files:**
- Run: Migration script

**Step 1: Check alle projecten voor .serena/memories/**

```bash
for dir in ~/Projects/*/; do
  if [ -d "$dir/.serena/memories" ]; then
    echo "$dir:"
    ls "$dir/.serena/memories/"
  fi
done
```

**Step 2: Push elke memory naar CC v2 API**

Voor elke gevonden memory:
```bash
CONTENT=$(cat "$dir/.serena/memories/$file")
PROJECT=$(basename "$dir")
SLUG=$(echo "$PROJECT" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
NAME=$(basename "$file" .md)

curl -X POST "https://command-center-app-nine.vercel.app/api/projects/$SLUG/memories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <key>" \
  -d "{\"name\": \"$NAME\", \"content\": $(echo "$CONTENT" | jq -Rs)}"
```

**Step 3: Verifieer in dashboard**

Open de project detail pagina en controleer dat memories verschijnen.

---

## Task 8: Disable Serena plugin

**Doel:** Serena uitschakelen nu CC v2 de functionaliteit overneemt.

**Files:**
- Modify: `~/.claude/settings.json` (disable serena plugin)
- Delete: `.serena/` folders in projecten (optioneel)

**Step 1: Disable in settings**

In `~/.claude/settings.json`, zet serena op disabled.

**Step 2: Verwijder .serena/ folders**

```bash
for dir in ~/Projects/*/; do
  if [ -d "$dir/.serena" ]; then
    echo "Removing $dir/.serena/"
    rm -rf "$dir/.serena/"
  fi
done
```

> **BELANGRIJK:** Vraag Shadow om bevestiging voor verwijdering.

**Step 3: Update CLAUDE.md**

Verwijder Serena uit de systeemrollen sectie. CC v2 is nu het enige externe systeem naast Claude Code.

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "chore: remove Serena references, CC v2 is the single management system"
```

---

## Task 9: Final verification

**Doel:** Verifieer dat alles werkt zonder Serena.

**Checklist:**
- [ ] CC v2 dashboard toont alle assets (sync werkt)
- [ ] Project detail pagina toont memories
- [ ] `/memory` command schrijft/leest memories via CC v2 API
- [ ] `/onboard` command pusht project metadata
- [ ] `/sync-cc` command synct registry
- [ ] Serena plugin is disabled
- [ ] Geen .serena/ folders meer in projecten
- [ ] Build slaagt zonder errors

---

## Samenvatting

| Task | Wat | Impact |
|------|-----|--------|
| 1 | `project_memories` tabel | Database fundament |
| 2 | Memories CRUD API | Claude Code kan memories schrijven |
| 3 | Memories UI | Shadow kan memories zien in dashboard |
| 4 | `/memory` command | Makkelijke memory management vanuit Claude Code |
| 5 | Projects tabel uitbreiden | Onboarding data opslaan |
| 6 | `/onboard` command | Auto-detect project info |
| 7 | Migreer Serena memories | Geen data verlies |
| 8 | Disable Serena | Clean break |
| 9 | Final verification | Alles werkt |

### Architectuur na implementatie

```
~/.claude/registry/*.json  ─── /sync-cc ──→  Supabase registry_items  ──→  CC v2 Dashboard
                                                                            ├── Homepage (stats)
                                                                            ├── Registry (browse)
                                                                            ├── Tasks (kanban)
                                                                            ├── Activity (log)
                                                                            ├── Settings (sync status)
                                                                            └── Projects (detail + memories)

Claude Code sessie  ─── /memory ──→  Supabase project_memories  ──→  CC v2 Project Detail
                    ─── /onboard ──→  Supabase projects (metadata) ──→  CC v2 Project Detail
```

Geen Serena. Twee systemen: **Claude Code** (runtime) + **CC v2** (dashboard).
