# Command Center Comprehensive Test Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Test alle toegevoegde functies van Command Center vanuit elke mogelijke angle met gedetailleerde verificatie.

**Architecture:** Dual-subagent model - één executor voert tests uit, één reviewer valideert output tegen requirements. Elke task bevat meerdere test cases gegroepeerd per functionaliteit.

**Tech Stack:** Next.js 14, Supabase, TypeScript, Playwright (E2E), curl (API), Tailwind CSS

---

## Test Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Main)                       │
│  - Dispatches executor subagent per task                    │
│  - Dispatches reviewer subagent after each execution        │
│  - Tracks pass/fail per test case                           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│    EXECUTOR SUBAGENT    │     │     REVIEWER SUBAGENT       │
│  - Runs test commands   │────▶│  - Validates output         │
│  - Documents results    │     │  - Checks requirements      │
│  - Reports findings     │     │  - Reports quality score    │
└─────────────────────────┘     └─────────────────────────────┘
```

---

## Task 1: API - Sync Endpoint POST Tests

**Files:**
- Test: `command-center-app/src/app/api/sync/route.ts`
- Verify: Supabase `registry_items`, `activity_log`, `project_changelog` tables

**Pre-conditions:**
- Production deployed: https://command-center-app-nine.vercel.app
- SYNC_API_KEY: `09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f`

---

**Step 1: Test POST without API key → 401**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{"type":"skill","items":[]}' | jq .
```

Expected:
```json
{"error": "Invalid API key"}
```

Verification: Status code implies 401, error message matches

---

**Step 2: Test POST with invalid API key → 401**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key-12345" \
  -d '{"type":"skill","items":[]}' | jq .
```

Expected:
```json
{"error": "Invalid API key"}
```

Verification: Error message matches

---

**Step 3: Test POST with missing type → 400**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"items":[]}' | jq .
```

Expected:
```json
{"error": "Invalid payload: type and items[] required"}
```

---

**Step 4: Test POST with missing items → 400**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"type":"skill"}' | jq .
```

Expected:
```json
{"error": "Invalid payload: type and items[] required"}
```

---

**Step 5: Test POST valid sync with test item**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{
    "type": "skill",
    "items": [{
      "id": "test-skill-001",
      "name": "test-skill",
      "path": ".claude/skills/test-skill.md",
      "description": "Test skill for verification",
      "project": "test-project",
      "tags": ["test"],
      "created": "2026-02-05T12:00:00Z"
    }]
  }' | jq .
```

Expected output contains:
```json
{
  "success": true,
  "synced": 1,
  "added": [...],
  "removed": [...]
}
```

Verification: `synced: 1`, no error field

---

**Step 6: Verify item in database**

Run (via Supabase MCP):
```sql
SELECT * FROM registry_items WHERE id = 'test-skill-001';
```

Expected: Row exists with correct fields

---

**Step 7: Cleanup test item**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"type": "skill", "items": []}' | jq .
```

Expected: Test item removed (will show in `removed` array if was present)

---

**Step 8: Document results**

Create summary:
```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| POST no key | 401 | ? | ? |
| POST wrong key | 401 | ? | ? |
| POST missing type | 400 | ? | ? |
| POST missing items | 400 | ? | ? |
| POST valid sync | 200 + synced:1 | ? | ? |
| DB verification | row exists | ? | ? |
| Cleanup | removed | ? | ? |
```

---

## Task 2: API - Sync Endpoint GET Tests

**Files:**
- Test: `command-center-app/src/app/api/sync/route.ts`

---

**Step 1: Test GET sync status**

Run:
```bash
curl -s https://command-center-app-nine.vercel.app/api/sync | jq .
```

Expected structure:
```json
{
  "connected": true,
  "counts": {
    "api": <number>,
    "prompt": <number>,
    "skill": <number>,
    "agent": <number>,
    "command": <number>,
    "instruction": <number>
  },
  "lastSync": {
    "api": "<ISO date or null>",
    ...
  }
}
```

Verification:
- `connected: true`
- All 6 types present in counts
- Counts are numbers >= 0

---

**Step 2: Verify counts match database**

Run (via Supabase MCP):
```sql
SELECT type, COUNT(*) as count FROM registry_items GROUP BY type;
```

Verification: Counts match GET response

---

**Step 3: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| GET status | connected:true | ? | ? |
| Counts structure | 6 types | ? | ? |
| Counts accuracy | match DB | ? | ? |
```

