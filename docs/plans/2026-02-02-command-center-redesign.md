# Command Center v2 Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Command Center naar een minimalistisch, Apple-achtig dashboard met glassmorphism, project registry met credentials, en automatische changelog.

**Architecture:**
- 4 navigatie items (Home, Registry, Activity, Settings)
- Homepage met Projects sectie, compacte asset stats, en recent activity
- Project detail pagina met folder structuur, credentials, en changelog
- Bold glassmorphism met blauwe accent glows

**Tech Stack:** Next.js 14, Tailwind CSS, Supabase, Lucide icons

---

## Task 1: Database Schema voor Projects

**Files:**
- Create: `supabase/migrations/20260202_add_projects.sql`

**Step 1: Write migration voor projects tabel**

```sql
-- Projects tabel
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project folders (structuur beschrijvingen)
CREATE TABLE IF NOT EXISTS project_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Project credentials
CREATE TABLE IF NOT EXISTS project_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  username TEXT,
  password TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project changelog
CREATE TABLE IF NOT EXISTS project_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link registry_items to projects
ALTER TABLE registry_items ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
```

**Step 2: Apply migration via Supabase dashboard of CLI**

Run: Open Supabase dashboard → SQL Editor → Execute migration

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add projects database schema"
```

---

## Task 2: Simplify Navigation to 4 Items

**Files:**
- Modify: `src/components/shell/ShellLayout.tsx`

**Step 1: Update navigation items**

```tsx
const navigationItems: Omit<NavigationItem, 'isActive'>[] = [
  { label: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: 'Registry', href: '/registry', icon: <Database className="h-5 w-5" /> },
  { label: 'Activity', href: '/activity', icon: <Activity className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]
```

**Step 2: Update imports**

```tsx
import {
  Home,
  Database,
  Activity,
  Settings,
} from 'lucide-react'
```

**Step 3: Verify in browser**

Run: Check http://localhost:3000 - should show 4 nav items

**Step 4: Commit**

```bash
git add src/components/shell/ShellLayout.tsx
git commit -m "feat: simplify navigation to 4 items"
```

---

## Task 3: Bold Glassmorphism CSS Variables

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add glass and glow utilities**

```css
/* Bold Glassmorphism */
:root {
  --glass-bg: rgba(255, 255, 255, 0.6);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: 30px;
  --accent-blue: #3B82F6;
  --glow-blue: rgba(59, 130, 246, 0.4);
  --glow-blue-subtle: rgba(59, 130, 246, 0.15);
}

.dark {
  --glass-bg: rgba(24, 24, 27, 0.6);
  --glass-border: rgba(255, 255, 255, 0.08);
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

.glow-blue {
  box-shadow: 0 0 30px var(--glow-blue-subtle);
}

.glow-blue-hover:hover {
  box-shadow: 0 0 40px var(--glow-blue);
}

.text-glow-blue:hover {
  text-shadow: 0 0 20px var(--glow-blue);
}

/* Smooth transitions for all interactive elements */
button, a, [role="button"] {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Step 2: Verify styles load**

Run: Check browser DevTools - CSS variables should be defined

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add bold glassmorphism CSS utilities"
```

---

## Task 4: Redesign Sidebar with Glow Effects

**Files:**
- Modify: `src/components/shell/AppShell.tsx`
- Modify: `src/components/shell/MainNav.tsx`

**Step 1: Update AppShell sidebar styling**

```tsx
{/* Sidebar - Desktop */}
<aside className="fixed inset-y-0 left-0 z-50 w-16 glass max-md:hidden">
  <MainNav
    items={navigationItems}
    onNavigate={onNavigate}
  />
</aside>
```

**Step 2: Update MainNav with glow effects**

```tsx
<button
  onClick={() => onNavigate?.(item.href)}
  className={`
    group relative flex w-full items-center gap-3 rounded-xl p-3 transition-all duration-300
    ${showLabels ? 'justify-start' : 'justify-center'}
    ${item.isActive
      ? 'text-white glow-blue'
      : 'text-zinc-400 hover:text-white glow-blue-hover'
    }
  `}
  aria-label={item.label}
>
  {/* Glow background for active */}
  {item.isActive && (
    <div className="absolute inset-0 rounded-xl bg-[var(--accent-blue)] opacity-20 blur-xl" />
  )}
  <span className="relative h-5 w-5 shrink-0 [&>svg]:stroke-[1.5]">{item.icon}</span>
</button>
```

**Step 3: Verify glow effects in browser**

Run: Check sidebar - active item should have blue glow

**Step 4: Commit**

```bash
git add src/components/shell/AppShell.tsx src/components/shell/MainNav.tsx
git commit -m "feat: add glow effects to sidebar navigation"
```

---

## Task 5: Redesign Homepage with Projects Section

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`
- Create: `src/lib/projects.ts`

**Step 1: Create projects data fetching**

```typescript
// src/lib/projects.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  updated_at: string
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, description, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  return data || []
}
```

**Step 2: Redesign homepage**

```tsx
// src/app/(dashboard)/page.tsx
import { Key, MessageSquare, Sparkles, Bot, Terminal, FileText } from 'lucide-react'
import { getStats, getRecentActivity } from '@/lib/registry'
import { getProjects } from '@/lib/projects'
import Link from 'next/link'

const assetTypes = [
  { key: 'apis', label: 'APIs', icon: Key },
  { key: 'prompts', label: 'Prompts', icon: MessageSquare },
  { key: 'skills', label: 'Skills', icon: Sparkles },
  { key: 'agents', label: 'Agents', icon: Bot },
  { key: 'commands', label: 'Commands', icon: Terminal },
  { key: 'instructions', label: 'Instructions', icon: FileText },
] as const

export default async function HomePage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams
  const [stats, recentActivity, projects] = await Promise.all([
    getStats(project),
    getRecentActivity(project),
    getProjects(),
  ])

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Command Center
        </h1>

        {/* Projects Section */}
        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Projects
          </h2>
          <div className="mt-4 space-y-2">
            {projects.length === 0 ? (
              <p className="text-sm text-zinc-500">No projects yet</p>
            ) : (
              projects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.slug}`}
                  className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/50 dark:hover:bg-zinc-800/30 glow-blue-hover"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--accent-blue)]">
                      {proj.name}
                    </p>
                    {proj.description && (
                      <p className="text-sm text-zinc-500">{proj.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400">
                    {new Date(proj.updated_at).toLocaleDateString('nl-NL')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Assets Section - Compact */}
        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Assets
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {assetTypes.map((type) => {
              const count = stats[type.key as keyof typeof stats]
              return (
                <Link
                  key={type.key}
                  href={`/registry?type=${type.key}`}
                  className="group flex items-center gap-2 text-sm text-zinc-600 transition-all duration-300 hover:text-[var(--accent-blue)] text-glow-blue"
                >
                  <span className="font-medium">{type.label}</span>
                  <span className="text-zinc-400 group-hover:text-[var(--accent-blue)]">{count}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Recent Activity
          </h2>
          <div className="mt-4 space-y-1">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-zinc-500">No activity yet</p>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl px-4 py-2 transition-colors duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30"
                >
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.assetName}</span>
                  <span className="text-xs text-zinc-400">{item.project}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
```

**Step 3: Verify homepage in browser**

Run: Check http://localhost:3000 - should show new minimal design

**Step 4: Commit**

```bash
git add src/lib/projects.ts src/app/\(dashboard\)/page.tsx
git commit -m "feat: redesign homepage with projects section"
```

---

## Task 6: Create Project Detail Page

**Files:**
- Create: `src/app/(dashboard)/projects/[slug]/page.tsx`
- Create: `src/lib/projects.ts` (extend)

**Step 1: Extend projects lib with detail fetching**

```typescript
// Add to src/lib/projects.ts

export interface ProjectFolder {
  id: string
  path: string
  description: string | null
  sort_order: number
}

export interface ProjectCredential {
  id: string
  service: string
  username: string | null
  password: string | null
  notes: string | null
}

export interface ProjectChangelog {
  id: string
  description: string
  created_at: string
}

export interface ProjectDetail extends Project {
  folders: ProjectFolder[]
  credentials: ProjectCredential[]
  changelog: ProjectChangelog[]
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !project) return null

  const [folders, credentials, changelog] = await Promise.all([
    supabase.from('project_folders').select('*').eq('project_id', project.id).order('sort_order'),
    supabase.from('project_credentials').select('*').eq('project_id', project.id),
    supabase.from('project_changelog').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
  ])

  return {
    ...project,
    folders: folders.data || [],
    credentials: credentials.data || [],
    changelog: changelog.data || [],
  }
}
```

**Step 2: Create project detail page**

```tsx
// src/app/(dashboard)/projects/[slug]/page.tsx
import { ArrowLeft, FolderOpen, Key, Clock } from 'lucide-react'
import { getProjectBySlug } from '@/lib/projects'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-[var(--accent-blue)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back
        </Link>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-2 text-zinc-500">{project.description}</p>
          )}
        </div>

        {/* Folder Structure */}
        {project.folders.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Structure
            </h2>
            <div className="mt-4 space-y-2">
              {project.folders.map((folder) => (
                <div key={folder.id} className="flex items-start gap-3 rounded-xl px-4 py-3 bg-white/30 dark:bg-zinc-800/20">
                  <FolderOpen className="h-5 w-5 text-zinc-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{folder.path}</p>
                    {folder.description && (
                      <p className="text-sm text-zinc-500 mt-1">{folder.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Credentials */}
        {project.credentials.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Accounts & Credentials
            </h2>
            <div className="mt-4 space-y-2">
              {project.credentials.map((cred) => (
                <div key={cred.id} className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/30 dark:bg-zinc-800/20">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">{cred.service}</p>
                      {cred.username && (
                        <p className="text-sm text-zinc-500">{cred.username}</p>
                      )}
                    </div>
                  </div>
                  {cred.password && (
                    <code className="text-sm text-zinc-400 font-mono">••••••••</code>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Changelog */}
        {project.changelog.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Changes
            </h2>
            <div className="mt-4 space-y-4">
              {project.changelog.map((entry) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700 mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className="text-xs text-zinc-400">
                      {new Date(entry.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Verify project page**

Run: Navigate to http://localhost:3000/projects/[slug]

**Step 4: Commit**

```bash
git add src/lib/projects.ts src/app/\(dashboard\)/projects/
git commit -m "feat: add project detail page with structure and credentials"
```

---

## Task 7: Create Registry Page (All Assets Combined)

**Files:**
- Create: `src/app/(dashboard)/registry/page.tsx`

**Step 1: Create combined registry page**

```tsx
// src/app/(dashboard)/registry/page.tsx
import { Key, MessageSquare, Sparkles, Bot, Terminal, FileText } from 'lucide-react'
import { getAgents, getApis, getCommands, getInstructions, getPrompts, getSkills } from '@/lib/registry'

const typeConfig = {
  api: { icon: Key, label: 'API' },
  prompt: { icon: MessageSquare, label: 'Prompt' },
  skill: { icon: Sparkles, label: 'Skill' },
  agent: { icon: Bot, label: 'Agent' },
  command: { icon: Terminal, label: 'Command' },
  instruction: { icon: FileText, label: 'Instruction' },
}

interface Props {
  searchParams: Promise<{ type?: string; project?: string }>
}

export default async function RegistryPage({ searchParams }: Props) {
  const { type, project } = await searchParams

  const [apis, prompts, skills, agents, commands, instructions] = await Promise.all([
    getApis(project),
    getPrompts(project),
    getSkills(project),
    getAgents(project),
    getCommands(project),
    getInstructions(project),
  ])

  // Flatten commands categories
  const flatCommands = commands.flatMap(cat => cat.commands.map(cmd => ({
    id: cmd.id,
    name: cmd.name,
    type: 'command' as const,
    project: 'global',
  })))

  // Combine all items
  const allItems = [
    ...apis.map(i => ({ ...i, type: 'api' as const })),
    ...prompts.map(i => ({ ...i, type: 'prompt' as const })),
    ...skills.map(i => ({ ...i, type: 'skill' as const })),
    ...agents.map(i => ({ ...i, type: 'agent' as const })),
    ...flatCommands,
    ...instructions.map(i => ({ ...i, type: 'instruction' as const })),
  ]

  // Filter by type if specified
  const filteredItems = type ? allItems.filter(i => i.type === type) : allItems

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Registry
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {filteredItems.length} items {type && `(${type})`}
        </p>

        {/* Type filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          <a
            href="/registry"
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
              !type
                ? 'bg-[var(--accent-blue)] text-white glow-blue'
                : 'text-zinc-500 hover:text-[var(--accent-blue)]'
            }`}
          >
            All
          </a>
          {Object.entries(typeConfig).map(([key, config]) => (
            <a
              key={key}
              href={`/registry?type=${key}`}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
                type === key
                  ? 'bg-[var(--accent-blue)] text-white glow-blue'
                  : 'text-zinc-500 hover:text-[var(--accent-blue)]'
              }`}
            >
              {config.label}s
            </a>
          ))}
        </div>

        {/* Items list */}
        <div className="mt-8 space-y-1">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No items found</p>
          ) : (
            filteredItems.map((item) => {
              const config = typeConfig[item.type]
              const Icon = config.icon
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/50 dark:hover:bg-zinc-800/30 glow-blue-hover"
                >
                  <Icon className="h-4 w-4 text-zinc-400 group-hover:text-[var(--accent-blue)]" strokeWidth={1.5} />
                  <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {item.name}
                  </span>
                  <span className="text-xs text-zinc-400">{item.project}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify registry page**

Run: Check http://localhost:3000/registry

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/registry/
git commit -m "feat: add combined registry page with type filters"
```

---

## Task 8: Remove Old Asset Pages

**Files:**
- Delete: `src/app/(dashboard)/apis/`
- Delete: `src/app/(dashboard)/prompts/`
- Delete: `src/app/(dashboard)/skills/`
- Delete: `src/app/(dashboard)/agents/`
- Delete: `src/app/(dashboard)/commands/`
- Delete: `src/app/(dashboard)/instructions/`
- Delete: `src/app/(dashboard)/notes/`

**Step 1: Remove old pages**

```bash
rm -rf src/app/\(dashboard\)/apis
rm -rf src/app/\(dashboard\)/prompts
rm -rf src/app/\(dashboard\)/skills
rm -rf src/app/\(dashboard\)/agents
rm -rf src/app/\(dashboard\)/commands
rm -rf src/app/\(dashboard\)/instructions
rm -rf src/app/\(dashboard\)/notes
```

**Step 2: Verify no broken links**

Run: Navigate through app, check for 404s

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old individual asset pages"
```

---

## Task 9: Update ProjectSwitcher Styling

**Files:**
- Modify: `src/components/shell/ProjectSwitcher.tsx`

**Step 1: Apply glassmorphism and glow**

```tsx
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ProjectSwitcherProps {
  projects: string[]
  currentProject: string | null
}

export function ProjectSwitcher({ projects, currentProject }: ProjectSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSelect = (project: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (project) {
      params.set('project', project)
    } else {
      params.delete('project')
    }
    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl glass px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 transition-all duration-300 glow-blue-hover"
      >
        <span className="font-medium">{currentProject || 'All'}</span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl glass py-1 shadow-xl glow-blue">
          <button
            onClick={() => handleSelect(null)}
            className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-all duration-200 ${
              !currentProject
                ? 'text-[var(--accent-blue)] font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-[var(--accent-blue)]'
            }`}
          >
            All projects
          </button>

          {projects.length > 0 && (
            <div className="my-1 border-t border-white/10" />
          )}

          {projects.map((project) => (
            <button
              key={project}
              onClick={() => handleSelect(project)}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                currentProject === project
                  ? 'text-[var(--accent-blue)] font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-[var(--accent-blue)]'
              }`}
            >
              {project}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify in browser**

Run: Check ProjectSwitcher has glass effect and blue glow

**Step 3: Commit**

```bash
git add src/components/shell/ProjectSwitcher.tsx
git commit -m "feat: apply glassmorphism to ProjectSwitcher"
```

---

## Task 10: Final Polish and Testing

**Step 1: Test all navigation paths**

- [ ] Home loads with projects, assets, activity
- [ ] Registry shows all items with filters
- [ ] Activity page works
- [ ] Settings page works
- [ ] Project detail pages load
- [ ] ProjectSwitcher filters correctly

**Step 2: Test glassmorphism effects**

- [ ] Sidebar has blur effect
- [ ] Active nav has blue glow
- [ ] Hover states show glow
- [ ] ProjectSwitcher dropdown has glass effect

**Step 3: Build for production**

```bash
npm run build
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Command Center v2 redesign"
```

---

## Summary

This plan transforms Command Center into a minimalist, Apple-inspired dashboard with:

1. **4 navigation items** - Home, Registry, Activity, Settings
2. **Projects section** - With folder structure, credentials, changelog
3. **Bold glassmorphism** - 30px blur, blue glow accents
4. **Compact asset stats** - Text-only, no cards
5. **Monochrome + blue** - Clean color scheme with signature accent
