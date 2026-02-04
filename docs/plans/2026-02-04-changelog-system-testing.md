# Changelog System Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Grondig testen van alle changelog & unified project functies vanuit elke mogelijke angle.

**Architecture:** Dual-agent approach - Agent A (Scope Executor) voert tests uit, Agent B (Quality Controller) valideert output tegen requirements. Tests worden uitgevoerd via database queries, API calls, en browser verificatie.

**Tech Stack:** Supabase MCP, Playwright browser, curl/fetch voor API tests

---

## Pre-requisites

**Commit huidige wijzigingen eerst:**

```bash
cd C:/Users/Shadow/Projects/command-center-v2/command-center-app
git add -A
git status
```

---

## Task 1: Commit Current Changes

**Files:**
- Stage: All modified files in `command-center-app/src/`

**Step 1: Check git status**

Run: `git status`
Expected: Shows modified files in lib/, app/, types/

**Step 2: Stage all changes**

Run: `git add command-center-app/src/`
Expected: Files staged

**Step 3: Create commit**

Run:
```bash
git commit -m "feat: changelog system + unified project source

- Extended project_changelog table with title, change_type, items_affected
- Added getProjectsFromRegistry() for unified project listing
- Added getRecentChanges(), getProjectChangelog() functions
- Sync API now auto-generates changelog entries on item changes
- Sync API auto-creates projects on first encounter
- Homepage shows Recent Changes widget
- Project detail page shows changelog + all assets"
```
Expected: Commit created successfully

**Step 4: Verify commit**

Run: `git log -1 --oneline`
Expected: Shows new commit hash + message

---

## Task 2: Test Database Schema

**Files:**
- Test: Supabase `project_changelog` table

**Step 1: Verify table columns exist**

Run via Supabase MCP `execute_sql`:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'project_changelog'
ORDER BY ordinal_position;
```
Expected: Columns include: id, project_id, description, created_at, project, title, change_type, items_affected, metadata

**Step 2: Verify check constraint on change_type**

Run via Supabase MCP `execute_sql`:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'project_changelog'::regclass AND contype = 'c';
```
Expected: Check constraint for change_type IN ('added', 'updated', 'removed', 'sync')

**Step 3: Verify indexes exist**