---

## Task 3: API - Tasks CRUD Tests

**Files:**
- Test: `command-center-app/src/app/api/tasks/route.ts`
- Test: `command-center-app/src/app/api/tasks/[id]/route.ts`

---

**Step 1: GET all tasks**

Run:
```bash
curl -s https://command-center-app-nine.vercel.app/api/tasks | jq .
```

Expected: Array of task objects or `[]`

Verification: Response is array, each item has id, title, status, project

---

**Step 2: POST new task - valid**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "project": "test-project",
    "title": "Test Task from API",
    "description": "Created for testing",
    "priority": "high"
  }' | jq .
```

Expected: 201 status, task object returned with:
- `id`: UUID
- `status`: "backlog"
- `priority`: "high"
- `created_at`: ISO date
- `project`: "test-project"

Save returned `id` for next steps.

---

**Step 3: POST task without project → 400**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Missing project"}' | jq .
```

Expected:
```json
{"error": "Project and title are required"}
```

---

**Step 4: POST task without title → 400**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"project": "test-project"}' | jq .
```

Expected:
```json
{"error": "Project and title are required"}
```

---

**Step 5: PATCH task - update status**

Run (use ID from step 2):
```bash
curl -s -X PATCH https://command-center-app-nine.vercel.app/api/tasks/<TASK_ID> \
  -H "Content-Type: application/json" \
  -d '{"status": "doing"}' | jq .
```

Expected: Updated task with `status: "doing"`

---

**Step 6: PATCH task - update priority**

Run:
```bash
curl -s -X PATCH https://command-center-app-nine.vercel.app/api/tasks/<TASK_ID> \
  -H "Content-Type: application/json" \
  -d '{"priority": "urgent"}' | jq .
```

Expected: Updated task with `priority: "urgent"`

---

**Step 7: DELETE task**

Run:
```bash
curl -s -X DELETE https://command-center-app-nine.vercel.app/api/tasks/<TASK_ID> | jq .
```

Expected:
```json
{"success": true}
```

---

**Step 8: Verify task deleted**

Run:
```bash
curl -s https://command-center-app-nine.vercel.app/api/tasks | jq '.[] | select(.id == "<TASK_ID>")'
```

Expected: Empty (task not found)

---

**Step 9: GET tasks with project filter**

Run:
```bash
curl -s "https://command-center-app-nine.vercel.app/api/tasks?project=agent-os" | jq .
```

Expected: Only tasks with `project: "agent-os"`

---

**Step 10: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| GET all tasks | array | ? | ? |
| POST valid task | 201 + task | ? | ? |
| POST no project | 400 | ? | ? |
| POST no title | 400 | ? | ? |
| PATCH status | updated | ? | ? |
| PATCH priority | updated | ? | ? |
| DELETE task | success:true | ? | ? |
| Verify deleted | not found | ? | ? |
| GET with filter | filtered | ? | ? |
```

---

## Task 4: Page - Homepage Tests (Browser)

**Files:**
- Test: `command-center-app/src/app/(dashboard)/page.tsx`

**Pre-conditions:** Browser testing via Playwright MCP

---

**Step 1: Navigate to homepage**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app
```

Verification: Page loads without errors

---

**Step 2: Take snapshot of homepage**

Run:
```
browser_snapshot
```

Verification:
- "Command Center" title visible
- Stats section visible (APIs, Prompts, Skills, Agents, Commands, Instructions)
- Projects section visible
- Recent Changes section visible

---

**Step 3: Verify stats display**

Verification from snapshot:
- 6 stat cards present
- Each shows number + label
- Numbers match API counts

---

**Step 4: Verify projects list**

Verification from snapshot:
- Projects displayed with names
- Item count per project shown
- Clickable links

---

**Step 5: Test navigation to Registry**

Run:
```
browser_click: Registry nav item
```

Verification: URL changes to /registry

---

**Step 6: Navigate back and test project filter**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app
browser_click: Project dropdown
browser_click: Select a specific project
```

