# Overgeslagen Intelligence Map Features — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementeer de 7 overgeslagen features uit het Intelligence Map plan: Kosten Dashboard, Gebruiksstatistieken, Tijdlijn, Vergelijkingsweergave, Bladwijzers, Export, en API Route Extractie.

**Architecture:** Elk feature volgt het bestaande server-first patroon: server-side queries in `lib/` files, API routes voor mutaties, client components voor interactie. Alle database tabellen bestaan al (aangemaakt in Wave 1 migraties). UI volgt Shadow Huisstijl: monochrome zinc, glassmorphism, Inter font.

**Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL), Tailwind CSS v4, Lucide React, Framer Motion, ts-morph (voor API route extractie)

---

## Feature A: Kosten Dashboard (service_costs)

### Doel
Toon maandelijkse kosten per dienst (Supabase, Vercel, OpenAI, etc.) in een overzichtelijk dashboard. Laat zien wat Shadow's AI-ecosysteem kost per maand, per project, en per service.

### Database (bestaand)
Tabel `service_costs` is al aangemaakt met kolommen: `service`, `project`, `plan`, `monthly_cost`, `usage_metric`, `usage_value`, `period`.

---

### Task A1: Server-side query functies voor kosten

**Files:**
- Create: `command-center-app/src/lib/costs.ts`

**Step 1: Maak het query bestand**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type Supabase = SupabaseClient<any, any, any>

let supabase: Supabase

function getClient(): Supabase {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (url: string | URL | Request, init?: RequestInit) =>
            fetch(url, { ...init, cache: 'no-store' }),
        },
      }
    )
  }
  return supabase
}

export interface ServiceCost {
  id: string
  service: string
  project: string | null
  plan: string | null
  monthly_cost: number
  usage_metric: string | null
  usage_value: number
  period: string
  detected_at: string
}

export interface CostSummary {
  totalMonthly: number
  byService: { service: string; total: number; projects: string[] }[]
  byProject: { project: string; total: number; services: string[] }[]
  trend: { period: string; total: number }[]
}

export async function getCosts(period?: string): Promise<ServiceCost[]> {
  const db = getClient()
  let query = db.from('service_costs').select('*').order('period', { ascending: false })
  if (period) query = query.eq('period', period)
  const { data } = await query
  return (data || []) as ServiceCost[]
}

