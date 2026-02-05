# Command Center App - Complete Inventory

**Generated**: 2026-02-04
**Framework**: Next.js 14.2.21 (App Router)
**Database**: Supabase
**Language**: TypeScript 5.7.2

---

## 1. UI COMPONENTS

### 1.1 Shell Components (`src/components/shell/`)

| Component | File | Lines | Purpose | Interactive Elements |
|-----------|------|-------|---------|---------------------|
| AppShell | AppShell.tsx | 1-86 | Main layout wrapper | Mobile menu toggle (Menu/X icons) |
| MainNav | MainNav.tsx | 1-49 | Navigation with tooltips | Nav item buttons (4), hover tooltips |
| ProjectSwitcher | ProjectSwitcher.tsx | 1-87 | Project filter dropdown | Dropdown button, project list buttons |
| UserMenu | UserMenu.tsx | 1-102 | User menu + dark mode | Dark mode toggle (Sun/Moon), sign out |
| ShellLayout | ShellLayout.tsx | 1-58 | Layout wrapper | None (server component) |

### 1.2 Page Components

| Page | File | Route | Interactive Elements |
|------|------|-------|---------------------|
| Home | `src/app/(dashboard)/page.tsx` | `/` | Asset links (6), Project links |
| Registry | `src/app/(dashboard)/registry/page.tsx` | `/registry` | Type filter tabs (7) |
| Activity | `src/app/(dashboard)/activity/page.tsx` | `/activity` | Type filters (5), Period filters (4) |
| Settings | `src/app/(dashboard)/settings/page.tsx` | `/settings` | Refresh button |
| ProjectDetail | `src/app/(dashboard)/projects/[slug]/page.tsx` | `/projects/{slug}` | Back link |

---

## 2. API ENDPOINTS

### 2.1 Sync API (`src/app/api/sync/route.ts`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/sync` | None | Fetch sync status & stats |
| POST | `/api/sync` | `x-api-key` header | Sync registry items to Supabase |

#### GET /api/sync (Lines 143-187)
```typescript
// Response
interface SyncStatusResponse {
  connected: boolean
  stats: Record<string, number>  // { api: 1, agent: 15, ... }
  lastSynced: Record<string, string>
  error?: string
}
```

#### POST /api/sync (Lines 38-140)
```typescript
// Request
interface SyncPayload {
  type: 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction'
  items: RegistryItem[]
}

// Response
{ success: true, type: string, count: number, message: string }
```

**Database Operations**:
1. DELETE from `registry_items` where type = :type
2. INSERT into `registry_items` (batch)
3. INSERT into `activity_log` (sync event)

---

## 3. DATA FETCHING FUNCTIONS (`src/lib/registry.ts`)

| Function | Line | Returns | Query |
|----------|------|---------|-------|
| getAgents | ~60 | AgentListItem[] | `registry_items` where type='agent' |
| getCommands | ~85 | CommandCategory[] | `registry_items` where type='command' |
| getSkills | ~120 | SkillListItem[] | `registry_items` where type='skill' |
| getPrompts | ~145 | PromptListItem[] | `registry_items` where type='prompt' |
| getApis | ~170 | ApiListItem[] | `registry_items` where type='api' |
| getInstructions | ~195 | InstructionListItem[] | `registry_items` where type='instruction' |
| getProjects | ~220 | string[] | Distinct projects from `registry_items` |
| getStats | ~240 | AssetStats | All counts aggregated |
| getRecentActivity | ~265 | ActivityItem[] | `activity_log` limit 10 |

---

## 4. USER INTERACTIONS

### 4.1 Navigation
| Interaction | Component | Handler | Result |
|-------------|-----------|---------|--------|
| Click nav item | MainNav | `onNavigate(href)` | Route change |
| Click project dropdown | ProjectSwitcher | `setIsOpen(true)` | Show dropdown |
| Select project | ProjectSwitcher | URL param update | Filter items |
| Click "All" | ProjectSwitcher | Remove project param | Show all |
| Toggle dark mode | UserMenu | `setDarkMode(!darkMode)` | Theme change + localStorage |