Verification: URL has ?project=<name>, stats update

---

**Step 7: Take screenshot for visual verification**

Run:
```
browser_take_screenshot: homepage-test.png
```

---

**Step 8: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| Page loads | no errors | ? | ? |
| Stats visible | 6 cards | ? | ? |
| Projects visible | list | ? | ? |
| Registry nav | /registry | ? | ? |
| Project filter | URL update | ? | ? |
```

---

## Task 5: Page - Registry Tests (Browser)

**Files:**
- Test: `command-center-app/src/app/(dashboard)/registry/page.tsx`

---

**Step 1: Navigate to Registry**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/registry
```

---

**Step 2: Take snapshot**

Run:
```
browser_snapshot
```

Verification:
- All 6 type sections present
- Items listed per type
- Commands grouped by category

---

**Step 3: Test type filter - Skills only**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/registry?type=skill
```

Verification: Only skills section shown

---

**Step 4: Test type filter - Commands only**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/registry?type=command
```

Verification: Only commands section shown, grouped by category

---

**Step 5: Test combined filter**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/registry?type=agent&project=agent-os
```

Verification: Only agents from agent-os project

---

**Step 6: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| Page loads | 6 sections | ? | ? |
| Type filter skills | only skills | ? | ? |
| Type filter commands | grouped | ? | ? |
| Combined filter | filtered | ? | ? |
```

---

## Task 6: Page - Settings Tests (Browser)

**Files:**
- Test: `command-center-app/src/app/(dashboard)/settings/page.tsx`

---

**Step 1: Navigate to Settings**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/settings
```

---

**Step 2: Take snapshot**

Run:
```
browser_snapshot
```

Verification:
- Connection status indicator (green = connected)
- Sync stats per type
- Last sync times
- Refresh button
- CLI instructions

---

**Step 3: Test refresh button**

Run:
```
browser_click: Refresh/Ververs button
```

Verification: Stats refresh (loading state briefly shown)

---

**Step 4: Test dark mode toggle**

Run:
```
browser_click: Dark mode toggle
```

Verification:
- Page switches to dark mode
- Background color changes
- Text color changes

---

**Step 5: Verify dark mode persists**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/settings
browser_snapshot
```

Verification: Still in dark mode after reload

---

**Step 6: Toggle back to light mode**

Run:
```
browser_click: Dark mode toggle
```

Verification: Back to light mode

---

**Step 7: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| Connection status | green | ? | ? |
| Sync stats | 6 types | ? | ? |
| Refresh button | reloads | ? | ? |
| Dark mode on | dark bg | ? | ? |
| Dark mode persists | still dark | ? | ? |
| Dark mode off | light bg | ? | ? |
```

---

## Task 7: Page - Tasks/Kanban Tests (Browser)

**Files:**
- Test: `command-center-app/src/app/(dashboard)/tasks/page.tsx`
- Test: `command-center-app/src/components/kanban/KanbanBoard.tsx`

---

**Step 1: Navigate to Tasks**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/tasks
```

---

**Step 2: Take snapshot**

Run:
```
browser_snapshot
```

Verification:
- 4 columns visible: Backlog, To Do, Doing, Done
- Task counts per column
- Add Task button visible

---

**Step 3: Open Add Task modal**

Run:
```
browser_click: Add Task button
```

Verification: Modal opens with form fields

---

**Step 4: Fill and submit new task**

Run:
```
browser_fill_form:
  - Project: test-project (or select from dropdown)
  - Title: Browser Test Task
  - Description: Created via browser test
  - Priority: high
browser_click: Add Task submit button
```

Verification:
- Modal closes
- New task appears in Backlog column

---

**Step 5: Take snapshot after adding**

