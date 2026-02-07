# Command Center v2 Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Command Center from a read-only dashboard into an active workspace with project sync, search, notifications, and professional UX.

**Architecture:** 4-phase incremental approach. Phase 1 builds shared UI components (toast, skeletons, error boundaries). Phase 2 adds the inbox sync system. Phase 3 adds global search + notifications. Phase 4 redesigns the homepage and improves existing components.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS v4, Supabase, TypeScript, lucide-react

---

## Phase 1: Foundation (UI Building Blocks)

### Task 1: Design Tokens in globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add semantic colors, priority colors, and animation keyframes**

Add the following at the end of `src/app/globals.css` (after the existing styles):

```css
/* Semantic colors */
:root {
  --color-success: #22c55e;
  --color-success-light: rgba(34, 197, 94, 0.15);
  --color-warning: #f59e0b;
  --color-warning-light: rgba(245, 158, 11, 0.15);
  --color-error: #ef4444;
  --color-error-light: rgba(239, 68, 68, 0.15);
  --color-info: #3b82f6;
  --color-info-light: rgba(59, 130, 246, 0.15);
}

/* Priority colors */
:root {
  --priority-urgent: #ef4444;
  --priority-high: #f97316;
  --priority-medium: #3b82f6;
  --priority-low: #6b7280;
}

/* Animation keyframes */
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slide-in-right {
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-up {
  animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds without errors.

**Step 3: Commit**

```bash
git add command-center-app/src/app/globals.css
git commit -m "feat: add design tokens, priority colors, and animation keyframes"
```

---

### Task 2: Toast System

**Files:**
- Create: `src/components/ui/Toast.tsx`
- Create: `src/components/ui/ToastProvider.tsx`

**Step 1: Create Toast component**

Create `src/components/ui/Toast.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  description?: string
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'border-green-500/20',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'border-red-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'border-blue-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'border-amber-500/20',
  },
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const config = toastConfig[toast.type]
  const Icon = config.icon

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true))

    // Auto-dismiss after 5s
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`
        pointer-events-auto w-80 rounded-xl border ${config.bg}
        glass p-4 shadow-xl transition-all duration-300
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onDismiss(toast.id), 300)
          }}
          className="shrink-0 rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Create ToastProvider**

Create `src/components/ui/ToastProvider.tsx`:

```tsx
'use client'

import { createContext, useContext, useCallback, useState } from 'react'
import { Toast, ToastData, ToastType } from './Toast'

interface ToastInput {
  type: ToastType
  title: string
  description?: string
}

interface ToastContextValue {
  addToast: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...input, id }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container - fixed bottom-right */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
```

**Step 3: Integrate ToastProvider into dashboard layout**

Modify `src/app/(dashboard)/layout.tsx`:

The current layout is a server component. We need to wrap `ShellLayout` with the `ToastProvider`. Since `ToastProvider` is a client component, we wrap it around children inside the existing client `ShellLayout`.

Actually, the better approach: wrap inside `ShellLayout.tsx` since it's already a client component.

Modify `src/components/shell/ShellLayout.tsx` - add the ToastProvider wrapper around the AppShell:

```tsx
// Add import at top:
import { ToastProvider } from '@/components/ui/ToastProvider'

// Wrap return in ToastProvider:
return (
  <ToastProvider>
    <AppShell
      navigationItems={navItemsWithActive}
      user={{ name: 'Shadow' }}
      onNavigate={handleNavigate}
      projects={projects}
      currentProject={currentProject}
    >
      {children}
    </AppShell>
  </ToastProvider>
)
```

**Step 4: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add command-center-app/src/components/ui/Toast.tsx command-center-app/src/components/ui/ToastProvider.tsx command-center-app/src/components/shell/ShellLayout.tsx
git commit -m "feat: add toast notification system with auto-dismiss"
```

---

### Task 3: Skeleton Loaders

**Files:**
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/components/ui/SkeletonCard.tsx`
- Create: `src/app/(dashboard)/loading.tsx`
- Create: `src/app/(dashboard)/registry/loading.tsx`
- Create: `src/app/(dashboard)/tasks/loading.tsx`
- Create: `src/app/(dashboard)/projects/[slug]/loading.tsx`
- Create: `src/app/(dashboard)/settings/loading.tsx`

**Step 1: Create base Skeleton component**

Create `src/components/ui/Skeleton.tsx`:

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 ${className}`}
    />
  )
}
```

**Step 2: Create SkeletonCard component**

Create `src/components/ui/SkeletonCard.tsx`:

```tsx
import { Skeleton } from './Skeleton'

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="h-4 w-2/3 mb-3" />
      <Skeleton className="h-3 w-1/2 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-20" />
      ))}
    </div>
  )
}
```

**Step 3: Create loading.tsx files (Next.js Suspense boundaries)**

Create `src/app/(dashboard)/loading.tsx`:

```tsx
import { SkeletonList, SkeletonStats } from '@/components/ui/SkeletonCard'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-12">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
          <SkeletonList rows={5} />
        </div>
        <div className="mt-12">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
          <SkeletonList rows={4} />
        </div>
        <div className="mt-12">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
          <SkeletonStats />
        </div>
      </div>
    </div>
  )
}
```

Create `src/app/(dashboard)/registry/loading.tsx`:

```tsx
import { SkeletonList } from '@/components/ui/SkeletonCard'

export default function RegistryLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 mb-6" />
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
        <SkeletonList rows={10} />
      </div>
    </div>
  )
}
```

Create `src/app/(dashboard)/tasks/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/Skeleton'

export default function TasksLoading() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800 min-h-[500px] p-3">
            <Skeleton className="h-5 w-20 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Create `src/app/(dashboard)/projects/[slug]/loading.tsx`:

```tsx
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProjectDetailLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-4 w-16 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-8" />
        <SkeletonList rows={6} />
      </div>
    </div>
  )
}
```