### 4.2 Page Interactions
| Page | Interaction | Element | Result |
|------|-------------|---------|--------|
| Home | Click asset card | Link to `/registry?type=X` | Navigate to filtered registry |
| Home | Click project card | Link to `/projects/{slug}` | Navigate to project detail |
| Registry | Click type tab | Link with `?type=X` | Filter items by type |
| Activity | Click type filter | Button | Filter local state |
| Activity | Click period filter | Button | Filter local state |
| Settings | Click refresh | Button | Fetch `/api/sync` |
| ProjectDetail | Click back | Link | Navigate to home |

### 4.3 Forms
**Note**: No user-editable forms exist in current version. All data is read-only.

---

## 5. EDGE CASES

### 5.1 Empty States
| Page | Condition | Display |
|------|-----------|---------|
| Home | No activity | "No activity yet" message |
| Registry | No items for type | "No items found" message |
| Activity | No matching filters | "No activity" + Activity icon |
| Settings | Connection error | Red error box with message |

### 5.2 Loading States
| Page | State Variable | Display |
|------|----------------|---------|
| Settings | `isLoading` | Loader2 spinner icon |
| Settings | `isSyncing` | Disabled refresh button |
| Dashboard | Suspense | ShellSkeleton component |

### 5.3 Error States
| Endpoint | Error | Response |
|----------|-------|----------|
| GET /api/sync | DB error | `{ connected: false, error: message }` |
| POST /api/sync | Missing type/items | 400 + error message |
| POST /api/sync | Invalid API key | 401 + "Invalid API key" |
| POST /api/sync | Delete fails | 500 + error message |
| POST /api/sync | Insert fails | 500 + error message |

### 5.4 404 States
| Route | Condition | Result |
|-------|-----------|--------|
| `/projects/{slug}` | Project not found | `notFound()` → 404 page |

---

## 6. DEPENDENCIES

### 6.1 Component Dependencies

```
ShellLayout
├── AppShell
│   ├── MainNav
│   └── ProjectSwitcher
└── UserMenu

HomePage
├── getStats()
├── getRecentActivity()
└── getProjects()

RegistryPage
├── getApis()
├── getPrompts()
├── getSkills()
├── getAgents()
├── getCommands()
└── getInstructions()

SettingsPage
└── fetch('/api/sync')

ProjectDetailPage
└── getProjectBySlug()
```

### 6.2 External Dependencies
| Dependency | Version | Usage |
|------------|---------|-------|
| @supabase/supabase-js | ^2.94.0 | Database client |
| lucide-react | ^0.454.0 | Icons |
| next | ^14.2.21 | Framework |
| react | ^18.3.1 | UI library |
| tailwind-merge | ^2.6.0 | Class merging |
| clsx | ^2.1.1 | Conditional classes |

---

## 7. ENVIRONMENT VARIABLES

| Variable | Required | Usage |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SYNC_API_KEY` | Yes (for sync) | API authentication |

---

## 8. DATABASE TABLES

| Table | Usage | Key Columns |
|-------|-------|-------------|
| `registry_items` | All registry data | id, type, name, path, project, tags, metadata |
| `activity_log` | Sync activity | item_type, item_id, action, created_at |
| `projects` | Project definitions | id, name, slug, description |
| `project_folders` | Project structure | project_id, path, description |
| `project_credentials` | Project secrets | project_id, service, username, password |
| `project_changelog` | Project history | project_id, description, created_at |

---

## 9. ICONS MAPPING

| Type | Icon | Import |
|------|------|--------|
| api | Key | `lucide-react` |
| prompt | MessageSquare | `lucide-react` |
| skill | Sparkles | `lucide-react` |
| agent | Bot | `lucide-react` |
| command | Terminal | `lucide-react` |
| instruction | FileText | `lucide-react` |

---

## 10. ROUTES SUMMARY

| Route | Type | Params |
|-------|------|--------|
| `/` | Server (RSC) | `?project=` |
| `/registry` | Server (RSC) | `?type=`, `?project=` |
| `/activity` | Client | None |
| `/settings` | Client | None |
| `/projects/[slug]` | Server (RSC) | `slug` param |
| `/api/sync` | API | GET, POST |

---

## 11. QUANTIFIED SUMMARY

| Category | Count |
|----------|-------|
| Pages | 5 |
| API Endpoints | 2 (GET + POST) |
| Shell Components | 5 |
| Data Functions | 9 |
| Interactive Buttons | 21 |
| Filter Options | 11 (7 type + 4 period) |
| Navigation Items | 4 |
| Database Tables | 6 |
| Icons Used | 22 |
| Environment Variables | 3 |