Run:
```
browser_snapshot
```

Verification: New task card visible in Backlog

---

**Step 6: Test drag and drop (if supported)**

Note: Drag and drop may require browser_drag tool

Run:
```
browser_drag:
  startElement: "Browser Test Task" card
  endElement: "Doing" column
```

Verification: Task moves to Doing column

---

**Step 7: Delete test task**

Run:
```
browser_click: Delete button on test task
```

Verification: Task removed from board

---

**Step 8: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| 4 columns | visible | ? | ? |
| Add Task modal | opens | ? | ? |
| Create task | appears | ? | ? |
| Drag to Doing | moves | ? | ? |
| Delete task | removed | ? | ? |
```

---

## Task 8: Page - Project Detail Tests (Browser)

**Files:**
- Test: `command-center-app/src/app/(dashboard)/projects/[slug]/page.tsx`

---

**Step 1: Navigate to a project detail page**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/projects/agent-os
```

---

**Step 2: Take snapshot**

Run:
```
browser_snapshot
```

Verification:
- Project name displayed
- Back link visible
- Assets grouped by type
- Changelog section (if exists)

---

**Step 3: Test back navigation**

Run:
```
browser_click: Back link
```

Verification: Returns to homepage

---

**Step 4: Test non-existent project**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/projects/non-existent-project-xyz
```

Verification: 404 page or empty state shown

---

**Step 5: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| Project loads | name visible | ? | ? |
| Assets grouped | by type | ? | ? |
| Back link | goes home | ? | ? |
| 404 project | error state | ? | ? |
```

---

## Task 9: Responsive Design Tests (Browser)

**Files:**
- Test: All page components

---

**Step 1: Test desktop layout (1280px)**

Run:
```
browser_resize: width=1280, height=800
browser_navigate: https://command-center-app-nine.vercel.app
browser_snapshot
```

Verification:
- Sidebar visible (fixed left)
- Main content has left padding
- Full navigation visible

---

**Step 2: Test tablet layout (768px)**

Run:
```
browser_resize: width=768, height=1024
browser_snapshot
```

Verification:
- Sidebar still visible (breakpoint is md:768px)
- Layout adjusts appropriately

---

**Step 3: Test mobile layout (375px)**

Run:
```
browser_resize: width=375, height=667
browser_snapshot
```

Verification:
- Sidebar hidden
- Hamburger menu visible
- Header with menu button

---

**Step 4: Test mobile menu**

Run:
```
browser_click: Hamburger menu button
browser_snapshot
```

Verification:
- Overlay menu opens
- Navigation items visible
- Close button or click-outside closes

---

**Step 5: Take mobile screenshot**

Run:
```
browser_take_screenshot: mobile-layout.png
```

---

**Step 6: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| Desktop 1280px | sidebar visible | ? | ? |
| Tablet 768px | sidebar visible | ? | ? |
| Mobile 375px | hamburger menu | ? | ? |
| Mobile menu opens | overlay | ? | ? |
```

---

## Task 10: Dark Mode Comprehensive Tests (Browser)

**Files:**
- Test: All components with dark mode support

---

**Step 1: Enable dark mode**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/settings
browser_click: Dark mode toggle
```

---

**Step 2: Test homepage in dark mode**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app
browser_take_screenshot: dark-mode-homepage.png
```

Verification:
- Dark background (#0a0a0a or similar)
- Light text
- Cards have dark backgrounds
- Accent colors still visible

---

**Step 3: Test Registry in dark mode**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/registry
browser_take_screenshot: dark-mode-registry.png
```

---

**Step 4: Test Tasks/Kanban in dark mode**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/tasks
browser_take_screenshot: dark-mode-tasks.png
```

---

**Step 5: Test Settings in dark mode**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app/settings
browser_take_screenshot: dark-mode-settings.png
```

---

**Step 6: Disable dark mode**

Run:
```
browser_click: Dark mode toggle
```

---