Create `src/app/(dashboard)/settings/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <Skeleton className="h-5 w-32" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add command-center-app/src/components/ui/Skeleton.tsx command-center-app/src/components/ui/SkeletonCard.tsx command-center-app/src/app/\(dashboard\)/loading.tsx command-center-app/src/app/\(dashboard\)/registry/loading.tsx command-center-app/src/app/\(dashboard\)/tasks/loading.tsx command-center-app/src/app/\(dashboard\)/projects/\[slug\]/loading.tsx command-center-app/src/app/\(dashboard\)/settings/loading.tsx
git commit -m "feat: add skeleton loaders for all dashboard pages"
```

---

### Task 4: Error Boundaries

**Files:**
- Create: `src/app/(dashboard)/error.tsx`
- Create: `src/app/(dashboard)/registry/error.tsx`
- Create: `src/app/(dashboard)/tasks/error.tsx`
- Create: `src/app/(dashboard)/projects/[slug]/error.tsx`

**Step 1: Create main error boundary**

Create `src/app/(dashboard)/error.tsx`:

```tsx
'use client'

import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Er ging iets mis
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          {error.message || 'Een onverwachte fout is opgetreden.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Probeer opnieuw
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create per-route error pages (same component, re-exported)**

Create `src/app/(dashboard)/registry/error.tsx`:

```tsx
'use client'

export { default } from '../error'
```

Create `src/app/(dashboard)/tasks/error.tsx`:

```tsx
'use client'

export { default } from '../error'
```

Create `src/app/(dashboard)/projects/[slug]/error.tsx`:

```tsx
'use client'

export { default } from '../../error'
```

**Step 3: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add command-center-app/src/app/\(dashboard\)/error.tsx command-center-app/src/app/\(dashboard\)/registry/error.tsx command-center-app/src/app/\(dashboard\)/tasks/error.tsx command-center-app/src/app/\(dashboard\)/projects/\[slug\]/error.tsx
git commit -m "feat: add error boundaries with retry for all dashboard pages"
```

---

### Task 5: Favicon + Meta

**Files:**
- Create: `public/icon.svg`
- Modify: `src/app/layout.tsx`

**Step 1: Create SVG favicon**

Create `public/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#3B82F6"/>
  <path d="M10 8h12a2 2 0 012 2v12a2 2 0 01-2 2H10a2 2 0 01-2-2V10a2 2 0 012-2z" fill="none" stroke="white" stroke-width="1.5"/>
  <path d="M12 14h8M12 18h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

**Step 2: Update root layout metadata**

Modify `src/app/layout.tsx` - replace the metadata export:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Shadow's Command Center",
  description: 'Dashboard for managing Claude Code assets',
  icons: {
    icon: '/icon.svg',
  },
  metadataBase: new URL('https://command-center-app-nine.vercel.app'),
  openGraph: {
    title: "Shadow's Command Center",
    description: 'Dashboard for managing Claude Code assets',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
```

**Step 3: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds. Favicon loads in browser without console error.

**Step 4: Commit**

```bash
git add command-center-app/public/icon.svg command-center-app/src/app/layout.tsx
git commit -m "feat: add SVG favicon and OpenGraph metadata"
```

---

### Task 6: NotificationBadge Component

**Files:**
- Create: `src/components/ui/NotificationBadge.tsx`

**Step 1: Create NotificationBadge component**

Create `src/components/ui/NotificationBadge.tsx`:

```tsx
interface NotificationBadgeProps {
  count: number
  max?: number
}

export function NotificationBadge({ count, max = 9 }: NotificationBadgeProps) {
  if (count <= 0) return null

  const display = count > max ? `${max}+` : String(count)

  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {display}
    </span>
  )
}
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/components/ui/NotificationBadge.tsx
git commit -m "feat: add NotificationBadge component"
```

---

### Task 7: Deploy Phase 1 + Verify

**Step 1: Deploy to Vercel**

Run: `cd command-center-app && npx vercel --prod`
Expected: Deployment succeeds.

**Step 2: Verify in browser**

- Open production URL
- Check: favicon visible in browser tab (no more console 404)
- Check: pages load with skeleton animation before content appears
- Check: no build errors in Vercel dashboard

**Step 3: Commit tag**

```bash
git tag phase-1-foundation
```

---

## Phase 2: Inbox Sync System

### Task 8: Database Migration - inbox_pending table

**Files:**
- Supabase migration (applied via MCP tool or dashboard)

**Step 1: Apply migration via Supabase**

Apply migration `create_inbox_pending`:

```sql
CREATE TABLE inbox_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project TEXT NOT NULL,
  slug TEXT NOT NULL,
  manifest JSONB NOT NULL DEFAULT '{}',
  project_meta JSONB NOT NULL DEFAULT '{}',
  registry_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'synced', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- RLS policies
ALTER TABLE inbox_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on inbox_pending"
ON inbox_pending
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for quick pending lookups
CREATE INDEX idx_inbox_pending_status ON inbox_pending(status);
```

**Step 2: Verify table exists**

Run SQL: `SELECT * FROM inbox_pending LIMIT 1;`
Expected: Empty result set, no error.

**Step 3: Document migration**

No commit needed - migration is managed by Supabase.

---

### Task 9: Add Inbox Types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add inbox-related types at the end of the file**

Add at end of `src/types/index.ts`:

```typescript
// =============================================================================
// INBOX SYNC
// =============================================================================

export type InboxStatus = 'pending' | 'processing' | 'synced' | 'error'

export interface InboxManifest {
  project: string
  slug: string
  scannedAt: string
  counts: Record<string, number>
  totalItems: number
}

export interface InboxPending {
  id: string
  project: string
  slug: string
  manifest: InboxManifest
  project_meta: {
    name: string
    path?: string
    description?: string
    techStack?: string[]
  }
  registry_data: Record<string, unknown[]>
  status: InboxStatus
  created_at: string
  synced_at: string | null
}
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/types/index.ts
git commit -m "feat: add inbox sync types"
```

---

### Task 10: Inbox API Endpoint

**Files:**
- Create: `src/app/api/sync/inbox/route.ts`

**Step 1: Create the inbox API**

Create `src/app/api/sync/inbox/route.ts`:

```tsx
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or SERVICE_ROLE_KEY not configured')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/sync/inbox - Stage inbox data
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.SYNC_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const body = await request.json()
    const { project, slug, manifest, project_meta, registry_data } = body

    if (!project || !slug || !manifest || !registry_data) {
      return NextResponse.json(
        { error: 'Missing required fields: project, slug, manifest, registry_data' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Upsert: replace existing pending entry for same project
    const { error: deleteError } = await supabase
      .from('inbox_pending')
      .delete()
      .eq('slug', slug)
      .eq('status', 'pending')

    if (deleteError) {
      console.error('Delete existing pending error:', deleteError)
    }

    const { data, error } = await supabase
      .from('inbox_pending')
      .insert({
        project,
        slug,
        manifest,
        project_meta: project_meta || {},
        registry_data,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Insert inbox error:', error)
      return NextResponse.json(
        { error: `Failed to stage inbox: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      message: `Project "${project}" staged for sync`,
    })
  } catch (error) {
    console.error('Inbox error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/sync/inbox - Get pending items
export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('inbox_pending')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch inbox error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ pending: data || [] })
  } catch (error) {
    console.error('Inbox GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/app/api/sync/inbox/route.ts
git commit -m "feat: add inbox staging API endpoint"
```

---

### Task 11: Inbox Process API Endpoint

**Files:**
- Create: `src/app/api/sync/inbox/process/route.ts`

**Step 1: Create the process endpoint**

Create `src/app/api/sync/inbox/process/route.ts`:

```tsx
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or SERVICE_ROLE_KEY not configured')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/sync/inbox/process - Process pending inbox items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { id } = body // Optional: process specific item

    const supabase = getSupabase()

    // Fetch pending items
    let query = supabase
      .from('inbox_pending')
      .select('*')
      .eq('status', 'pending')

    if (id) {
      query = query.eq('id', id)
    }

    const { data: pendingItems, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!pendingItems || pendingItems.length === 0) {
      return NextResponse.json({ message: 'No pending items', processed: 0 })
    }

    const results = []

    for (const item of pendingItems) {
      // Mark as processing
      await supabase
        .from('inbox_pending')
        .update({ status: 'processing' })
        .eq('id', item.id)

      try {
        const registryData = item.registry_data as Record<string, unknown[]>
        let totalSynced = 0

        // Process each type in the registry data
        for (const [type, items] of Object.entries(registryData)) {
          if (!Array.isArray(items) || items.length === 0) continue

          // Delete existing items for this type + project
          await supabase
            .from('registry_items')
            .delete()
            .eq('type', type)
            .eq('project', item.project)

          // Transform and insert
          const dbItems = items.map((regItem: Record<string, unknown>) => {
            const { id: originalId, name, path, description, created, project, tags, ...metadata } = regItem as {
              id?: string; name: string; path: string; description?: string;
              created?: string; project?: string; tags?: string[];
              [key: string]: unknown
            }

            return {
              id: randomUUID(),
              type,
              name: name || 'unnamed',
              path: path || '',
              description: (description as string) || null,
              project: item.project,
              tags: (tags as string[]) || [],
              metadata: { ...metadata, originalId },
              created_at: created ? new Date(created as string).toISOString() : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          })

          const { error: insertError } = await supabase
            .from('registry_items')
            .insert(dbItems)

          if (insertError) {
            console.error(`Insert error for ${type}:`, insertError)
          } else {
            totalSynced += dbItems.length
          }
        }

        // Auto-create project if needed
        const slug = item.slug
        const { data: existingProject } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', slug)
          .limit(1)
          .single()

        if (!existingProject) {
          await supabase.from('projects').insert({
            name: item.project,
            slug,
            description: (item.project_meta as { description?: string })?.description || null,
          })
        }

        // Log to changelog
        await supabase.from('project_changelog').insert({
          project: item.project,
          title: `Inbox sync: ${totalSynced} items`,
          description: `Synced via inbox from dashboard`,
          change_type: 'sync',
          items_affected: [],
          metadata: { source: 'inbox', totalItems: totalSynced },
        })

        // Log activity
        await supabase.from('activity_log').insert({
          item_type: 'sync',
          item_id: null,
          item_name: `${item.project} inbox sync`,
          action: 'synced',
          details: { count: totalSynced, source: 'inbox' },
        })

        // Mark as synced
        await supabase
          .from('inbox_pending')
          .update({ status: 'synced', synced_at: new Date().toISOString() })
          .eq('id', item.id)

        results.push({
          id: item.id,
          project: item.project,
          itemsSynced: totalSynced,
          status: 'synced',
        })
      } catch (processError) {
        console.error(`Error processing ${item.project}:`, processError)

        await supabase
          .from('inbox_pending')
          .update({ status: 'error' })
          .eq('id', item.id)

        results.push({
          id: item.id,
          project: item.project,
          status: 'error',
          error: processError instanceof Error ? processError.message : 'Unknown',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Process inbox error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/app/api/sync/inbox/process/route.ts
git commit -m "feat: add inbox process API to sync pending items to registry"
```

---

### Task 12: InboxPanel Dashboard Component

**Files:**
- Create: `src/components/sync/InboxPanel.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx`

**Step 1: Create InboxPanel component**

Create `src/components/sync/InboxPanel.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox, RefreshCw, Check, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import type { InboxPending } from '@/types'

export function InboxPanel() {
  const [pending, setPending] = useState<InboxPending[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const { addToast } = useToast()

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/sync/inbox')
      const data = await res.json()
      setPending(data.pending || [])
    } catch {
      console.error('Failed to fetch inbox')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const processItem = async (id: string, projectName: string) => {
    setProcessingIds((prev) => new Set(prev).add(id))

    try {
      const res = await fetch('/api/sync/inbox/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()

      if (data.success) {
        const result = data.results?.[0]
        addToast({
          type: 'success',
          title: `${projectName} gesynchroniseerd`,
          description: `${result?.itemsSynced || 0} items verwerkt`,
        })
        // Remove from pending list
        setPending((prev) => prev.filter((p) => p.id !== id))
      } else {
        addToast({ type: 'error', title: 'Sync mislukt', description: data.error })
      }
    } catch {
      addToast({ type: 'error', title: 'Sync mislukt', description: 'Netwerk fout' })
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const processAll = async () => {
    for (const item of pending) {
      await processItem(item.id, item.project)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Inbox laden...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-zinc-500" />
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Inbox</h2>
          {pending.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {pending.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPending}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            title="Ververs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {pending.length > 1 && (
            <button
              onClick={processAll}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Sync All
            </button>
          )}
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="p-6 text-center">
          <Check className="mx-auto h-8 w-8 text-green-400 mb-2" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Inbox is leeg - alles is gesynchroniseerd
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Gebruik <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/connect-project</code> om projecten toe te voegen
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {pending.map((item) => {
            const isProcessing = processingIds.has(item.id)
            const manifest = item.manifest
            const totalItems = manifest?.totalItems || 0

            return (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {item.project}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {totalItems} items
                    {manifest?.scannedAt && ` · Gescand ${new Date(manifest.scannedAt).toLocaleDateString('nl-NL')}`}
                  </p>
                </div>
                <button
                  onClick={() => processItem(item.id, item.project)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Integrate InboxPanel into Settings page**

Modify `src/app/(dashboard)/settings/page.tsx` - add InboxPanel after the Connection Status section and before the Sync Types section.

Add import at top:
```tsx
import { InboxPanel } from '@/components/sync/InboxPanel'
```

Add the InboxPanel after the Connection Status `</div>` (after line 180) and before the Sync Types section (line 182):

```tsx
{/* Inbox Panel */}
<div className="mb-6">
  <InboxPanel />
</div>
```

**Step 3: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add command-center-app/src/components/sync/InboxPanel.tsx command-center-app/src/app/\(dashboard\)/settings/page.tsx
git commit -m "feat: add InboxPanel to settings page for dashboard-driven sync"
```

---

### Task 13: Update /connect-project Command for Inbox

**Files:**
- Modify: `~/.claude/commands/connect-project/COMMAND.md`

**Step 1: Read current COMMAND.md**

Read the current file to understand what it does.

**Step 2: Add inbox writing section**

After the existing registry-writing logic, add a section that also writes to `~/.claude/inbox/[slug]/`:

- `manifest.json` - project name, slug, scan timestamp, item counts
- `project.json` - name, path, description
- `registry/` folder with `agents.json`, `apis.json`, `commands.json`, etc.

This is a Claude Code command that runs in user's terminal, so the exact modification depends on the current command structure. The key addition:

```
After scanning and writing to the registry, ALSO write the data to the inbox folder:

1. Create directory: ~/.claude/inbox/[project-slug]/
2. Write manifest.json:
   {
     "project": "[project-name]",
     "slug": "[project-slug]",
     "scannedAt": "[ISO timestamp]",
     "counts": { "agents": N, "apis": N, ... },
     "totalItems": N
   }
3. Write project.json:
   {
     "name": "[project-name]",
     "path": "[project-path]",
     "description": "[if available]"
   }
4. Create registry/ subdirectory
5. Write each type as registry/[type].json with the items array

Print: "Inbox ready for sync via dashboard"
```

**Step 3: Commit**

```bash
git add ~/.claude/commands/connect-project/COMMAND.md
git commit -m "feat: update connect-project to write inbox data for dashboard sync"
```

---

### Task 14: Sync CLI - Inbox Mode

**Files:**
- Create: `sync-cli/sync-inbox.ts`

**Step 1: Create the inbox sync CLI**

Create `sync-cli/sync-inbox.ts`:

```typescript
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const INBOX_DIR = path.join(os.homedir(), '.claude', 'inbox')
const API_URL = process.env.COMMAND_CENTER_URL || 'https://command-center-app-nine.vercel.app'
const API_KEY = process.env.COMMAND_CENTER_SYNC_KEY

async function syncInbox() {
  if (!API_KEY) {
    console.error('COMMAND_CENTER_SYNC_KEY not set')
    process.exit(1)
  }

  if (!fs.existsSync(INBOX_DIR)) {
    console.log('No inbox directory found. Run /connect-project first.')
    return
  }

  const projects = fs.readdirSync(INBOX_DIR).filter((f) => {
    const manifestPath = path.join(INBOX_DIR, f, 'manifest.json')
    return fs.existsSync(manifestPath)
  })

  if (projects.length === 0) {
    console.log('Inbox is empty.')
    return
  }

  console.log(`Found ${projects.length} project(s) in inbox:`)

  for (const projectSlug of projects) {
    const projectDir = path.join(INBOX_DIR, projectSlug)
    const manifest = JSON.parse(fs.readFileSync(path.join(projectDir, 'manifest.json'), 'utf8'))
    const projectMeta = JSON.parse(fs.readFileSync(path.join(projectDir, 'project.json'), 'utf8'))

    // Read all registry files
    const registryDir = path.join(projectDir, 'registry')
    const registryData: Record<string, unknown[]> = {}

    if (fs.existsSync(registryDir)) {
      for (const file of fs.readdirSync(registryDir)) {
        if (file.endsWith('.json')) {
          const type = file.replace('.json', '')
          const items = JSON.parse(fs.readFileSync(path.join(registryDir, file), 'utf8'))
          if (Array.isArray(items) && items.length > 0) {
            registryData[type] = items
          }
        }
      }
    }

    console.log(`  Syncing: ${manifest.project} (${manifest.totalItems} items)`)

    try {
      const response = await fetch(`${API_URL}/api/sync/inbox`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          project: manifest.project,
          slug: projectSlug,
          manifest,
          project_meta: projectMeta,
          registry_data: registryData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log(`  ✓ Staged: ${manifest.project}`)
        // Update manifest status
        manifest.status = 'staged'
        manifest.stagedAt = new Date().toISOString()
        fs.writeFileSync(
          path.join(projectDir, 'manifest.json'),
          JSON.stringify(manifest, null, 2)
        )
      } else {
        console.error(`  ✗ Failed: ${result.error}`)
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log('\nDone! Open the dashboard Settings page to sync to database.')
}

syncInbox()
```

**Step 2: Add script to sync-cli/package.json**

Ensure `sync-cli/package.json` has a script:
```json
"sync-inbox": "npx tsx sync-inbox.ts"
```

**Step 3: Verify CLI compiles**

Run: `cd sync-cli && npx tsx --check sync-inbox.ts`
Expected: No errors.

**Step 4: Commit**

```bash
git add sync-cli/sync-inbox.ts sync-cli/package.json
git commit -m "feat: add inbox sync CLI for staging projects to dashboard"
```

---

### Task 15: Deploy Phase 2 + End-to-End Test

**Step 1: Deploy to Vercel**

Run: `cd command-center-app && npx vercel --prod`

**Step 2: End-to-end test flow**

1. Run `/connect-project` in a Claude Code project session → inbox directory created
2. Run `sync-cli/sync-inbox.ts` → data staged to `inbox_pending` table
3. Open dashboard Settings page → InboxPanel shows pending project
4. Click "Sync" → items move to `registry_items`, toast appears
5. Verify `GET /api/sync` returns correct counts

**Step 3: Tag**

```bash
git tag phase-2-inbox-sync
```

---

## Phase 3: Search + Notifications

### Task 16: Search API Endpoint

**Files:**
- Create: `src/app/api/search/route.ts`

**Step 1: Create search API**

Create `src/app/api/search/route.ts`:

```tsx
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase not configured')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/search - Return all searchable items in one call
export async function GET() {
  try {
    const supabase = getSupabase()

    const [registryResult, projectsResult, tasksResult] = await Promise.all([
      supabase.from('registry_items').select('id, type, name, description, project'),
      supabase.from('projects').select('id, name, slug, description'),
      supabase.from('kanban_tasks').select('id, title, project, status'),
    ])

    const items = []

    // Registry items
    for (const item of registryResult.data || []) {
      items.push({
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        project: item.project,
        category: 'asset',
        href: `/registry?type=${item.type}&search=${encodeURIComponent(item.name)}`,
      })
    }

    // Projects
    for (const proj of projectsResult.data || []) {
      items.push({
        id: proj.id,
        type: 'project',
        name: proj.name,
        description: proj.description,
        project: proj.name,
        category: 'project',
        href: `/projects/${proj.slug}`,
      })
    }

    // Tasks
    for (const task of tasksResult.data || []) {
      items.push({
        id: task.id,
        type: 'task',
        name: task.title,
        description: null,
        project: task.project,
        category: 'task',
        href: '/tasks',
      })
    }

    // Pages (static)
    const pages = [
      { name: 'Home', href: '/', description: 'Dashboard overview' },
      { name: 'Registry', href: '/registry', description: 'Asset registry' },
      { name: 'Tasks', href: '/tasks', description: 'Kanban board' },
      { name: 'Activity', href: '/activity', description: 'Activity log' },
      { name: 'Settings', href: '/settings', description: 'Sync configuratie' },
    ]
    for (const page of pages) {
      items.push({
        id: `page-${page.href}`,
        type: 'page',
        name: page.name,
        description: page.description,
        project: null,
        category: 'page',
        href: page.href,
      })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ items: [], error: 'Search failed' }, { status: 500 })
  }
}
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/app/api/search/route.ts
git commit -m "feat: add search API endpoint returning all searchable items"
```

---

### Task 17: Search Library (Client-side Fuzzy)

**Files:**
- Create: `src/lib/search.ts`

**Step 1: Create client-side search utility**

Create `src/lib/search.ts`:

```typescript
export interface SearchItem {
  id: string
  type: string
  name: string
  description: string | null
  project: string | null
  category: 'asset' | 'project' | 'task' | 'page'
  href: string
}

/**
 * Simple fuzzy search - matches if all query words appear in name or description
 */
export function fuzzySearch(items: SearchItem[], query: string): SearchItem[] {
  if (!query.trim()) return []

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)

  return items
    .map((item) => {
      const searchText = `${item.name} ${item.description || ''} ${item.project || ''} ${item.type}`.toLowerCase()

      // Check if all words match
      const allMatch = words.every((word) => searchText.includes(word))
      if (!allMatch) return null

      // Score: exact name match = 100, starts with = 50, contains = 10
      let score = 0
      const nameLower = item.name.toLowerCase()
      const queryLower = query.toLowerCase().trim()

      if (nameLower === queryLower) score = 100
      else if (nameLower.startsWith(queryLower)) score = 50
      else if (nameLower.includes(queryLower)) score = 25
      else score = 10

      // Boost pages and projects
      if (item.category === 'page') score += 5
      if (item.category === 'project') score += 3

      return { item, score }
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)
    .slice(0, 20)
    .map((r) => r!.item)
}
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/lib/search.ts
git commit -m "feat: add client-side fuzzy search utility"
```

---

### Task 18: SearchDialog + SearchProvider

**Files:**
- Create: `src/components/search/SearchDialog.tsx`
- Create: `src/components/search/SearchProvider.tsx`
- Modify: `src/components/shell/ShellLayout.tsx`

**Step 1: Create SearchDialog**

Create `src/components/search/SearchDialog.tsx`:

```tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { fuzzySearch, SearchItem } from '@/lib/search'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
}

const categoryIcons: Record<string, string> = {
  asset: 'A',
  project: 'P',
  task: 'T',
  page: '/',
}

const categoryColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  project: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  task: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  page: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [allItems, setAllItems] = useState<SearchItem[]>([])
  const [results, setResults] = useState<SearchItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch all searchable items on open
  useEffect(() => {
    if (isOpen && allItems.length === 0) {
      fetch('/api/search')
        .then((res) => res.json())
        .then((data) => setAllItems(data.items || []))
        .catch(console.error)
    }
  }, [isOpen, allItems.length])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Search on query change
  useEffect(() => {
    setResults(fuzzySearch(allItems, query))
    setSelectedIndex(0)
  }, [query, allItems])

  const handleSelect = useCallback(
    (item: SearchItem) => {
      router.push(item.href)
      onClose()
    },
    [router, onClose]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-zinc-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[20%] z-[91] mx-auto w-full max-w-lg px-4 animate-slide-up">
        <div className="overflow-hidden rounded-2xl glass shadow-2xl">
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-zinc-200/50 px-4 dark:border-zinc-700/50">
            <Search className="h-5 w-5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Zoek assets, projecten, taken..."
              className="flex-1 bg-transparent py-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
            <kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-700 sm:inline">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {query.length > 0 && (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">
                  Geen resultaten voor &ldquo;{query}&rdquo;
                </div>
              ) : (
                results.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium ${
                        categoryColors[item.category]
                      }`}
                    >
                      {categoryIcons[item.category]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {item.type}
                        {item.project && ` · ${item.project}`}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Footer hint */}
          {query.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-zinc-400">
              Begin met typen om te zoeken
            </div>
          )}
        </div>
      </div>
    </>
  )
}
```

**Step 2: Create SearchProvider**

Create `src/components/search/SearchProvider.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { SearchDialog } from './SearchDialog'

interface SearchContextValue {
  openSearch: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearch must be used within SearchProvider')
  return context
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openSearch = useCallback(() => setIsOpen(true), [])
  const closeSearch = useCallback(() => setIsOpen(false), [])

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <SearchDialog isOpen={isOpen} onClose={closeSearch} />
    </SearchContext.Provider>
  )
}
```

**Step 3: Add SearchProvider to ShellLayout**

Modify `src/components/shell/ShellLayout.tsx` - wrap with SearchProvider:

```tsx
// Add import:
import { SearchProvider } from '@/components/search/SearchProvider'

// Update return (wrap ToastProvider content with SearchProvider):
return (
  <ToastProvider>
    <SearchProvider>
      <AppShell
        navigationItems={navItemsWithActive}
        user={{ name: 'Shadow' }}
        onNavigate={handleNavigate}
        projects={projects}
        currentProject={currentProject}
      >
        {children}
      </AppShell>
    </SearchProvider>
  </ToastProvider>
)
```

**Step 4: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add command-center-app/src/components/search/SearchDialog.tsx command-center-app/src/components/search/SearchProvider.tsx command-center-app/src/components/shell/ShellLayout.tsx
git commit -m "feat: add global search dialog with Cmd+K shortcut"
```

---

### Task 19: Search Button in Sidebar

**Files:**
- Modify: `src/components/shell/AppShell.tsx`

**Step 1: Add search button to the header area**

Modify `src/components/shell/AppShell.tsx`:

Add import:
```tsx
import { Search } from 'lucide-react'
import { useSearch } from '@/components/search/SearchProvider'
```

Inside the AppShell component, add:
```tsx
const { openSearch } = useSearch()
```

Add a search button in the desktop sidebar at the very top (before the nav), and in the mobile header:

In the desktop sidebar (`<aside>` element), add before `<div className="flex-1">`:
```tsx
<div className="flex justify-center p-3">
  <button
    onClick={openSearch}
    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
    aria-label="Search (Cmd+K)"
  >
    <Search className="h-5 w-5" strokeWidth={1.5} />
  </button>
</div>
```

In the mobile header, add before `<div className="flex items-center gap-2">`:
```tsx
<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Command Center</span>
```

And add search button in the mobile header gap:
```tsx
<button
  onClick={openSearch}
  className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
  aria-label="Search"
>
  <Search className="h-5 w-5" strokeWidth={1.5} />
</button>
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/components/shell/AppShell.tsx
git commit -m "feat: add search button to sidebar and mobile header"
```

---

### Task 20: Deploy Phase 3 + Test

**Step 1: Deploy to Vercel**

Run: `cd command-center-app && npx vercel --prod`

**Step 2: Verify in browser**

- Press Cmd+K → search dialog opens
- Type "agent" → results show agents + agent-os project
- Arrow keys navigate, Enter selects, Escape closes
- Click search icon in sidebar → same behavior

**Step 3: Tag**

```bash
git tag phase-3-search-notifications
```

---

## Phase 4: UX & Visual Improvements

### Task 21: Color Utility for Projects

**Files:**
- Create: `src/lib/colors.ts`

**Step 1: Create color generator**

Create `src/lib/colors.ts`:

```typescript
/**
 * Generate a consistent HSL color based on a string (project name)
 */
export function getProjectColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 65%, 55%)`
}

/**
 * Get border class with inline style for project color
 */
export function getProjectBorderStyle(name: string): React.CSSProperties {
  return { borderLeftColor: getProjectColor(name) }
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/lib/colors.ts
git commit -m "feat: add deterministic color generator for project names"
```

---

### Task 22: StatCard Component

**Files:**
- Create: `src/components/dashboard/StatCard.tsx`

**Step 1: Create StatCard**

Create `src/components/dashboard/StatCard.tsx`:

```tsx
import Link from 'next/link'

interface StatCardProps {
  label: string
  count: number
  icon: React.ReactNode
  href: string
}

export function StatCard({ label, count, icon, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-zinc-200/50 bg-white/50 px-4 py-3 transition-all duration-300 hover:border-[var(--accent-blue)]/30 hover:bg-white/80 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:border-[var(--accent-blue)]/30 dark:hover:bg-zinc-900/80 glow-blue-hover"
    >
      <span className="text-zinc-400 group-hover:text-[var(--accent-blue)] transition-colors [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[1.5]">
        {icon}
      </span>
      <div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{count}</p>
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
    </Link>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/components/dashboard/StatCard.tsx
git commit -m "feat: add StatCard component for homepage"
```

---

### Task 23: ProjectCard Component

**Files:**
- Create: `src/components/dashboard/ProjectCard.tsx`

**Step 1: Create ProjectCard**

Create `src/components/dashboard/ProjectCard.tsx`:

```tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProjectColor } from '@/lib/colors'

interface ProjectCardProps {
  name: string
  slug: string
  description?: string | null
  itemCount: number
}

export function ProjectCard({ name, slug, description, itemCount }: ProjectCardProps) {
  const color = getProjectColor(name)

  return (
    <Link
      href={`/projects/${slug}`}
      className="group flex items-center gap-3 rounded-xl border-l-[3px] bg-white/50 px-4 py-3 transition-all duration-300 hover:bg-white/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 glow-blue-hover"
      style={{ borderLeftColor: color }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--accent-blue)] transition-colors">
          {name}
        </p>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">{itemCount} items</span>
        <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/components/dashboard/ProjectCard.tsx
git commit -m "feat: add ProjectCard with colored left border"
```

---

### Task 24: QuickActionBar Component

**Files:**
- Create: `src/components/dashboard/QuickActionBar.tsx`

**Step 1: Create QuickActionBar**

Create `src/components/dashboard/QuickActionBar.tsx`:

```tsx
'use client'

import { Search, Plus, RefreshCw } from 'lucide-react'
import { useSearch } from '@/components/search/SearchProvider'
import { useRouter } from 'next/navigation'

export function QuickActionBar() {
  const { openSearch } = useSearch()
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={openSearch}
        className="flex items-center gap-2 rounded-xl border border-zinc-200/50 bg-white/50 px-4 py-2.5 text-sm text-zinc-400 transition-all duration-300 hover:border-[var(--accent-blue)]/30 hover:text-zinc-600 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:border-[var(--accent-blue)]/30 dark:hover:text-zinc-300 flex-1"
      >
        <Search className="h-4 w-4" />
        <span>Zoeken...</span>
        <kbd className="ml-auto hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] dark:border-zinc-700 sm:inline">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => router.push('/tasks')}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Task
      </button>
      <button
        onClick={() => router.push('/settings')}
        className="flex items-center gap-2 rounded-xl border border-zinc-200/50 bg-white/50 px-4 py-2.5 text-sm text-zinc-600 transition-all duration-300 hover:border-[var(--accent-blue)]/30 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-[var(--accent-blue)]/30"
      >
        <RefreshCw className="h-4 w-4" />
        Sync
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add command-center-app/src/components/dashboard/QuickActionBar.tsx
git commit -m "feat: add QuickActionBar with search, task, sync shortcuts"
```

---

### Task 25: Homepage Redesign

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

**Step 1: Rewrite the homepage**

Replace the content of `src/app/(dashboard)/page.tsx` with a grid layout that uses StatCard, ProjectCard, and QuickActionBar:

```tsx
import { Key, MessageSquare, Sparkles, Bot, Terminal, FileText, ArrowRight } from 'lucide-react'
import { getStats, getRecentActivity, getRecentChanges } from '@/lib/registry'
import { getProjectsFromRegistry } from '@/lib/projects'
import Link from 'next/link'
import type { AssetStats } from '@/types'
import { unstable_noStore as noStore } from 'next/cache'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { QuickActionBar } from '@/components/dashboard/QuickActionBar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const assetTypes = [
  { key: 'api', statsKey: 'apis', label: 'APIs', icon: <Key /> },
  { key: 'prompt', statsKey: 'prompts', label: 'Prompts', icon: <MessageSquare /> },
  { key: 'skill', statsKey: 'skills', label: 'Skills', icon: <Sparkles /> },
  { key: 'agent', statsKey: 'agents', label: 'Agents', icon: <Bot /> },
  { key: 'command', statsKey: 'commands', label: 'Commands', icon: <Terminal /> },
  { key: 'instruction', statsKey: 'instructions', label: 'Instructions', icon: <FileText /> },
] as const

interface HomePageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  noStore()
  const { project } = await searchParams
  const [stats, recentActivity, projects, recentChanges] = await Promise.all([
    getStats(project),
    getRecentActivity(project),
    getProjectsFromRegistry(),
    getRecentChanges(5),
  ])

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          {project ? project : 'Command Center'}
        </h1>
        {project && (
          <p className="mt-1 text-sm text-zinc-500">Gefilterd op project</p>
        )}

        {/* Quick Action Bar */}
        {!project && (
          <div className="mt-6">
            <QuickActionBar />
          </div>
        )}

        {/* Stats Grid */}
        <section className="mt-8">
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
            {assetTypes.map((type) => {
              const count = stats[type.statsKey as keyof AssetStats]
              const href = project
                ? `/registry?type=${type.key}&project=${project}`
                : `/registry?type=${type.key}`
              return (
                <StatCard
                  key={type.key}
                  label={type.label}
                  count={count}
                  icon={type.icon}
                  href={href}
                />
              )
            })}
          </div>
        </section>

        {/* Two-column layout: Recent Changes + Projects */}
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {/* Recent Changes */}
          {!project && recentChanges.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                Recent Changes
              </h2>
              <div className="mt-4 space-y-1">
                {recentChanges.map((change) => (
                  <Link
                    key={change.id}
                    href={`/projects/${change.project.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-white/50 dark:hover:bg-zinc-800/30"
                  >
                    <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      change.change_type === 'added' ? 'bg-emerald-500' :
                      change.change_type === 'removed' ? 'bg-red-500' :
                      change.change_type === 'updated' ? 'bg-amber-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--accent-blue)]">
                        {change.title}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {change.project} · {change.relativeTime}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {!project && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                Projects
              </h2>
              <div className="mt-4 space-y-2">
                {projects.length === 0 ? (
                  <p className="text-sm text-zinc-500">No projects yet</p>
                ) : (
                  projects.map((proj) => (
                    <ProjectCard
                      key={proj.name}
                      name={proj.name}
                      slug={proj.slug}
                      description={proj.description}
                      itemCount={proj.itemCount}
                    />
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        {/* Recent Activity */}
        <section className="mt-10">
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
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30"
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

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/app/\(dashboard\)/page.tsx
git commit -m "feat: redesign homepage with StatCards, ProjectCards, QuickActionBar"
```

---

### Task 26: Kanban - Priority Left Border

**Files:**
- Modify: `src/components/kanban/TaskCard.tsx`

**Step 1: Add colored left border based on priority**

Modify `src/components/kanban/TaskCard.tsx`. Add a priority border color map and apply as a left border:

Add at top of file (after existing `priorityColors`):
```tsx
const priorityBorderColors: Record<TaskPriority, string> = {
  low: 'border-l-gray-400',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
}
```

Modify the card's outer div className to include:
```tsx
className={`
  bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
  border-l-[3px] ${priorityBorderColors[task.priority]}
  p-3 cursor-grab active:cursor-grabbing
  hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm
  transition-all duration-150
  ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-400' : ''}
`}
```

**Step 2: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add command-center-app/src/components/kanban/TaskCard.tsx
git commit -m "feat: add priority-colored left border to task cards"
```

---

### Task 27: Kanban - Column Collapse

**Files:**
- Modify: `src/components/kanban/KanbanColumn.tsx`
- Modify: `src/components/kanban/KanbanBoard.tsx`

**Step 1: Add collapse toggle to KanbanColumn**

Modify `src/components/kanban/KanbanColumn.tsx`:

Add `collapsed` and `onToggleCollapse` to the interface:
```tsx
interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (id: string) => void
}
```

Add `ChevronDown` import from lucide-react.

Update the component to accept and use collapse state:
```tsx
export function KanbanColumn({ status, tasks, collapsed, onToggleCollapse, onEditTask, onDeleteTask }: KanbanColumnProps) {
```

In the header, add a toggle button:
```tsx
<div className="p-3 border-b border-gray-200 dark:border-gray-700">
  <div className="flex items-center justify-between">
    <button
      onClick={onToggleCollapse}
      className="flex items-center gap-1"
    >
      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
    </button>
    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
      {tasks.length}
    </span>
  </div>
</div>
```

Wrap the task list with a conditional:
```tsx
{!collapsed && (
  <div className="flex-1 p-2 space-y-2 overflow-y-auto">
    ...existing content...
  </div>
)}
```

**Step 2: Add collapse state to KanbanBoard**

Modify `src/components/kanban/KanbanBoard.tsx`:

Add state for collapsed columns (persisted to localStorage):
```tsx
const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(() => {
  if (typeof window === 'undefined') return new Set()
  try {
    const saved = localStorage.getItem('kanban-collapsed')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  } catch {
    return new Set()
  }
})

const toggleColumn = (status: TaskStatus) => {
  setCollapsedColumns((prev) => {
    const next = new Set(prev)
    if (next.has(status)) next.delete(status)
    else next.add(status)
    localStorage.setItem('kanban-collapsed', JSON.stringify([...next]))
    return next
  })
}
```

Pass props to KanbanColumn:
```tsx
<KanbanColumn
  key={status}
  status={status}
  tasks={getTasksByStatus(status)}
  collapsed={collapsedColumns.has(status)}
  onToggleCollapse={() => toggleColumn(status)}
  onDeleteTask={handleDeleteTask}
/>
```

**Step 3: Verify build**

Run: `cd command-center-app && npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add command-center-app/src/components/kanban/KanbanColumn.tsx command-center-app/src/components/kanban/KanbanBoard.tsx
git commit -m "feat: add collapsible kanban columns with localStorage persistence"
```

---

### Task 28: Deploy Phase 4 + Final Verification

**Step 1: Deploy to Vercel**

Run: `cd command-center-app && npx vercel --prod`

**Step 2: Verify in browser**

- Homepage: grid layout with StatCards, QuickActionBar, ProjectCards
- Project cards: colored left borders
- Kanban: priority borders visible, columns collapse/expand
- Search: Cmd+K opens search from any page
- Toast: appears after sync actions
- Skeletons: visible during page transitions
- Error boundaries: trigger by navigating to invalid route
- Favicon: visible in browser tab

**Step 3: Final tag**

```bash
git tag phase-4-ux-improvements
git tag v0.2.0
```

---

## Summary of All Files

### New Files (28)

| # | File | Phase |
|---|------|-------|
| 1 | `src/components/ui/Toast.tsx` | 1 |
| 2 | `src/components/ui/ToastProvider.tsx` | 1 |
| 3 | `src/components/ui/Skeleton.tsx` | 1 |
| 4 | `src/components/ui/SkeletonCard.tsx` | 1 |
| 5 | `src/components/ui/NotificationBadge.tsx` | 1 |
| 6 | `src/app/(dashboard)/error.tsx` | 1 |
| 7 | `src/app/(dashboard)/registry/error.tsx` | 1 |
| 8 | `src/app/(dashboard)/tasks/error.tsx` | 1 |
| 9 | `src/app/(dashboard)/projects/[slug]/error.tsx` | 1 |
| 10 | `src/app/(dashboard)/loading.tsx` | 1 |
| 11 | `src/app/(dashboard)/registry/loading.tsx` | 1 |
| 12 | `src/app/(dashboard)/tasks/loading.tsx` | 1 |
| 13 | `src/app/(dashboard)/projects/[slug]/loading.tsx` | 1 |
| 14 | `src/app/(dashboard)/settings/loading.tsx` | 1 |
| 15 | `public/icon.svg` | 1 |
| 16 | `src/app/api/sync/inbox/route.ts` | 2 |
| 17 | `src/app/api/sync/inbox/process/route.ts` | 2 |
| 18 | `src/components/sync/InboxPanel.tsx` | 2 |
| 19 | `sync-cli/sync-inbox.ts` | 2 |
| 20 | `src/app/api/search/route.ts` | 3 |
| 21 | `src/lib/search.ts` | 3 |
| 22 | `src/components/search/SearchDialog.tsx` | 3 |
| 23 | `src/components/search/SearchProvider.tsx` | 3 |
| 24 | `src/lib/colors.ts` | 4 |
| 25 | `src/components/dashboard/StatCard.tsx` | 4 |
| 26 | `src/components/dashboard/ProjectCard.tsx` | 4 |
| 27 | `src/components/dashboard/QuickActionBar.tsx` | 4 |

### Modified Files (9)

| # | File | Phase | What |
|---|------|-------|------|
| 1 | `src/app/globals.css` | 1 | Design tokens, animations |
| 2 | `src/app/layout.tsx` | 1 | Favicon, metadata |
| 3 | `src/components/shell/ShellLayout.tsx` | 1,3 | Toast + Search providers |
| 4 | `src/types/index.ts` | 2 | Inbox types |
| 5 | `src/app/(dashboard)/settings/page.tsx` | 2 | InboxPanel |
| 6 | `src/components/shell/AppShell.tsx` | 3 | Search button |
| 7 | `src/app/(dashboard)/page.tsx` | 4 | Homepage redesign |
| 8 | `src/components/kanban/TaskCard.tsx` | 4 | Priority borders |
| 9 | `src/components/kanban/KanbanColumn.tsx` | 4 | Collapse |
| 10 | `src/components/kanban/KanbanBoard.tsx` | 4 | Collapse state |

### Database Migrations (1)

| Migration | Phase |
|-----------|-------|
| `create_inbox_pending` | 2 |