Run via Supabase MCP `execute_sql`:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'project_changelog';
```
Expected: Indexes on project and created_at

---

## Task 3: Test Insert Changelog Entry

**Files:**
- Test: Database insert operations

**Step 1: Insert full changelog entry**

Run via Supabase MCP `execute_sql`:
```sql
INSERT INTO project_changelog (project, title, description, change_type, items_affected, metadata)
VALUES ('test-project', 'Test Entry', 'Testing insert', 'added', ARRAY['item1', 'item2'], '{"test": true}')
RETURNING id, project, title, change_type;
```
Expected: Row inserted, returns new id

**Step 2: Insert minimal entry (only required fields)**

Run via Supabase MCP `execute_sql`:
```sql
INSERT INTO project_changelog (project, title, change_type)
VALUES ('test-project', 'Minimal Entry', 'sync')
RETURNING id, items_affected, metadata;
```
Expected: Row inserted, items_affected defaults to '{}', metadata defaults to '{}'

**Step 3: Verify entries exist**

Run via Supabase MCP `execute_sql`:
```sql
SELECT id, project, title, change_type, items_affected
FROM project_changelog
WHERE project = 'test-project'
ORDER BY created_at DESC;
```
Expected: Both test entries returned

**Step 4: Clean up test data**

Run via Supabase MCP `execute_sql`:
```sql
DELETE FROM project_changelog WHERE project = 'test-project';
```
Expected: Rows deleted

---

## Task 4: Test Sync API - Changelog Generation

**Files:**
- Test: `src/app/api/sync/route.ts`

**Step 1: Get current command count for baseline**

Run via Supabase MCP `execute_sql`:
```sql
SELECT COUNT(*) as count FROM registry_items WHERE type = 'command';
```
Expected: Returns current count (note this number)

**Step 2: Prepare test sync payload**

Create test payload (don't run yet):
```json
{
  "type": "command",
  "items": [
    {
      "id": "test-sync-1",
      "name": "test-sync-command",
      "path": "/test/path",
      "description": "Test command for sync",
      "created": "2026-02-04T00:00:00Z",
      "project": "sync-test-project"
    }
  ]
}
```

**Step 3: Note pre-sync changelog count**

Run via Supabase MCP `execute_sql`:
```sql
SELECT COUNT(*) FROM project_changelog WHERE project = 'sync-test-project';
```
Expected: Returns 0 (no entries yet)

**Step 4: Execute sync via API**

Run via fetch/curl to local dev server (http://localhost:3003/api/sync):
```bash
curl -X POST http://localhost:3003/api/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"type":"command","items":[{"id":"test-sync-1","name":"test-sync-command","path":"/test/path","description":"Test command","created":"2026-02-04T00:00:00Z","project":"sync-test-project"}]}'
```
Expected: Response with success:true, count:1, changelog:1

**Step 5: Verify changelog entry created**

Run via Supabase MCP `execute_sql`:
```sql
SELECT id, project, title, change_type, items_affected
FROM project_changelog
WHERE project = 'sync-test-project'
ORDER BY created_at DESC
LIMIT 5;
```
Expected: Entry with change_type='added', items_affected contains 'test-sync-command'

**Step 6: Verify project auto-created**

Run via Supabase MCP `execute_sql`:
```sql
SELECT id, name, slug FROM projects WHERE slug = 'sync-test-project';
```
Expected: Project record exists

---

## Task 5: Test Sync API - Remove Detection

**Files:**
- Test: `src/app/api/sync/route.ts` removal detection

**Step 1: Sync empty items to trigger removal**

Run via curl:
```bash
curl -X POST http://localhost:3003/api/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: 09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f" \
  -d '{"type":"command","items":[]}'
```
Expected: Response with success:true

**Step 2: Verify removal changelog entry**

Run via Supabase MCP `execute_sql`:
```sql
SELECT id, project, title, change_type, items_affected
FROM project_changelog
WHERE change_type = 'removed'
ORDER BY created_at DESC
LIMIT 5;
```
Expected: Entry with change_type='removed', items_affected contains 'test-sync-command'

---

## Task 6: Test getRecentChanges() Function

**Files:**
- Test: `src/lib/registry.ts` getRecentChanges()

**Step 1: Insert test changelog entries**

Run via Supabase MCP `execute_sql`:
```sql
INSERT INTO project_changelog (project, title, change_type, items_affected, created_at)
VALUES
  ('test-recent-1', 'Entry 1', 'added', ARRAY['a'], NOW() - INTERVAL '1 minute'),
  ('test-recent-2', 'Entry 2', 'updated', ARRAY['b'], NOW() - INTERVAL '2 minutes'),
  ('test-recent-3', 'Entry 3', 'removed', ARRAY['c'], NOW() - INTERVAL '3 minutes'),
  ('test-recent-4', 'Entry 4', 'sync', ARRAY['d'], NOW() - INTERVAL '4 minutes'),
  ('test-recent-5', 'Entry 5', 'added', ARRAY['e'], NOW() - INTERVAL '5 minutes'),
  ('test-recent-6', 'Entry 6', 'added', ARRAY['f'], NOW() - INTERVAL '6 minutes');
