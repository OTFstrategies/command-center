# Project Pages Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Grondig testen van project detail pagina's met bestaande en niet-bestaande projecten, inclusief verificatie van de unified project source.

**Architecture:** Dual-agent approach - Agent A (Scope Executor) voert tests uit via database queries, API calls en Playwright browser tests. Agent B (Quality Controller) valideert output tegen requirements.

**Tech Stack:** Supabase MCP, Playwright browser, Next.js dev server (http://localhost:3003)

---

## Context

### Huidige Projecten in Registry
| Project | Items | In Projects Table |
|---------|-------|-------------------|
| agent-os | 8 | Nee |
| command-center | 1 | Ja |
| global | 2 | Nee |
| hs-docs | 7 | Nee |

### Te Testen Project Folders (Niet in Registry)
| Folder | Path | Status |
|--------|------|--------|
| my-product | C:\Users\Shadow\Projects\my-product | Lokaal, niet gesync |
| my-project-design | C:\Users\Shadow\Projects\my-project-design | Lokaal, niet gesync |
| Project Style Agents | C:\Users\Shadow\Projects\Project Style Agents | Lokaal, niet gesync |
| veha-app | C:\Users\Shadow\Projects\veha-app | Lokaal, niet gesync |

---

## Task 1: Verify Current State

**Files:**
- Test: Database state
- Test: UI state

**Step 1: Query current projects in registry**

Run via Supabase MCP:
```sql
SELECT project, COUNT(*) as items FROM registry_items GROUP BY project ORDER BY items DESC;
```
Expected: agent-os (8), hs-docs (7), global (2), command-center (1)

**Step 2: Query projects table**

Run via Supabase MCP:
```sql
SELECT name, slug, description FROM projects;
```
Expected: command-center and sync-test-project entries

**Step 3: Verify homepage shows projects**

Navigate to http://localhost:3003/ via Playwright
Expected: Projects section shows all 4 projects from registry

---

## Task 2: Test Existing Project Pages

**Files:**
- Test: `src/app/(dashboard)/projects/[slug]/page.tsx`

**Step 1: Test agent-os project page**

Navigate to: http://localhost:3003/projects/agent-os
Verify:
- [ ] Page loads (200 status)
- [ ] Project name "agent-os" shown
- [ ] Assets count shown (8 assets)
- [ ] Agents section visible with 8 agents
- [ ] Changelog section visible (if entries exist)

**Step 2: Test hs-docs project page**

Navigate to: http://localhost:3003/projects/hs-docs
Verify:
- [ ] Page loads (200 status)
- [ ] Project name "hs-docs" shown
- [ ] Assets count shown (7 assets)
- [ ] Agents section visible with 7 agents

**Step 3: Test command-center project page**

Navigate to: http://localhost:3003/projects/command-center
Verify:
- [ ] Page loads (200 status)
- [ ] Has metadata from projects table (description if set)
- [ ] Assets count shown (1 asset)

**Step 4: Test global project page**

Navigate to: http://localhost:3003/projects/global
Verify:
- [ ] Page loads (200 status)
- [ ] Assets count shown (2 assets)

---

## Task 3: Test Non-Existent Project Pages

**Files:**
- Test: 404 handling

**Step 1: Test my-product (not in registry)**

Navigate to: http://localhost:3003/projects/my-product
Expected: 404 page (project has no registry items)

**Step 2: Test my-project-design (not in registry)**

Navigate to: http://localhost:3003/projects/my-project-design
Expected: 404 page

**Step 3: Test project-style-agents (not in registry)**

Navigate to: http://localhost:3003/projects/project-style-agents
Expected: 404 page

**Step 4: Test veha-app (not in registry)**

Navigate to: http://localhost:3003/projects/veha-app
Expected: 404 page

**Step 5: Test completely random project**

Navigate to: http://localhost:3003/projects/xyz-random-12345
Expected: 404 page

---

## Task 4: Test Project Filter on Homepage

**Files:**
- Test: `src/app/(dashboard)/page.tsx`

**Step 1: Test ?project=agent-os filter**

Navigate to: http://localhost:3003/?project=agent-os
Verify:
- [ ] Page title changes to "agent-os"
- [ ] "Gefilterd op project" text shown
- [ ] Assets counts filtered to agent-os only
- [ ] Projects section hidden when filtered

**Step 2: Test ?project=hs-docs filter**

Navigate to: http://localhost:3003/?project=hs-docs
Verify:
- [ ] Filtered view shows hs-docs stats only

**Step 3: Test invalid project filter**

Navigate to: http://localhost:3003/?project=nonexistent
Expected: Page loads but shows 0 items (graceful handling)

---

## Task 5: Test Project Switcher Component

**Files:**
- Test: `src/components/shell/ProjectSwitcher.tsx`

**Step 1: Open project switcher dropdown**

On homepage, click the FolderOpen icon in sidebar
Verify:
- [ ] Dropdown opens
- [ ] "All projects" option shown
- [ ] All 4 projects listed (agent-os, hs-docs, command-center, global)

**Step 2: Select a project**

Click on "agent-os" in dropdown
Verify:
- [ ] URL changes to /?project=agent-os
- [ ] Page filters to agent-os

**Step 3: Select "All projects"**

Click on "All projects" in dropdown
Verify:
- [ ] URL changes to / (no project param)
- [ ] Page shows all projects

---

## Task 6: Test Changelog on Project Pages

**Files:**
- Test: Changelog display

**Step 1: Insert test changelog for agent-os**

Run via Supabase MCP:
```sql
INSERT INTO project_changelog (project, title, change_type, items_affected)
VALUES ('agent-os', 'Test changelog entry', 'added', ARRAY['test-item']);
```

**Step 2: Verify changelog appears on project page**

Navigate to: http://localhost:3003/projects/agent-os
Verify:
- [ ] Recent Changes section visible
- [ ] "Test changelog entry" shown
- [ ] Green indicator for "added" type

**Step 3: Clean up test changelog**

Run via Supabase MCP:
```sql
DELETE FROM project_changelog WHERE title = 'Test changelog entry';
```

---

## Task 7: Test Assets Display on Project Pages

**Files:**
- Test: Assets sections

**Step 1: Verify agent-os assets**

On http://localhost:3003/projects/agent-os verify:
- [ ] Agents section shows (8) count
- [ ] Each agent name listed
- [ ] Tool count shown per agent

**Step 2: Verify command-center assets**

On http://localhost:3003/projects/command-center verify:
- [ ] Commands section shows (1) count
- [ ] Command name "/save-to-cc" listed

**Step 3: Cross-reference with database**

Run via Supabase MCP:
```sql
SELECT type, name FROM registry_items WHERE project = 'agent-os' ORDER BY type, name;
```
Verify UI matches database exactly.

---

## Task 8: Test Edge Cases

**Files:**
- Test: Edge cases and error handling

**Step 1: Test project with spaces in name**

If "Project Style Agents" were in registry, the slug would be "project-style-agents"
Test URL handling with spaces: http://localhost:3003/projects/project%20style%20agents
Expected: 404 or redirect to slug version

**Step 2: Test project with uppercase**

Navigate to: http://localhost:3003/projects/AGENT-OS
Expected: Either 404 or case-insensitive match (document behavior)

**Step 3: Test very long project slug**

Navigate to: http://localhost:3003/projects/this-is-a-very-long-project-name-that-exceeds-normal-length
Expected: 404 page, no crash

**Step 4: Test special characters**

Navigate to: http://localhost:3003/projects/test<script>alert(1)</script>
Expected: 404 page, no XSS vulnerability

---

## Task 9: Quality Controller Review

**Files:**
- Review: All test results

**Step 1: Compile test results**

| Test Area | Tests | Pass | Fail |
|-----------|-------|------|------|
| Existing projects | 4 | ? | ? |
| Non-existent projects | 5 | ? | ? |
| Project filter | 3 | ? | ? |
| Project switcher | 3 | ? | ? |
| Changelog display | 2 | ? | ? |
| Assets display | 3 | ? | ? |
| Edge cases | 4 | ? | ? |

**Step 2: Identify issues**

List any failures with:
- Expected behavior
- Actual behavior
- Severity (Critical/High/Medium/Low)

**Step 3: Recommendations**

Document any improvements needed for:
- Error handling
- UI consistency
- Performance

---

## Verification Checklist

- [ ] All existing project pages load correctly
- [ ] 404 for non-existent projects
- [ ] Project filter works on homepage
- [ ] Project switcher navigates correctly
- [ ] Changelog displays on project pages
- [ ] Assets match database exactly
- [ ] Edge cases handled gracefully
- [ ] No security vulnerabilities