**Step 7: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| Homepage dark | dark bg | ? | ? |
| Registry dark | dark bg | ? | ? |
| Tasks dark | dark bg | ? | ? |
| Settings dark | dark bg | ? | ? |
| Toggle off | light mode | ? | ? |
```

---

## Task 11: Database Schema Verification

**Files:**
- Verify: Supabase tables via MCP

---

**Step 1: List all tables**

Run (via Supabase MCP):
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- activity_log
- kanban_tasks
- project_changelog
- project_credentials
- project_folders
- projects
- registry_items

---

**Step 2: Verify registry_items schema**

Run:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registry_items';
```

Expected columns:
- id (text/uuid, NOT NULL)
- type (text, NOT NULL)
- name (text, NOT NULL)
- path (text)
- description (text)
- project (text)
- tags (jsonb/text[])
- metadata (jsonb)
- created (timestamptz)
- updated (timestamptz)

---

**Step 3: Verify kanban_tasks schema**

Run:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kanban_tasks';
```

Expected columns:
- id (uuid, NOT NULL)
- project (text, NOT NULL)
- title (text, NOT NULL)
- description (text)
- status (text)
- priority (text)
- position (integer)
- created_at (timestamptz)
- updated_at (timestamptz)

---

**Step 4: Verify project_changelog schema**

Run:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_changelog';
```

---

**Step 5: Document results**

```markdown
| Table | Expected Columns | Actual | Pass/Fail |
|-------|------------------|--------|-----------|
| registry_items | 10 cols | ? | ? |
| kanban_tasks | 9 cols | ? | ? |
| project_changelog | ? | ? | ? |
| activity_log | ? | ? | ? |
```

---

## Task 12: Error Handling Tests

**Files:**
- Test: All API routes and pages

---

**Step 1: Test API with invalid JSON**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d 'not valid json' 2>&1
```

Expected: 400 error or parse error

---

**Step 2: Test API with wrong content type**

Run:
```bash
curl -s -X POST https://command-center-app-nine.vercel.app/api/tasks \
  -H "Content-Type: text/plain" \
  -d '{"project":"test","title":"test"}' 2>&1
```

Verification: Error or handled gracefully

---

**Step 3: Test non-existent API route**

Run:
```bash
curl -s https://command-center-app-nine.vercel.app/api/nonexistent | jq .
```

Expected: 404 response

---

**Step 4: Test PATCH with non-existent task ID**

Run:
```bash
curl -s -X PATCH https://command-center-app-nine.vercel.app/api/tasks/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}' | jq .
```

Expected: Error response (500 or 404)

---

**Step 5: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| Invalid JSON | 400 | ? | ? |
| Wrong content-type | handled | ? | ? |
| Non-existent route | 404 | ? | ? |
| Non-existent task | error | ? | ? |
```

---

## Task 13: Performance Verification

**Files:**
- Test: All pages

---

**Step 1: Measure homepage load time**

Run:
```bash
curl -s -w "\nTime: %{time_total}s\n" -o /dev/null https://command-center-app-nine.vercel.app
```

Expected: < 3 seconds

---

**Step 2: Measure API response times**

Run:
```bash
curl -s -w "\nTime: %{time_total}s\n" -o /dev/null https://command-center-app-nine.vercel.app/api/sync
curl -s -w "\nTime: %{time_total}s\n" -o /dev/null https://command-center-app-nine.vercel.app/api/tasks
```

Expected: < 1 second each

---

**Step 3: Check network requests in browser**

Run:
```
browser_navigate: https://command-center-app-nine.vercel.app
browser_network_requests: includeStatic=false
```

Verification: No failed requests, reasonable payload sizes

---

**Step 4: Document results**

```markdown
| Test Case | Expected | Actual | Pass/Fail |
|-----------|----------|--------|-----------|
| Homepage load | <3s | ? | ? |
| Sync API | <1s | ? | ? |
| Tasks API | <1s | ? | ? |
| No failed requests | 0 | ? | ? |
```

---

## Task 14: Final Integration Test

**Files:**
- Test: Complete user flow

---

**Step 1: Complete user journey**