```
Expected: 6 rows inserted

**Step 2: Verify via browser - Homepage**

Navigate to: http://localhost:3003/
Expected: Recent Changes section shows entries with colored dots (green=added, red=removed, etc.)

**Step 3: Verify limit works**

Check that max 5 entries shown on homepage (code limits to 5)

**Step 4: Clean up test data**

Run via Supabase MCP `execute_sql`:
```sql
DELETE FROM project_changelog WHERE project LIKE 'test-recent-%';
```
Expected: Rows deleted

---

## Task 7: Test getProjectsFromRegistry() Function

**Files:**
- Test: `src/lib/projects.ts` getProjectsFromRegistry()

**Step 1: Get current projects via browser**

Navigate to: http://localhost:3003/
Expected: Projects section shows all unique projects from registry_items

**Step 2: Verify item counts**

Run via Supabase MCP `execute_sql`:
```sql
SELECT project, COUNT(*) as count
FROM registry_items
WHERE project IS NOT NULL
GROUP BY project
ORDER BY count DESC;
```
Expected: Counts match what's shown in UI

**Step 3: Verify sorting (metadata first, then by count)**

Check UI shows projects with metadata (in projects table) first

---

## Task 8: Test Project Detail Page

**Files:**
- Test: `src/app/(dashboard)/projects/[slug]/page.tsx`

**Step 1: Navigate to known project**

Navigate to: http://localhost:3003/projects/agent-os
Expected: Page loads with project name, changelog, and assets

**Step 2: Verify assets sections**

Check for:
- Commands section (if project has commands)
- Agents section (if project has agents)
- Skills section (if project has skills)
Expected: Each section shows correct count and items

**Step 3: Test unknown project → 404**

Navigate to: http://localhost:3003/projects/nonexistent-project-xyz
Expected: 404 Not Found page

**Step 4: Test project with special characters**

Navigate to: http://localhost:3003/projects/hs-docs
Expected: Page loads correctly (hyphen in slug handled)

---

## Task 9: Test Edge Cases

**Files:**
- Test: Various edge cases

**Step 1: Test null title in changelog**

Run via Supabase MCP `execute_sql`:
```sql
INSERT INTO project_changelog (project, title, change_type)
VALUES ('edge-test', NULL, 'sync')
RETURNING id;
```
Note: This should fail due to title being required, or default to description

**Step 2: Test empty items_affected array display**

Run via Supabase MCP `execute_sql`:
```sql
INSERT INTO project_changelog (project, title, change_type, items_affected)
VALUES ('edge-test', 'Empty items', 'sync', ARRAY[]::text[])
RETURNING id;
```
Expected: Entry created with empty array

**Step 3: Verify UI handles empty items_affected**

Check project page doesn't crash with empty items_affected

**Step 4: Clean up**

Run via Supabase MCP `execute_sql`:
```sql
DELETE FROM project_changelog WHERE project = 'edge-test';
DELETE FROM projects WHERE slug = 'sync-test-project';
```
Expected: Test data cleaned

---

## Task 10: Quality Controller Review

**Files:**
- Review: All test results from Tasks 2-9

**Step 1: Compile test results**

Create summary of:
- [ ] Database schema tests: PASS/FAIL
- [ ] Insert operations: PASS/FAIL
- [ ] Sync API changelog generation: PASS/FAIL
- [ ] Sync API removal detection: PASS/FAIL
- [ ] getRecentChanges() function: PASS/FAIL
- [ ] getProjectsFromRegistry() function: PASS/FAIL
- [ ] Project detail page: PASS/FAIL
- [ ] Edge cases: PASS/FAIL

**Step 2: Identify any missed test cases**

Review against original requirements:
- All change_types tested? (added, updated, removed, sync)
- All functions tested with valid and invalid input?
- UI tested in both light and dark mode?

**Step 3: Document findings**

Create test report with:
- Tests passed
- Tests failed (with details)
- Recommendations for fixes

**Step 4: Final commit if all tests pass**

Run:
```bash
git add docs/plans/
git commit -m "docs: add changelog system test plan"
```
Expected: Test plan committed

---

## Verification Checklist

After all tasks complete:

- [ ] Git commit created with all changes
- [ ] Database schema verified (columns, constraints, indexes)
- [ ] Changelog inserts work (full and minimal)
- [ ] Sync API creates changelog entries for new items
- [ ] Sync API creates changelog entries for removed items
- [ ] Sync API auto-creates projects
- [ ] Homepage shows Recent Changes
- [ ] Project detail shows changelog + assets
- [ ] 404 for unknown projects
- [ ] Edge cases handled gracefully
- [ ] All test data cleaned up