export async function getCostSummary(): Promise<CostSummary> {
  const db = getClient()
  const { data: all } = await db
    .from('service_costs')
    .select('*')
    .order('period', { ascending: false })

  const costs = (all || []) as ServiceCost[]

  // Huidige maand
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonth = costs.filter((c) => c.period === currentPeriod)

  const totalMonthly = currentMonth.reduce((sum, c) => sum + Number(c.monthly_cost), 0)

  // Groepeer per service
  const serviceMap = new Map<string, { total: number; projects: Set<string> }>()
  for (const c of currentMonth) {
    const entry = serviceMap.get(c.service) || { total: 0, projects: new Set<string>() }
    entry.total += Number(c.monthly_cost)
    if (c.project) entry.projects.add(c.project)
    serviceMap.set(c.service, entry)
  }
  const byService = Array.from(serviceMap.entries())
    .map(([service, v]) => ({ service, total: v.total, projects: Array.from(v.projects) }))
    .sort((a, b) => b.total - a.total)

  // Groepeer per project
  const projectMap = new Map<string, { total: number; services: Set<string> }>()
  for (const c of currentMonth) {
    const proj = c.project || 'Globaal'
    const entry = projectMap.get(proj) || { total: 0, services: new Set<string>() }
    entry.total += Number(c.monthly_cost)
    entry.services.add(c.service)
    projectMap.set(proj, entry)
  }
  const byProject = Array.from(projectMap.entries())
    .map(([project, v]) => ({ project, total: v.total, services: Array.from(v.services) }))
    .sort((a, b) => b.total - a.total)

  // Trend: laatste 6 maanden
  const periodMap = new Map<string, number>()
  for (const c of costs) {
    periodMap.set(c.period, (periodMap.get(c.period) || 0) + Number(c.monthly_cost))
  }
  const trend = Array.from(periodMap.entries())
    .map(([period, total]) => ({ period, total }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-6)

  return { totalMonthly, byService, byProject, trend }
}

export async function upsertCost(cost: Omit<ServiceCost, 'id' | 'detected_at'>): Promise<void> {
  const db = getClient()
  await db.from('service_costs').upsert(
    { ...cost, detected_at: new Date().toISOString() },
    { onConflict: 'service,project,period' }
  )
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS (geen errors in costs.ts)

**Step 3: Commit**
```bash
git add command-center-app/src/lib/costs.ts
git commit -m "feat(costs): add server-side cost query functions"
```

---

### Task A2: API route voor kosten CRUD

**Files:**
- Create: `command-center-app/src/app/api/costs/route.ts`

**Step 1: Maak de API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCosts, getCostSummary, upsertCost } from '@/lib/costs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || undefined
  const summary = searchParams.get('summary') === 'true'

  try {
    if (summary) {
      const data = await getCostSummary()
      return NextResponse.json(data)
    }
    const data = await getCosts(period)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { service, project, plan, monthly_cost, usage_metric, usage_value, period } = body

    if (!service || !period) {
      return NextResponse.json({ error: 'service and period are required' }, { status: 400 })
    }

    await upsertCost({
      service,
      project: project || null,
      plan: plan || null,
      monthly_cost: monthly_cost || 0,
      usage_metric: usage_metric || null,
      usage_value: usage_value || 0,
      period,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upsert failed' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/app/api/costs/route.ts
git commit -m "feat(costs): add costs API route (GET + POST)"
```

---

### Task A3: Kosten Dashboard component

**Files:**
- Create: `command-center-app/src/components/map/CostsDashboard.tsx`

**Step 1: Maak het component**

```typescript
'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, Server, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react'

interface ServiceCostRow {
  service: string
  total: number
  projects: string[]
}

interface ProjectCostRow {
  project: string
  total: number
  services: string[]
}

interface TrendPoint {
  period: string
  total: number
}

interface CostSummary {
  totalMonthly: number
  byService: ServiceCostRow[]
  byProject: ProjectCostRow[]
  trend: TrendPoint[]
}

interface CostsDashboardProps {
  summary: CostSummary
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function TrendBar({ trend }: { trend: TrendPoint[] }) {
  if (trend.length === 0) return null
  const max = Math.max(...trend.map((t) => t.total), 1)

  return (
    <div className="flex items-end gap-1 h-16">
      {trend.map((t) => (
        <div key={t.period} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-zinc-300 dark:bg-zinc-600 rounded-t"
            style={{ height: `${(t.total / max) * 100}%`, minHeight: t.total > 0 ? 4 : 0 }}
          />
          <span className="text-[9px] text-zinc-400">{t.period.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CostsDashboard({ summary }: CostsDashboardProps) {
  const [expandedSection, setExpandedSection] = useState<'service' | 'project' | null>(null)

  if (summary.totalMonthly === 0 && summary.byService.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Kosten</h3>
        </div>
        <p className="text-xs text-zinc-400">Nog geen kostendata beschikbaar. Voeg kosten toe via de API.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4 space-y-4">
      {/* Header met totaal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Kosten</h3>
        </div>
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {formatCurrency(summary.totalMonthly)}
          <span className="text-xs text-zinc-400 ml-1">/maand</span>
        </span>
      </div>

      {/* Trend */}
      {summary.trend.length > 1 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Trend</span>
          </div>
          <TrendBar trend={summary.trend} />
        </div>
      )}

      {/* Per service */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'service' ? null : 'service')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-1">
            <Server className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Per dienst</span>
          </div>
          {expandedSection === 'service' ? (
            <ChevronUp className="h-3 w-3 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          )}
        </button>
        {expandedSection === 'service' && (
          <div className="mt-2 space-y-1">
            {summary.byService.map((s) => (
              <div key={s.service} className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-300">{s.service}</span>
                <span className="text-zinc-900 dark:text-zinc-50 font-medium">
                  {formatCurrency(s.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per project */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'project' ? null : 'project')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Per project</span>
          </div>
          {expandedSection === 'project' ? (
            <ChevronUp className="h-3 w-3 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          )}
        </button>
        {expandedSection === 'project' && (
          <div className="mt-2 space-y-1">
            {summary.byProject.map((p) => (
              <div key={p.project} className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-300">{p.project}</span>
                <span className="text-zinc-900 dark:text-zinc-50 font-medium">
                  {formatCurrency(p.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/components/map/CostsDashboard.tsx
git commit -m "feat(costs): add CostsDashboard component"
```

---

### Task A4: Integreer CostsDashboard in Intelligence Map

**Files:**
- Modify: `command-center-app/src/app/(dashboard)/map/page.tsx`
- Modify: `command-center-app/src/components/map/MapPageClient.tsx`

**Step 1: Voeg data fetching toe aan map page**

In `map/page.tsx`, voeg toe:
```typescript
import { getCostSummary } from '@/lib/costs'

// In de page functie, voeg toe aan de parallel fetch:
const [mapData, costSummary] = await Promise.all([
  getMapData(),
  getCostSummary(),
])

// Pass door naar MapPageClient:
<MapPageClient data={mapData} costSummary={costSummary} />
```

**Step 2: Update MapPageClient props en render CostsDashboard**

In `MapPageClient.tsx`:
```typescript
import CostsDashboard from './CostsDashboard'

// Voeg toe aan props interface:
interface MapPageClientProps {
  data: MapData
  costSummary?: CostSummary  // Optioneel zodat het niet breekt zonder data
}

// Render in het side panel (naast InsightsPanel en RiskAnalysis):
{costSummary && <CostsDashboard summary={costSummary} />}
```

**Step 3: Verifieer TypeScript + build**

Run: `cd command-center-app && npx tsc --noEmit && npm run build`
Expected: PASS

**Step 4: Commit**
```bash
git add command-center-app/src/app/\(dashboard\)/map/page.tsx command-center-app/src/components/map/MapPageClient.tsx
git commit -m "feat(costs): integrate CostsDashboard into Intelligence Map"
```

---

## Feature B: Gebruiksstatistieken (usage_statistics)

### Doel
Track hoe vaak agents, commands, skills en andere assets worden gebruikt. Toon populariteit, trends, en identificeer ongebruikte items.

### Database (bestaand)
Tabel `usage_statistics` met: `entity_type`, `entity_id`, `metric`, `value`, `period`, `last_used`.

---

### Task B1: Server-side query functies voor usage

**Files:**
- Create: `command-center-app/src/lib/usage.ts`

**Step 1: Maak het query bestand**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type Supabase = SupabaseClient<any, any, any>

let supabase: Supabase

function getClient(): Supabase {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (url: string | URL | Request, init?: RequestInit) =>
            fetch(url, { ...init, cache: 'no-store' }),
        },
      }
    )
  }
  return supabase
}

export interface UsageStat {
  id: string
  entity_type: string
  entity_id: string
  metric: string
  value: number
  period: string
  last_used: string | null
  created_at: string
}

export interface UsageRanking {
  entity_id: string
  entity_type: string
  name: string
  totalInvocations: number
  lastUsed: string | null
}

export interface UsageSummary {
  topUsed: UsageRanking[]
  neverUsed: { id: string; name: string; type: string }[]
  totalInvocations: number
  activeThisMonth: number
}

export async function getUsageStats(entityType?: string, period?: string): Promise<UsageStat[]> {
  const db = getClient()
  let query = db.from('usage_statistics').select('*').order('value', { ascending: false })
  if (entityType) query = query.eq('entity_type', entityType)
  if (period) query = query.eq('period', period)
  const { data } = await query
  return (data || []) as UsageStat[]
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const db = getClient()

  const [usageResult, registryResult] = await Promise.all([
    db.from('usage_statistics')
      .select('*')
      .eq('metric', 'invocations')
      .order('value', { ascending: false }),
    db.from('registry_items')
      .select('id, name, type'),
  ])

  const usageData = (usageResult.data || []) as UsageStat[]
  const registryData = (registryResult.data || []) as { id: string; name: string; type: string }[]

  // Aggregeer per entity
  const entityMap = new Map<string, { type: string; total: number; lastUsed: string | null }>()
  for (const u of usageData) {
    const key = `${u.entity_type}:${u.entity_id}`
    const entry = entityMap.get(key) || { type: u.entity_type, total: 0, lastUsed: null }
    entry.total += u.value
    if (u.last_used && (!entry.lastUsed || u.last_used > entry.lastUsed)) {
      entry.lastUsed = u.last_used
    }
    entityMap.set(key, entry)
  }

  // Match met registry namen
  const registryNameMap = new Map<string, string>()
  for (const r of registryData) {
    registryNameMap.set(r.id, r.name)
    registryNameMap.set(`${r.type}:${r.name}`, r.name)
  }

  const topUsed: UsageRanking[] = Array.from(entityMap.entries())
    .map(([key, v]) => ({
      entity_id: key.split(':').slice(1).join(':'),
      entity_type: v.type,
      name: registryNameMap.get(key) || key.split(':').slice(1).join(':'),
      totalInvocations: v.total,
      lastUsed: v.lastUsed,
    }))
    .sort((a, b) => b.totalInvocations - a.totalInvocations)
    .slice(0, 20)

  // Vind items zonder usage
  const usedIds = new Set(usageData.map((u) => u.entity_id))
  const neverUsed = registryData
    .filter((r) => !usedIds.has(r.name) && !usedIds.has(r.id))
    .map((r) => ({ id: r.id, name: r.name, type: r.type }))

  const totalInvocations = usageData.reduce((sum, u) => sum + u.value, 0)

  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const activeThisMonth = new Set(
    usageData.filter((u) => u.period === currentPeriod).map((u) => u.entity_id)
  ).size

  return { topUsed, neverUsed, totalInvocations, activeThisMonth }
}

export async function recordUsage(
  entityType: string,
  entityId: string,
  metric: string = 'invocations',
  value: number = 1
): Promise<void> {
  const db = getClient()
  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Probeer bestaande rij te updaten, anders insert
  const { data: existing } = await db
    .from('usage_statistics')
    .select('id, value')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('metric', metric)
    .eq('period', period)
    .single()

  if (existing) {
    await db
      .from('usage_statistics')
      .update({ value: existing.value + value, last_used: now.toISOString() })
      .eq('id', existing.id)
  } else {
    await db.from('usage_statistics').insert({
      entity_type: entityType,
      entity_id: entityId,
      metric,
      value,
      period,
      last_used: now.toISOString(),
    })
  }
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/lib/usage.ts
git commit -m "feat(usage): add server-side usage statistics queries"
```

---

### Task B2: API route voor usage

**Files:**
- Create: `command-center-app/src/app/api/usage/route.ts`

**Step 1: Maak de API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getUsageStats, getUsageSummary, recordUsage } from '@/lib/usage'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('type') || undefined
  const period = searchParams.get('period') || undefined
  const summary = searchParams.get('summary') === 'true'

  try {
    if (summary) {
      const data = await getUsageSummary()
      return NextResponse.json(data)
    }
    const data = await getUsageStats(entityType, period)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { entity_type, entity_id, metric, value } = body

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      )
    }

    await recordUsage(entity_type, entity_id, metric || 'invocations', value || 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Record failed' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/app/api/usage/route.ts
git commit -m "feat(usage): add usage statistics API route"
```

---

### Task B3: Usage Panel component

**Files:**
- Create: `command-center-app/src/components/map/UsagePanel.tsx`

**Step 1: Maak het component**

```typescript
'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface UsageRanking {
  entity_id: string
  entity_type: string
  name: string
  totalInvocations: number
  lastUsed: string | null
}

interface UsageSummary {
  topUsed: UsageRanking[]
  neverUsed: { id: string; name: string; type: string }[]
  totalInvocations: number
  activeThisMonth: number
}

interface UsagePanelProps {
  summary: UsageSummary
}

const TYPE_LABELS: Record<string, string> = {
  agent: 'Agent',
  command: 'Command',
  skill: 'Skill',
  prompt: 'Prompt',
  api: 'API',
  instruction: 'Instructie',
}

export default function UsagePanel({ summary }: UsagePanelProps) {
  const [showUnused, setShowUnused] = useState(false)

  if (summary.totalInvocations === 0 && summary.neverUsed.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Gebruik</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Nog geen gebruiksdata beschikbaar. Data wordt verzameld via de usage API.
        </p>
      </div>
    )
  }

  const maxInvocations = Math.max(...summary.topUsed.map((u) => u.totalInvocations), 1)

  return (
    <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Gebruik</h3>
        </div>
        <div className="flex gap-3 text-xs text-zinc-400">
          <span>{summary.totalInvocations} totaal</span>
          <span>{summary.activeThisMonth} actief</span>
        </div>
      </div>

      {/* Top Used */}
      {summary.topUsed.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Meest gebruikt
            </span>
          </div>
          <div className="space-y-1.5">
            {summary.topUsed.slice(0, 10).map((item) => (
              <div key={`${item.entity_type}:${item.entity_id}`} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-700 dark:text-zinc-200 truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                      {TYPE_LABELS[item.entity_type] || item.entity_type}
                    </span>
                  </div>
                </div>
                <div className="w-20 flex items-center gap-1.5 shrink-0">
                  <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full"
                      style={{ width: `${(item.totalInvocations / maxInvocations) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 w-6 text-right">
                    {item.totalInvocations}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Never Used */}
      {summary.neverUsed.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnused(!showUnused)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                Ongebruikt ({summary.neverUsed.length})
              </span>
            </div>
            {showUnused ? (
              <ChevronUp className="h-3 w-3 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            )}
          </button>
          {showUnused && (
            <div className="mt-2 space-y-1">
              {summary.neverUsed.slice(0, 15).map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 truncate">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 shrink-0">
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                </div>
              ))}
              {summary.neverUsed.length > 15 && (
                <p className="text-[10px] text-zinc-400">
                  +{summary.neverUsed.length - 15} meer
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/components/map/UsagePanel.tsx
git commit -m "feat(usage): add UsagePanel component with rankings"
```

---

### Task B4: Integreer UsagePanel in Intelligence Map

**Files:**
- Modify: `command-center-app/src/app/(dashboard)/map/page.tsx`
- Modify: `command-center-app/src/components/map/MapPageClient.tsx`

**Step 1: Voeg data fetching toe aan map page**

In `map/page.tsx`, voeg `getUsageSummary()` toe aan Promise.all en pass als prop.

**Step 2: Render UsagePanel in MapPageClient side panel**

```typescript
import UsagePanel from './UsagePanel'

// In het side panel, onder CostsDashboard:
{usageSummary && <UsagePanel summary={usageSummary} />}
```

**Step 3: Verifieer TypeScript + build**

Run: `cd command-center-app && npx tsc --noEmit && npm run build`
Expected: PASS

**Step 4: Commit**
```bash
git add command-center-app/src/app/\(dashboard\)/map/page.tsx command-center-app/src/components/map/MapPageClient.tsx
git commit -m "feat(usage): integrate UsagePanel into Intelligence Map"
```

---

## Feature C: Tijdlijn (entity_versions)

### Doel
Toon een chronologische tijdlijn van alle wijzigingen in het ecosysteem. Laat zien wanneer items zijn toegevoegd, gewijzigd of verwijderd.

### Database (bestaand)
Tabel `entity_versions` met: `entity_type`, `entity_id`, `version`, `change_type`, `title`, `description`, `items_changed`, `detected_at`.

---

### Task C1: Server-side query functies voor tijdlijn

**Files:**
- Create: `command-center-app/src/lib/timeline.ts`

**Step 1: Maak het query bestand**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type Supabase = SupabaseClient<any, any, any>

let supabase: Supabase

function getClient(): Supabase {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (url: string | URL | Request, init?: RequestInit) =>
            fetch(url, { ...init, cache: 'no-store' }),
        },
      }
    )
  }
  return supabase
}

export interface EntityVersion {
  id: string
  entity_type: string
  entity_id: string
  version: string
  change_type: 'added' | 'modified' | 'removed'
  title: string
  description: string | null
  items_changed: unknown[]
  detected_at: string
  detected_by: string
}

export interface TimelineDay {
  date: string
  label: string
  events: EntityVersion[]
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Vandaag'
  if (diffDays === 1) return 'Gisteren'
  if (diffDays < 7) return `${diffDays} dagen geleden`

  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function getTimeline(limit: number = 100): Promise<TimelineDay[]> {
  const db = getClient()
  const { data } = await db
    .from('entity_versions')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(limit)

  const versions = (data || []) as EntityVersion[]

  // Groepeer per dag
  const dayMap = new Map<string, EntityVersion[]>()
  for (const v of versions) {
    const day = v.detected_at.slice(0, 10) // YYYY-MM-DD
    const existing = dayMap.get(day) || []
    existing.push(v)
    dayMap.set(day, existing)
  }

  return Array.from(dayMap.entries())
    .map(([date, events]) => ({
      date,
      label: formatDateLabel(date),
      events,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getEntityHistory(
  entityType: string,
  entityId: string
): Promise<EntityVersion[]> {
  const db = getClient()
  const { data } = await db
    .from('entity_versions')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('detected_at', { ascending: false })

  return (data || []) as EntityVersion[]
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/lib/timeline.ts
git commit -m "feat(timeline): add server-side timeline query functions"
```

---

### Task C2: Timeline component

**Files:**
- Create: `command-center-app/src/components/map/TimelineView.tsx`

**Step 1: Maak het component**

```typescript
'use client'

import { useState } from 'react'
import { Clock, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface EntityVersion {
  id: string
  entity_type: string
  entity_id: string
  version: string
  change_type: 'added' | 'modified' | 'removed'
  title: string
  description: string | null
  items_changed: unknown[]
  detected_at: string
  detected_by: string
}

interface TimelineDay {
  date: string
  label: string
  events: EntityVersion[]
}

interface TimelineViewProps {
  days: TimelineDay[]
}

const CHANGE_ICONS: Record<string, typeof Plus> = {
  added: Plus,
  modified: Pencil,
  removed: Trash2,
}

const CHANGE_LABELS: Record<string, string> = {
  added: 'Toegevoegd',
  modified: 'Gewijzigd',
  removed: 'Verwijderd',
}

const TYPE_LABELS: Record<string, string> = {
  agent: 'Agent',
  command: 'Command',
  skill: 'Skill',
  prompt: 'Prompt',
  api: 'API',
  instruction: 'Instructie',
  project: 'Project',
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export default function TimelineView({ days }: TimelineViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(days.slice(0, 3).map((d) => d.date))
  )

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-6 text-center">
        <Clock className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Nog geen tijdlijndata beschikbaar.</p>
        <p className="text-xs text-zinc-400 mt-1">
          Versiegeschiedenis wordt opgebouwd bij elke sync en deep scan.
        </p>
      </div>
    )
  }

  const toggleDay = (date: string) => {
    const next = new Set(expandedDays)
    if (next.has(date)) next.delete(date)
    else next.add(date)
    setExpandedDays(next)
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const isExpanded = expandedDays.has(day.date)

        return (
          <div
            key={day.date}
            className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm"
          >
            {/* Day header */}
            <button
              onClick={() => toggleDay(day.date)}
              className="flex items-center justify-between w-full p-3 text-left hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {day.label}
                </span>
                <span className="text-xs text-zinc-400">
                  {day.events.length} {day.events.length === 1 ? 'wijziging' : 'wijzigingen'}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>

            {/* Events */}
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-zinc-200/30 dark:border-zinc-800/30">
                <div className="relative ml-4 mt-2">
                  {/* Vertical timeline line */}
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />

                  <div className="space-y-3">
                    {day.events.map((event) => {
                      const Icon = CHANGE_ICONS[event.change_type] || Pencil

                      return (
                        <div key={event.id} className="relative pl-6">
                          {/* Dot on timeline */}
                          <div className="absolute left-0 top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-white dark:border-zinc-900" />

                          <div className="flex items-start gap-2">
                            <Icon className="h-3 w-3 text-zinc-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                                  {event.title}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                  {TYPE_LABELS[event.entity_type] || event.entity_type}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {CHANGE_LABELS[event.change_type] || event.change_type}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              <span className="text-[10px] text-zinc-400">
                                {formatTime(event.detected_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/components/map/TimelineView.tsx
git commit -m "feat(timeline): add TimelineView component with day grouping"
```

---

### Task C3: Integreer Tijdlijn als extra view mode in Intelligence Map

**Files:**
- Modify: `command-center-app/src/app/(dashboard)/map/page.tsx`
- Modify: `command-center-app/src/components/map/MapPageClient.tsx`

**Step 1: Voeg data fetching toe**

In `map/page.tsx`, voeg `getTimeline()` toe aan Promise.all.

**Step 2: Voeg 'tijdlijn' als derde view mode toe**

In `MapPageClient.tsx`:
- Wijzig `viewMode` type naar `'cockpit' | 'graph' | 'timeline'`
- Voeg een derde toggle knop toe (Clock icon)
- Render `<TimelineView days={timelineDays} />` wanneer viewMode === 'timeline'

```typescript
import TimelineView from './TimelineView'

// Bij view mode toggle, voeg toe:
<button
  onClick={() => setViewMode('timeline')}
  className={`p-2 rounded-lg transition-colors ${
    viewMode === 'timeline'
      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50'
      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
  }`}
  title="Tijdlijn"
>
  <Clock className="h-4 w-4" />
</button>

// In de render body:
{viewMode === 'timeline' && <TimelineView days={timelineDays} />}
```

**Step 3: Verifieer TypeScript + build**

Run: `cd command-center-app && npx tsc --noEmit && npm run build`
Expected: PASS

**Step 4: Commit**
```bash
git add command-center-app/src/app/\(dashboard\)/map/page.tsx command-center-app/src/components/map/MapPageClient.tsx
git commit -m "feat(timeline): integrate timeline as third view mode"
```

---

## Feature D: Vergelijkingsweergave

### Doel
Vergelijk twee projecten naast elkaar: assets, health, dependencies, kosten, en gebruik. Handig voor portfolio-overzicht en besluitvorming.

---

### Task D1: Server-side vergelijkingsdata

**Files:**
- Create: `command-center-app/src/lib/comparison.ts`

**Step 1: Maak het query bestand**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type Supabase = SupabaseClient<any, any, any>

let supabase: Supabase

function getClient(): Supabase {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (url: string | URL | Request, init?: RequestInit) =>
            fetch(url, { ...init, cache: 'no-store' }),
        },
      }
    )
  }
  return supabase
}

export interface ProjectComparisonData {
  name: string
  slug: string
  description: string | null
  techStack: string[]
  assetCounts: Record<string, number>
  totalAssets: number
  health: string | null
  metrics: {
    files: number
    loc: number
    symbols: number
    errors: number
    warnings: number
    dependencies: number
  } | null
  monthlyCost: number
  totalUsage: number
}

export async function getProjectComparison(
  slugA: string,
  slugB: string
): Promise<{ a: ProjectComparisonData; b: ProjectComparisonData } | null> {
  const db = getClient()

  // Haal beide projecten op
  const { data: projects } = await db
    .from('projecten')
    .select('*')
    .in('slug', [slugA, slugB])

  if (!projects || projects.length < 2) return null

  async function buildProjectData(slug: string): Promise<ProjectComparisonData> {
    const proj = projects!.find((p: any) => p.slug === slug) as any

    const [registryResult, metricsResult, costsResult, usageResult] = await Promise.all([
      db.from('registry_items').select('type').eq('project', proj.name),
      db.from('project_metrics').select('*').eq('project', slug).single(),
      db.from('service_costs')
        .select('monthly_cost')
        .eq('project', proj.name)
        .eq('period', `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`),
      db.from('usage_statistics')
        .select('value')
        .eq('entity_type', 'project')
        .eq('entity_id', slug),
    ])

    // Tel assets per type
    const assetCounts: Record<string, number> = {}
    for (const item of registryResult.data || []) {
      const t = (item as any).type
      assetCounts[t] = (assetCounts[t] || 0) + 1
    }
    const totalAssets = Object.values(assetCounts).reduce((a, b) => a + b, 0)

    const metrics = metricsResult.data
      ? {
          files: (metricsResult.data as any).total_files,
          loc: (metricsResult.data as any).total_loc,
          symbols: (metricsResult.data as any).total_symbols,
          errors: (metricsResult.data as any).total_diagnostics_error,
          warnings: (metricsResult.data as any).total_diagnostics_warning,
          dependencies: (metricsResult.data as any).total_dependencies,
        }
      : null

    const monthlyCost = (costsResult.data || []).reduce(
      (sum: number, c: any) => sum + Number(c.monthly_cost),
      0
    )

    const totalUsage = (usageResult.data || []).reduce(
      (sum: number, u: any) => sum + Number(u.value),
      0
    )

    return {
      name: proj.name,
      slug: proj.slug,
      description: proj.description,
      techStack: proj.tech_stack || [],
      assetCounts,
      totalAssets,
      health: proj.health || null,
      metrics,
      monthlyCost,
      totalUsage,
    }
  }

  const [a, b] = await Promise.all([buildProjectData(slugA), buildProjectData(slugB)])

  return { a, b }
}

export async function getProjectSlugs(): Promise<{ slug: string; name: string }[]> {
  const db = getClient()
  const { data } = await db
    .from('projecten')
    .select('slug, name')
    .order('name')

  return (data || []) as { slug: string; name: string }[]
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/lib/comparison.ts
git commit -m "feat(comparison): add server-side project comparison queries"
```

---

### Task D2: ComparisonView component

**Files:**
- Create: `command-center-app/src/components/map/ComparisonView.tsx`

**Step 1: Maak het component**

```typescript
'use client'

import { useState } from 'react'
import { GitCompare, Heart, Code, DollarSign, BarChart3, Package } from 'lucide-react'

interface ProjectComparisonData {
  name: string
  slug: string
  description: string | null
  techStack: string[]
  assetCounts: Record<string, number>
  totalAssets: number
  health: string | null
  metrics: {
    files: number
    loc: number
    symbols: number
    errors: number
    warnings: number
    dependencies: number
  } | null
  monthlyCost: number
  totalUsage: number
}

interface ComparisonViewProps {
  projects: { slug: string; name: string }[]
  initialComparison?: { a: ProjectComparisonData; b: ProjectComparisonData } | null
}

const HEALTH_LABELS: Record<string, string> = {
  healthy: 'Gezond',
  'needs-attention': 'Aandacht nodig',
  unhealthy: 'Ongezond',
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '-'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function ComparisonRow({
  label,
  icon: Icon,
  valueA,
  valueB,
  highlight,
}: {
  label: string
  icon: typeof Heart
  valueA: string | number
  valueB: string | number
  highlight?: 'higher-better' | 'lower-better' | 'none'
}) {
  const numA = typeof valueA === 'number' ? valueA : 0
  const numB = typeof valueB === 'number' ? valueB : 0

  let classA = 'text-zinc-900 dark:text-zinc-50'
  let classB = 'text-zinc-900 dark:text-zinc-50'

  if (highlight === 'higher-better' && numA !== numB) {
    classA = numA > numB ? 'text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-400'
    classB = numB > numA ? 'text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-400'
  } else if (highlight === 'lower-better' && numA !== numB) {
    classA = numA < numB ? 'text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-400'
    classB = numB < numA ? 'text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-400'
  }

  return (
    <div className="grid grid-cols-[1fr_100px_100px] gap-2 items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-zinc-400" />
        <span className="text-xs text-zinc-600 dark:text-zinc-300">{label}</span>
      </div>
      <span className={`text-xs text-right ${classA}`}>{valueA}</span>
      <span className={`text-xs text-right ${classB}`}>{valueB}</span>
    </div>
  )
}

export default function ComparisonView({ projects, initialComparison }: ComparisonViewProps) {
  const [slugA, setSlugA] = useState(initialComparison?.a.slug || projects[0]?.slug || '')
  const [slugB, setSlugB] = useState(initialComparison?.b.slug || projects[1]?.slug || '')
  const [comparison, setComparison] = useState(initialComparison || null)
  const [loading, setLoading] = useState(false)

  const fetchComparison = async () => {
    if (!slugA || !slugB || slugA === slugB) return
    setLoading(true)
    try {
      const res = await fetch(`/api/comparison?a=${slugA}&b=${slugB}`)
      const data = await res.json()
      setComparison(data)
    } catch {
      setComparison(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Project selectors */}
      <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitCompare className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Projecten vergelijken
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={slugA}
            onChange={(e) => setSlugA(e.target.value)}
            className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-50"
          >
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
          <span className="text-zinc-400 text-xs">vs</span>
          <select
            value={slugB}
            onChange={(e) => setSlugB(e.target.value)}
            className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-50"
          >
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={fetchComparison}
            disabled={loading || slugA === slugB}
            className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : 'Vergelijk'}
          </button>
        </div>
      </div>

      {/* Comparison table */}
      {comparison && (
        <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_100px_100px] gap-2 items-center pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Metriek</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 text-right truncate">
              {comparison.a.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 text-right truncate">
              {comparison.b.name}
            </span>
          </div>

          {/* Rows */}
          <ComparisonRow
            label="Gezondheid"
            icon={Heart}
            valueA={HEALTH_LABELS[comparison.a.health || ''] || '-'}
            valueB={HEALTH_LABELS[comparison.b.health || ''] || '-'}
            highlight="none"
          />
          <ComparisonRow
            label="Assets"
            icon={Package}
            valueA={comparison.a.totalAssets}
            valueB={comparison.b.totalAssets}
            highlight="higher-better"
          />
          {comparison.a.metrics && comparison.b.metrics && (
            <>
              <ComparisonRow
                label="Bestanden"
                icon={Code}
                valueA={comparison.a.metrics.files}
                valueB={comparison.b.metrics.files}
                highlight="none"
              />
              <ComparisonRow
                label="Regels code"
                icon={Code}
                valueA={comparison.a.metrics.loc.toLocaleString('nl-NL')}
                valueB={comparison.b.metrics.loc.toLocaleString('nl-NL')}
                highlight="none"
              />
              <ComparisonRow
                label="Errors"
                icon={Code}
                valueA={comparison.a.metrics.errors}
                valueB={comparison.b.metrics.errors}
                highlight="lower-better"
              />
              <ComparisonRow
                label="Dependencies"
                icon={Package}
                valueA={comparison.a.metrics.dependencies}
                valueB={comparison.b.metrics.dependencies}
                highlight="none"
              />
            </>
          )}
          <ComparisonRow
            label="Maandkosten"
            icon={DollarSign}
            valueA={formatCurrency(comparison.a.monthlyCost)}
            valueB={formatCurrency(comparison.b.monthlyCost)}
            highlight="lower-better"
          />
          <ComparisonRow
            label="Gebruik"
            icon={BarChart3}
            valueA={comparison.a.totalUsage}
            valueB={comparison.b.totalUsage}
            highlight="higher-better"
          />

          {/* Tech stack comparison */}
          <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Tech Stack</span>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-wrap gap-1">
                {comparison.a.techStack.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {comparison.b.techStack.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/components/map/ComparisonView.tsx
git commit -m "feat(comparison): add ComparisonView component"
```

---

### Task D3: API route voor vergelijking + integratie

**Files:**
- Create: `command-center-app/src/app/api/comparison/route.ts`
- Modify: `command-center-app/src/app/(dashboard)/map/page.tsx`
- Modify: `command-center-app/src/components/map/MapPageClient.tsx`

**Step 1: Maak de API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getProjectComparison } from '@/lib/comparison'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const a = searchParams.get('a')
  const b = searchParams.get('b')

  if (!a || !b) {
    return NextResponse.json({ error: 'Both a and b query params required' }, { status: 400 })
  }

  try {
    const data = await getProjectComparison(a, b)
    if (!data) {
      return NextResponse.json({ error: 'One or both projects not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Comparison failed' },
      { status: 500 }
    )
  }
}
```

**Step 2: Voeg vergelijking als vierde view mode toe**

In `MapPageClient.tsx`:
- Wijzig viewMode type naar `'cockpit' | 'graph' | 'timeline' | 'compare'`
- Voeg GitCompare icon toggle toe
- Render `<ComparisonView projects={projectSlugs} />` wanneer viewMode === 'compare'

**Step 3: Voeg projectSlugs data toe aan map page**

In `map/page.tsx`:
```typescript
import { getProjectSlugs } from '@/lib/comparison'
// Voeg toe aan Promise.all
const projectSlugs = await getProjectSlugs()
// Pass als prop
```

**Step 4: Verifieer TypeScript + build**

Run: `cd command-center-app && npx tsc --noEmit && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add command-center-app/src/app/api/comparison/route.ts command-center-app/src/app/\(dashboard\)/map/page.tsx command-center-app/src/components/map/MapPageClient.tsx
git commit -m "feat(comparison): integrate comparison view in Intelligence Map"
```

---

## Feature E: Bladwijzers (user_bookmarks)

### Doel
Laat Shadow items pinnen voor snelle toegang. Bladwijzers verschijnen bovenaan de Intelligence Map en in de sidebar.

### Database (bestaand)
Tabel `user_bookmarks` met: `user_id`, `entity_type`, `entity_id`, `label`, `sort_order`.

---

### Task E1: Server-side query functies voor bladwijzers

**Files:**
- Create: `command-center-app/src/lib/bookmarks.ts`

**Step 1: Maak het query bestand**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type Supabase = SupabaseClient<any, any, any>

let supabase: Supabase

function getClient(): Supabase {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (url: string | URL | Request, init?: RequestInit) =>
            fetch(url, { ...init, cache: 'no-store' }),
        },
      }
    )
  }
  return supabase
}

export interface Bookmark {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  label: string | null
  sort_order: number
  created_at: string
}

export async function getBookmarks(userId: string = 'shadow'): Promise<Bookmark[]> {
  const db = getClient()
  const { data } = await db
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')

  return (data || []) as Bookmark[]
}

export async function addBookmark(
  entityType: string,
  entityId: string,
  label?: string,
  userId: string = 'shadow'
): Promise<Bookmark | null> {
  const db = getClient()

  // Bepaal sort_order (na het laatste item)
  const { data: last } = await db
    .from('user_bookmarks')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = last ? (last as any).sort_order + 1 : 0

  const { data, error } = await db
    .from('user_bookmarks')
    .insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      label: label || null,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return null
  return data as Bookmark
}

export async function removeBookmark(bookmarkId: string): Promise<boolean> {
  const db = getClient()
  const { error } = await db.from('user_bookmarks').delete().eq('id', bookmarkId)
  return !error
}

export async function isBookmarked(
  entityType: string,
  entityId: string,
  userId: string = 'shadow'
): Promise<boolean> {
  const db = getClient()
  const { data } = await db
    .from('user_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single()

  return !!data
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/lib/bookmarks.ts
git commit -m "feat(bookmarks): add server-side bookmark query functions"
```

---

### Task E2: Bookmarks API route

**Files:**
- Create: `command-center-app/src/app/api/bookmarks/route.ts`

**Step 1: Maak de API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getBookmarks, addBookmark, removeBookmark } from '@/lib/bookmarks'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const bookmarks = await getBookmarks()
    return NextResponse.json(bookmarks)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { entity_type, entity_id, label } = await request.json()

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      )
    }

    const bookmark = await addBookmark(entity_type, entity_id, label)
    if (!bookmark) {
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
    }

    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Create failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  }

  try {
    const success = await removeBookmark(id)
    if (!success) {
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add command-center-app/src/app/api/bookmarks/route.ts
git commit -m "feat(bookmarks): add bookmarks API route (GET/POST/DELETE)"
```

---

### Task E3: BookmarksBar component + integratie

**Files:**
- Create: `command-center-app/src/components/map/BookmarksBar.tsx`
- Modify: `command-center-app/src/components/map/MapPageClient.tsx`
- Modify: `command-center-app/src/components/map/DetailPanel.tsx`

**Step 1: Maak BookmarksBar**

```typescript
'use client'

import { useState } from 'react'
import { Bookmark, X } from 'lucide-react'

interface BookmarkItem {
  id: string
  entity_type: string
  entity_id: string
  label: string | null
  sort_order: number
}

interface BookmarksBarProps {
  bookmarks: BookmarkItem[]
  onSelect: (entityId: string) => void
  onRemove: (bookmarkId: string) => void
}

export default function BookmarksBar({ bookmarks, onSelect, onRemove }: BookmarksBarProps) {
  if (bookmarks.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-1 py-1.5 overflow-x-auto">
      <Bookmark className="h-3 w-3 text-zinc-400 shrink-0" />
      {bookmarks.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b.entity_id)}
          className="group flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
        >
          <span className="truncate max-w-[120px]">{b.label || b.entity_id}</span>
          <X
            className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(b.id)
            }}
          />
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Voeg bookmark-knop toe aan DetailPanel**

In `DetailPanel.tsx`, voeg een pin/unpin button toe naast de close knop:
```typescript
<button
  onClick={() => onToggleBookmark(node)}
  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
  title={isBookmarked ? 'Verwijder bladwijzer' : 'Voeg bladwijzer toe'}
>
  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-zinc-400 text-zinc-400' : 'text-zinc-400'}`} />
</button>
```

**Step 3: Integreer BookmarksBar in MapPageClient**

Fetch bookmarks via `/api/bookmarks` en render `<BookmarksBar>` boven de filterbar.
Bookmark add/remove via POST/DELETE naar `/api/bookmarks`.

**Step 4: Verifieer TypeScript + build**

Run: `cd command-center-app && npx tsc --noEmit && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add command-center-app/src/components/map/BookmarksBar.tsx command-center-app/src/components/map/DetailPanel.tsx command-center-app/src/components/map/MapPageClient.tsx
git commit -m "feat(bookmarks): add BookmarksBar, pin/unpin in DetailPanel"
```

---

## Feature F: Export (shared_views)

### Doel
Exporteer de Intelligence Map als deelbare snapshot (24u link) of als PNG screenshot. Handig voor rapportages en delen met externen.

### Database (bestaand)
Tabel `shared_views` met: `type`, `token`, `data_snapshot` (jsonb), `expires_at`.

---

### Task F1: Server-side functies + API route voor export

**Files:**
- Create: `command-center-app/src/lib/export.ts`
- Create: `command-center-app/src/app/api/export/route.ts`

**Step 1: Maak export functies**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

type Supabase = SupabaseClient<any, any, any>

let supabase: Supabase

function getClient(): Supabase {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (url: string | URL | Request, init?: RequestInit) =>
            fetch(url, { ...init, cache: 'no-store' }),
        },
      }
    )
  }
  return supabase
}

export interface SharedView {
  id: string
  type: 'map' | 'project' | 'comparison'
  token: string
  data_snapshot: unknown
  expires_at: string
  created_at: string
}

export async function createSharedView(
  type: SharedView['type'],
  dataSnapshot: unknown
): Promise<{ token: string; expiresAt: string } | null> {
  const db = getClient()
  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error } = await db.from('shared_views').insert({
    type,
    token,
    data_snapshot: dataSnapshot,
    expires_at: expiresAt,
  })

  if (error) return null
  return { token, expiresAt }
}

export async function getSharedView(token: string): Promise<SharedView | null> {
  const db = getClient()
  const { data } = await db
    .from('shared_views')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  return data as SharedView | null
}
```

**Step 2: Maak de API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSharedView, getSharedView } from '@/lib/export'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json({ error: 'type and data are required' }, { status: 400 })
    }

    const result = await createSharedView(type, data)
    if (!result) {
      return NextResponse.json({ error: 'Failed to create shared view' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      expiresAt: result.expiresAt,
      shareUrl: `/shared/${result.token}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'token query param required' }, { status: 400 })
  }

  try {
    const view = await getSharedView(token)
    if (!view) {
      return NextResponse.json({ error: 'View not found or expired' }, { status: 404 })
    }
    return NextResponse.json(view)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}
```

**Step 3: Verifieer TypeScript**

Run: `cd command-center-app && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**
```bash
git add command-center-app/src/lib/export.ts command-center-app/src/app/api/export/route.ts
git commit -m "feat(export): add shared views creation and retrieval"
```

---

### Task F2: ExportMenu component + integratie in QuickActions

**Files:**
- Create: `command-center-app/src/components/map/ExportMenu.tsx`
- Modify: `command-center-app/src/components/map/QuickActions.tsx`

**Step 1: Maak ExportMenu**

```typescript
'use client'

import { useState } from 'react'
import { Share2, Image, Link, Check, Loader2 } from 'lucide-react'
import type { MapData } from '@/types'

interface ExportMenuProps {
  data: MapData
}

export default function ExportMenu({ data }: ExportMenuProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const createShareLink = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'map',
          data: {
            nodes: data.nodes.length,
            edges: data.edges.length,
            clusters: data.clusters.map((c) => ({ name: c.name, memberCount: c.memberCount })),
            insights: data.insights.length,
            generatedAt: new Date().toISOString(),
          },
        }),
      })
      const result = await res.json()
      if (result.success) {
        const fullUrl = `${window.location.origin}${result.shareUrl}`
        setShareUrl(fullUrl)
        await navigator.clipboard.writeText(fullUrl)
        setStatus('success')
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const exportPng = () => {
    // Zoek het canvas element van react-force-graph
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `intelligence-map-${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-1">
      <button
        onClick={createShareLink}
        disabled={status === 'loading'}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {status === 'loading' ? (
          <Loader2 className="h-3.5 w-3.5 text-zinc-400 animate-spin" />
        ) : status === 'success' ? (
          <Check className="h-3.5 w-3.5 text-zinc-400" />
        ) : (
          <Link className="h-3.5 w-3.5 text-zinc-400" />
        )}
        <span className="text-zinc-600 dark:text-zinc-300">
          {status === 'success' ? 'Link gekopieerd!' : 'Deelbare link (24u)'}
        </span>
      </button>
      <button
        onClick={exportPng}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <Image className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-zinc-600 dark:text-zinc-300">Export als PNG</span>
      </button>
    </div>
  )
}
```

**Step 2: Voeg export opties toe aan QuickActions FAB**

In `QuickActions.tsx`, voeg ExportMenu items toe aan het menu (onder bestaande scan/sync knoppen), of maak een aparte share knop.

**Step 3: Verifieer TypeScript + build**

Run: `cd command-center-app && npx tsc --noEmit && npm run build`
Expected: PASS

**Step 4: Commit**
```bash
git add command-center-app/src/components/map/ExportMenu.tsx command-center-app/src/components/map/QuickActions.tsx
git commit -m "feat(export): add ExportMenu with share link and PNG export"
```

---

## Feature G: API Route Extractie (project_api_routes)

### Doel
Detecteer automatisch alle API routes in een Next.js project via de MCP server (ts-morph). Toon ze in het project dossier.

### Database (bestaand)
Tabel `project_api_routes` met: `project`, `path`, `method`, `auth_type`, `params`, `response_type`, `file_path`, `line_start`, `tables_used`.

---

### Task G1: API route extractor in MCP server

**Files:**
- Create: `cc-v2-mcp/src/analyzer/api-routes.ts`
- Modify: `cc-v2-mcp/src/analyzer/index.ts`
- Modify: `cc-v2-mcp/src/lib/types.ts`
- Modify: `cc-v2-mcp/src/lib/storage.ts`

**Step 1: Maak de extractor**

```typescript
import { Project, SourceFile } from 'ts-morph'
import path from 'path'

export interface ApiRoute {
  path: string
  method: string
  auth_type: string
  params: Record<string, string>
  response_type: string
  file_path: string
  line_start: number
  tables_used: string[]
}

// HTTP methoden die Next.js App Router exporteert
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export function extractApiRoutes(project: Project, projectRoot: string): ApiRoute[] {
  const routes: ApiRoute[] = []

  // Zoek alle route.ts bestanden in app/api/
  const routeFiles = project.getSourceFiles().filter((sf) => {
    const filePath = sf.getFilePath()
    return filePath.includes('/app/api/') && path.basename(filePath).startsWith('route.')
  })

  for (const file of routeFiles) {
    const filePath = file.getFilePath()
    const relativePath = path.relative(projectRoot, filePath)

    // Bepaal API pad uit bestandspad
    const apiPath = deriveApiPath(relativePath)

    // Zoek geexporteerde HTTP method functies
    for (const method of HTTP_METHODS) {
      const funcDecl = file.getFunction(method)
      const varDecl = file.getVariableDeclaration(method)

      if (!funcDecl && !varDecl) continue

      const lineStart = funcDecl
        ? funcDecl.getStartLineNumber()
        : varDecl
          ? varDecl.getStartLineNumber()
          : 1

      // Detecteer auth type
      const fileText = file.getFullText()
      const authType = detectAuthType(fileText)

      // Detecteer Supabase tabellen
      const tablesUsed = detectTablesUsed(fileText)

      routes.push({
        path: apiPath,
        method,
        auth_type: authType,
        params: {},
        response_type: 'json',
        file_path: relativePath,
        line_start: lineStart,
        tables_used: tablesUsed,
      })
    }
  }

  return routes
}

function deriveApiPath(filePath: string): string {
  // src/app/api/sync/deep-scan/route.ts → /api/sync/deep-scan
  const match = filePath.match(/app\/(api\/.+?)\/route\./)
  if (!match) return '/api/unknown'

  let apiPath = '/' + match[1]

  // Converteer [param] naar :param
  apiPath = apiPath.replace(/\[([^\]]+)\]/g, ':$1')

  return apiPath
}

function detectAuthType(fileText: string): string {
  if (fileText.includes('x-api-key') || fileText.includes('SYNC_API_KEY')) return 'api_key'
  if (fileText.includes('Authorization') || fileText.includes('Bearer')) return 'bearer'
  if (fileText.includes('getSession') || fileText.includes('auth()')) return 'session'
  return 'none'
}

function detectTablesUsed(fileText: string): string[] {
  const tables = new Set<string>()

  // Zoek .from('table_name') patronen
  const fromMatches = fileText.matchAll(/\.from\(['"]([a-z_]+)['"]\)/g)
  for (const m of fromMatches) {
    tables.add(m[1])
  }

  return Array.from(tables)
}
```

**Step 2: Integreer in analyzer/index.ts**

Voeg `extractApiRoutes()` toe aan de `analyzeProject()` orchestrator. Sla resultaten op in `project_api_routes`.

**Step 3: Update types en storage**

In `types.ts`: voeg `ApiRoute` toe aan `AnalysisResult`.
In `storage.ts`: voeg DELETE + INSERT voor `project_api_routes` toe.

**Step 4: Verifieer TypeScript**

Run: `cd cc-v2-mcp && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**
```bash
git add cc-v2-mcp/src/analyzer/api-routes.ts cc-v2-mcp/src/analyzer/index.ts cc-v2-mcp/src/lib/types.ts cc-v2-mcp/src/lib/storage.ts
git commit -m "feat(api-routes): add Next.js API route extraction to MCP server"
```

---

### Task G2: Dashboard query + component voor API routes

**Files:**
- Modify: `command-center-app/src/lib/code-intel.ts`
- Create: `command-center-app/src/components/code-intel/ApiRoutesTab.tsx`
- Modify: `command-center-app/src/app/(dashboard)/projects/[slug]/page.tsx`

**Step 1: Voeg query functie toe aan code-intel.ts**

```typescript
export async function getProjectApiRoutes(project: string) {
  const db = getClient()
  const { data } = await db
    .from('project_api_routes')
    .select('*')
    .eq('project', project)
    .order('path')

  return data || []
}
```

**Step 2: Maak ApiRoutesTab component**

```typescript
'use client'

import { useState } from 'react'
import { Route, Shield, Database, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface ApiRoute {
  id: string
  path: string
  method: string
  auth_type: string
  file_path: string | null
  line_start: number | null
  tables_used: string[]
}

interface ApiRoutesTabProps {
  routes: ApiRoute[]
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
  POST: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200',
  PUT: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200',
  PATCH: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200',
  DELETE: 'bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-100',
}

const AUTH_LABELS: Record<string, string> = {
  none: 'Geen',
  api_key: 'API Key',
  bearer: 'Bearer Token',
  session: 'Sessie',
}

export default function ApiRoutesTab({ routes }: ApiRoutesTabProps) {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)

  if (routes.length === 0) {
    return (
      <div className="text-center py-8">
        <Route className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Geen API routes gedetecteerd.</p>
        <p className="text-xs text-zinc-400 mt-1">
          Draai eerst een code-analyse om routes te detecteren.
        </p>
      </div>
    )
  }

  // Groepeer per basis-pad
  const grouped = new Map<string, ApiRoute[]>()
  for (const route of routes) {
    const base = route.path.split('/').slice(0, 3).join('/')
    const existing = grouped.get(base) || []
    existing.push(route)
    grouped.set(base, existing)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            API Routes ({routes.length})
          </h3>
        </div>
      </div>

      {Array.from(grouped.entries()).map(([base, groupRoutes]) => (
        <div
          key={base}
          className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{base}</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {groupRoutes.map((route) => {
              const key = `${route.method}:${route.path}`
              const isExpanded = expandedRoute === key

              return (
                <div key={key}>
                  <button
                    onClick={() => setExpandedRoute(isExpanded ? null : key)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span
                      className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                        METHOD_COLORS[route.method] || METHOD_COLORS.GET
                      }`}
                    >
                      {route.method}
                    </span>
                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-200 flex-1 truncate">
                      {route.path}
                    </span>
                    {route.auth_type !== 'none' && (
                      <Shield className="h-3 w-3 text-zinc-400" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-zinc-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Shield className="h-3 w-3 text-zinc-400" />
                        <span className="text-zinc-400">Auth:</span>
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {AUTH_LABELS[route.auth_type] || route.auth_type}
                        </span>
                      </div>
                      {route.tables_used.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Database className="h-3 w-3 text-zinc-400" />
                          <span className="text-zinc-400">Tabellen:</span>
                          <div className="flex flex-wrap gap-1">
                            {route.tables_used.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {route.file_path && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                          <span className="text-zinc-400 font-mono truncate">
                            {route.file_path}
                            {route.line_start ? `:${route.line_start}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 3: Integreer als tab in project detail page**

In `projects/[slug]/page.tsx`:
- Voeg `getProjectApiRoutes(slug)` toe aan parallel fetch
- Voeg "API Routes" tab toe (alleen zichtbaar als er routes zijn)
- Render `<ApiRoutesTab routes={apiRoutes} />`

**Step 4: Verifieer TypeScript + build**

Run: `cd command-center-app && npx tsc --noEmit && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add command-center-app/src/lib/code-intel.ts command-center-app/src/components/code-intel/ApiRoutesTab.tsx command-center-app/src/app/\(dashboard\)/projects/\[slug\]/page.tsx
git commit -m "feat(api-routes): add ApiRoutesTab to project detail page"
```

---

## Feature H: CLAUDE.md en documentatie update

### Task H1: Update CLAUDE.md met alle nieuwe features

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Voeg toe aan Directory Structuur sectie:**
- `lib/costs.ts`, `lib/usage.ts`, `lib/timeline.ts`, `lib/comparison.ts`, `lib/bookmarks.ts`, `lib/export.ts`
- `components/map/CostsDashboard.tsx`, `UsagePanel.tsx`, `TimelineView.tsx`, `ComparisonView.tsx`, `BookmarksBar.tsx`, `ExportMenu.tsx`
- `components/code-intel/ApiRoutesTab.tsx`
- `app/api/costs/`, `app/api/usage/`, `app/api/comparison/`, `app/api/bookmarks/`, `app/api/export/`

**Step 2: Voeg toe aan Supabase Schema sectie:**

Onder "Intelligence Map & Deep Scan":
```markdown
| `service_costs` | Maandelijkse kosten per dienst/project per periode |
| `usage_statistics` | Gebruiksfrequentie per entity per periode |
| `user_bookmarks` | Gepinde items voor snelle toegang |
| `shared_views` | Deelbare snapshots met 24u expiry |
| `entity_versions` | Versiegeschiedenis per item (tijdlijn) |
| `project_api_routes` | Auto-gedetecteerde API routes per project |
```

**Step 3: Update Intelligence Map sectie:**

Voeg toe aan componenten tabel:
```markdown
| `CostsDashboard.tsx` | Kosten per dienst/project met trend |
| `UsagePanel.tsx` | Gebruiksrankings en ongebruikte items |
| `TimelineView.tsx` | Chronologische wijzigingstijdlijn |
| `ComparisonView.tsx` | Naast-elkaar project vergelijking |
| `BookmarksBar.tsx` | Gepinde items quick access bar |
| `ExportMenu.tsx` | Deelbare link + PNG export |
```

**Step 4: Update Dashboard Tabs tabel:**

Voeg toe:
```markdown
| API Routes | `ApiRoutesTab.tsx` | Gedetecteerde API endpoints gegroepeerd per pad |
```

**Step 5: Commit**
```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with all new features"
```

---

## Implementatie Volgorde (Aanbevolen)

De features zijn onafhankelijk van elkaar. Aanbevolen volgorde op basis van waarde:

| # | Feature | Taken | Reden |
|---|---------|-------|-------|
| 1 | **G: API Route Extractie** | G1-G2 | Direct bruikbaar, verrijkt bestaande code intelligence |
| 2 | **C: Tijdlijn** | C1-C3 | Geeft context bij wijzigingen, vult entity_versions |
| 3 | **E: Bladwijzers** | E1-E3 | UX verbetering, snel navigeren |
| 4 | **A: Kosten** | A1-A4 | Belangrijk voor portfolio management, maar vereist data input |
| 5 | **B: Gebruik** | B1-B4 | Waardevol maar vereist data verzameling over tijd |
| 6 | **D: Vergelijking** | D1-D3 | Nuttig bij meerdere projecten, profiteert van kosten + usage data |
| 7 | **F: Export** | F1-F2 | Nice-to-have, afhankelijk van andere features |

**Totaal: 20 taken, ~7 commits, ~2600 regels code**

---

## Data Vulling

Sommige features hebben data nodig om nuttig te zijn. Strategieën:

| Feature | Data bron | Hoe vullen |
|---------|-----------|------------|
| Kosten | Handmatig of via API | `POST /api/costs` met maandelijkse dienst-kosten |
| Gebruik | Automatisch of via API | `POST /api/usage` bij elke asset-invocatie |
| Tijdlijn | Deep Scan detectie | entity_versions vullen bij sync/scan wijzigingen |
| API Routes | MCP analyze_project | Automatisch bij code-analyse |

**Aanbeveling:** Bouw eerst een `/log-usage` Claude Code command dat automatisch usage logt bij elke asset-aanroep. Dit vult de usage tabel organisch.