Execute full flow:
1. Load homepage
2. Check stats
3. Navigate to Registry
4. Filter by type
5. Navigate to Tasks
6. Create new task
7. Move task to Done
8. Navigate to Settings
9. Verify connection
10. Toggle dark mode
11. Return to homepage
12. Delete test task

---

**Step 2: Document complete journey**

```markdown
| Step | Action | Expected | Actual | Pass/Fail |
|------|--------|----------|--------|-----------|
| 1 | Load home | Dashboard | ? | ? |
| 2 | Check stats | Numbers | ? | ? |
| 3 | Go to Registry | Items shown | ? | ? |
| 4 | Filter skills | Only skills | ? | ? |
| 5 | Go to Tasks | Kanban | ? | ? |
| 6 | Create task | In backlog | ? | ? |
| 7 | Move to Done | In done | ? | ? |
| 8 | Go to Settings | Connected | ? | ? |
| 9 | Toggle dark | Dark mode | ? | ? |
| 10 | Go home | Dashboard dark | ? | ? |
| 11 | Delete task | Removed | ? | ? |
```

---

## Task 15: Generate Test Report

**Files:**
- Create: `command-center-app/docs/test-results-2026-02-05.md`

---

**Step 1: Compile all results**

Gather all test results from Tasks 1-14 into comprehensive report.

---

**Step 2: Calculate pass rate**

```
Total tests: X
Passed: Y
Failed: Z
Pass rate: Y/X * 100%
```

---

**Step 3: Document failures with details**

For each failure:
- Test case name
- Expected result
- Actual result
- Screenshot if applicable
- Potential fix recommendation

---

**Step 4: Create summary report**

```markdown
# Command Center Test Report

**Date:** 2026-02-05
**Environment:** Production (Vercel)
**Database:** Supabase VEHA Hub

## Summary

| Category | Tests | Passed | Failed | Rate |
|----------|-------|--------|--------|------|
| API Sync | X | X | X | X% |
| API Tasks | X | X | X | X% |
| Pages | X | X | X | X% |
| Components | X | X | X | X% |
| Responsive | X | X | X | X% |
| Dark Mode | X | X | X | X% |
| Database | X | X | X | X% |
| Error Handling | X | X | X | X% |
| Performance | X | X | X | X% |
| Integration | X | X | X | X% |
| **TOTAL** | **X** | **X** | **X** | **X%** |

## Failed Tests

[List of failures with details]

## Recommendations

[Any fixes or improvements needed]

## Screenshots

[Links to screenshots taken during testing]
```

---

**Step 5: Commit report**

```bash
git add docs/test-results-2026-02-05.md
git add docs/plans/2026-02-05-comprehensive-test-plan.md
git commit -m "docs: add comprehensive test plan and results"
```

---

## Execution Summary

| Task | Description | Test Cases |
|------|-------------|------------|
| 1 | API Sync POST | 7 |
| 2 | API Sync GET | 3 |
| 3 | API Tasks CRUD | 9 |
| 4 | Homepage | 5 |
| 5 | Registry Page | 4 |
| 6 | Settings Page | 6 |
| 7 | Tasks/Kanban | 5 |
| 8 | Project Detail | 4 |
| 9 | Responsive | 4 |
| 10 | Dark Mode | 5 |
| 11 | Database | 4 |
| 12 | Error Handling | 4 |
| 13 | Performance | 4 |
| 14 | Integration | 11 |
| 15 | Report | 5 |
| **TOTAL** | | **80** |

---

## Subagent Instructions

### Executor Subagent

You are the **Test Executor**. Your role:
1. Run each test step exactly as documented
2. Record actual output/result
3. Note any deviations from expected
4. Take screenshots when specified
5. Do NOT skip any steps
6. Report all findings to orchestrator

### Reviewer Subagent

You are the **Quality Reviewer**. Your role:
1. Review executor's findings
2. Verify each test case against requirements
3. Mark Pass/Fail accurately
4. Identify any missed test cases
5. Rate overall quality (1-10)
6. Recommend fixes for failures
7. Approve or request re-test

---

**End of Plan**
