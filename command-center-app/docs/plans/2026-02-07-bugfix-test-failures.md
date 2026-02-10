# Bugfix: 3 Test Failures Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 3 issues found during comprehensive testing: dark mode priority borders, glass morphism stripped in build, and missing toast on sync refresh.

**Architecture:** Three isolated fixes in three separate files. No shared state, no cross-dependencies. Each fix is a Tailwind CSS or one-line code change.

**Tech Stack:** Next.js 14, Tailwind CSS v4, React hooks

---

## Context

108 tests were executed across 10 domains. 105 passed, 3 failed:

| Test | File | Issue |
|------|------|-------|
| T16 - Priority Border Colors | `src/components/kanban/TaskCard.tsx:56-57` | `dark:border-gray-700` overrides `border-l-{color}` in dark mode |
| T17 - Glass Morphism | `src/app/globals.css:54-59` | `backdrop-filter` stripped from `.glass` class in production build |
| T69 - Toast on Sync Refresh | `src/app/(dashboard)/settings/page.tsx:92-96` | `handleRefresh` doesn't dispatch a toast notification |

---

### Task 1: Fix priority border colors in dark mode

**Files:**
- Modify: `src/components/kanban/TaskCard.tsx:20-25`

**Problem:** The card has `border border-gray-200 dark:border-gray-700` on line 56, which sets ALL borders including border-left. Then `border-l-[3px] ${priorityBorderColors[task.priority]}` on line 57 sets the left border color. But in dark mode, `dark:border-gray-700` overrides the left border color because Tailwind generates the dark variant with equal or higher specificity.

**Root cause:** `dark:border-gray-700` applies to all 4 sides, overriding the left-border-specific color.

**Step 1: Add dark mode variants to priorityBorderColors**

Change `priorityBorderColors` (lines 20-25) from:

```typescript
const priorityBorderColors: Record<TaskPriority, string> = {
  low: 'border-l-gray-400',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
}
```

To:

```typescript
const priorityBorderColors: Record<TaskPriority, string> = {
  low: 'border-l-gray-400 dark:border-l-gray-400',
  medium: 'border-l-blue-500 dark:border-l-blue-500',
  high: 'border-l-orange-500 dark:border-l-orange-500',
  urgent: 'border-l-red-500 dark:border-l-red-500',
}
```

This ensures the dark: variant of border-left-color is explicitly set, so it won't be overridden by `dark:border-gray-700`.

**Step 2: Run build to verify**

Run: `cd "C:\Users\Shadow\Projects\command-center-v2\command-center-app" && npm run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add src/components/kanban/TaskCard.tsx
git commit -m "fix: priority border colors not visible in dark mode

dark:border-gray-700 was overriding border-l-{color} classes.
Added explicit dark: variants to priorityBorderColors map.

Test: P1.T16"
```

---

### Task 2: Fix glass morphism stripped in production build

**Files:**
- Modify: `src/app/globals.css:54-59`

**Problem:** The `.glass` class uses `backdrop-filter: blur(var(--glass-blur))` but this is stripped during the Tailwind CSS v4 production build. The compiled CSS only contains `background` and `border`, not `backdrop-filter`.

**Root cause:** Tailwind CSS v4 processes all CSS through its engine. The `var()` inside `blur()` inside `backdrop-filter` may not be recognized. The `glass-subtle` class on lines 61-65 uses a hardcoded `blur(12px)` value and may also be affected.

**Step 1: Replace custom CSS with Tailwind utility approach**

Change the `.glass` class (lines 54-59) from:

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}
```

To:

```css
.glass {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(30px);
  backdrop-filter: blur(30px);
  border: 1px solid var(--glass-border);
}
```

This hardcodes the blur value (30px, same as `--glass-blur`) which Tailwind's build process won't strip.

**Step 2: Run build to verify**

Run: `cd "C:\Users\Shadow\Projects\command-center-v2\command-center-app" && npm run build`
Expected: Build succeeds, `.glass` class retains `backdrop-filter` in output

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "fix: glass morphism backdrop-filter stripped in production build

Tailwind CSS v4 build was stripping backdrop-filter with var() values.
Replaced var(--glass-blur) with hardcoded 30px value.

Test: P1.T17"
```

---

### Task 3: Add toast notification on sync refresh

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx:1-4,92-96`

**Problem:** The `handleRefresh` function (lines 92-96) calls `fetchStatus()` but doesn't provide any visual feedback via a toast notification. The toast system (`useToast` / `addToast`) is already used by `InboxPanel` but not by the settings page itself.

**Step 1: Import useToast and add toast dispatch**

Add import on line 4 (after existing imports):

```typescript
import { useToast } from '@/components/ui/ToastProvider'
```

Add hook usage inside the component, after existing state declarations (after line 43):

```typescript
const { addToast } = useToast()
```

Change `handleRefresh` (lines 92-96) from:

```typescript
const handleRefresh = async () => {
  setIsSyncing(true)
  await fetchStatus()
  setIsSyncing(false)
}
```

To:

```typescript
const handleRefresh = async () => {
  setIsSyncing(true)
  await fetchStatus()
  setIsSyncing(false)
  addToast({ type: 'success', title: 'Status vernieuwd' })
}
```

**Step 2: Run build to verify**

Run: `cd "C:\Users\Shadow\Projects\command-center-v2\command-center-app" && npm run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add src/app/(dashboard)/settings/page.tsx
git commit -m "fix: add toast notification on sync refresh

handleRefresh now dispatches a success toast after fetching status.

Test: P1.T69"
```

---

## Verification

After all 3 tasks, deploy to Vercel and re-run the 3 failed tests:

1. **T16**: Navigate to `/tasks` in dark mode, verify task cards have colored left borders (gray/blue/orange/red)
2. **T17**: Evaluate `getComputedStyle(sidebar).backdropFilter` - should contain `blur(30px)`
3. **T69**: Click "Ververs" on `/settings`, verify toast notification appears

Run: `git push origin master` to trigger Vercel deployment.
