# Command Center App - Test Plan

**Generated**: 2026-02-04
**Coverage Target**: 100%
**Confidence Requirement**: @0.9+ per test

---

## TEST OVERVIEW

| Category | Tests | Priority |
|----------|-------|----------|
| Server Startup | 2 | P0 |
| API Endpoints | 8 | P0 |
| Page Rendering | 10 | P0 |
| Navigation | 8 | P1 |
| Data Display | 12 | P1 |
| Interactive Elements | 15 | P1 |
| Edge Cases | 10 | P2 |
| **TOTAL** | **65** | - |

---

## EXECUTION ORDER

Tests are ordered by dependencies:

1. **Server & Infrastructure** (must pass first)
2. **API Endpoints** (data layer)
3. **Page Rendering** (UI layer)
4. **Navigation** (routing)
5. **Data Display** (content verification)
6. **Interactive Elements** (user actions)
7. **Edge Cases** (error handling)

---

## SECTION 1: SERVER STARTUP (2 tests)

### TEST 1.1: Development Server Starts
**Verification Criteria**:
- `npm run dev` completes without errors
- Server listens on port 3000
- Response to `GET http://localhost:3000` returns status 200

**Pass Condition**: HTTP 200 within 30 seconds

### TEST 1.2: Build Succeeds
**Verification Criteria**:
- `npm run build` exits with code 0
- No TypeScript errors
- No ESLint errors

**Pass Condition**: Exit code 0

---

## SECTION 2: API ENDPOINTS (8 tests)

### TEST 2.1: GET /api/sync - Success
**Request**: `GET http://localhost:3000/api/sync`
**Expected Response**:
```json
{
  "connected": true,
  "stats": { "api": number, "prompt": number, "skill": number, "agent": number, "command": number, "instruction": number },
  "lastSynced": { ... }
}
```
**Pass Condition**:
- Status 200
- `response.connected === true`
- `Object.keys(response.stats).length === 6`

### TEST 2.2: GET /api/sync - Stats Accuracy
**Verification**: Compare API stats with Supabase database
**Expected**:
- `stats.api === 1`
- `stats.prompt === 1`
- `stats.skill === 1`
- `stats.agent === 15`
- `stats.command === 56`
- `stats.instruction === 0`
**Pass Condition**: All 6 counts match

### TEST 2.3: POST /api/sync - Missing API Key
**Request**: `POST /api/sync` without `x-api-key` header
**Expected**: Status 401, body contains "Invalid API key"
**Pass Condition**: Status === 401

### TEST 2.4: POST /api/sync - Invalid API Key
**Request**: `POST /api/sync` with `x-api-key: invalid`
**Expected**: Status 401
**Pass Condition**: Status === 401

### TEST 2.5: POST /api/sync - Missing Type
**Request**: `POST /api/sync` with valid key, body: `{ items: [] }`
**Expected**: Status 400, error about missing type
**Pass Condition**: Status === 400

### TEST 2.6: POST /api/sync - Missing Items
**Request**: `POST /api/sync` with valid key, body: `{ type: "api" }`
**Expected**: Status 400, error about missing items
**Pass Condition**: Status === 400

### TEST 2.7: POST /api/sync - Valid Sync (Dry Run)
**Note**: Test with test data, then restore
**Request**: `POST /api/sync` with valid key and test item
**Expected**: Status 200, `success === true`
**Pass Condition**: Status === 200 && response.success === true

### TEST 2.8: POST /api/sync - Response Structure
**Verification**: Response contains all required fields
**Expected**:
```json
{
  "success": true,
  "type": "string",
  "count": number,
  "message": "string"
}
```
**Pass Condition**: All 4 fields present

---

## SECTION 3: PAGE RENDERING (10 tests)

### TEST 3.1: Home Page Renders
**URL**: `http://localhost:3000/`
**Verification**:
- Page title: "Shadow's Command Center"
- Heading "Command Center" visible
- Assets section visible with 6 cards
**Pass Condition**: All 3 elements present

### TEST 3.2: Home Page - Asset Cards Display
**URL**: `/`
**Expected Elements**:
- APIs card with count "1"
- Prompts card with count "1"
- Skills card with count "1"
- Agents card with count "15"
- Commands card with count "56"
- Instructions card with count "0"
**Pass Condition**: All 6 cards with correct counts

### TEST 3.3: Registry Page Renders
**URL**: `/registry`
**Verification**:
- Filter tabs visible (7 tabs: All, API, Prompt, Skill, Agent, Command, Instruction)
- Items list visible
- Item count displayed
**Pass Condition**: 7 filter tabs + items list visible

### TEST 3.4: Registry Page - Item Count
**URL**: `/registry`
**Expected**: Total items = 74
**Pass Condition**: Displayed count matches 74

### TEST 3.5: Activity Page Renders
**URL**: `/activity`
**Verification**:
- Type filters visible (5 buttons)
- Period filters visible (4 buttons)
- Activity list or empty state
**Pass Condition**: 9 filter buttons visible

### TEST 3.6: Settings Page Renders
**URL**: `/settings`
**Verification**:
- Connection status card visible
- Sync stats table visible
- Refresh button visible
- Instructions panel visible
**Pass Condition**: All 4 sections visible

### TEST 3.7: Settings Page - Connection Status
**URL**: `/settings`
**Expected**: Connected status shows "Connected" with green indicator
**Pass Condition**: Status text === "Connected"

### TEST 3.8: Settings Page - Sync Stats Table
**URL**: `/settings`
**Expected**: 6 rows in table (one per type)
**Pass Condition**: Table has 6 data rows

### TEST 3.9: Project Detail Page Renders
**URL**: `/projects/command-center`
**Verification**:
- Back button visible
- Project name heading
- Structure section
- Credentials section
- Changelog section
**Pass Condition**: All 5 elements visible

### TEST 3.10: 404 Page - Invalid Project
**URL**: `/projects/nonexistent-project-xyz`
**Expected**: 404 page renders
**Pass Condition**: 404 status or "not found" text visible

---

## SECTION 4: NAVIGATION (8 tests)

### TEST 4.1: Nav - Home Link Works
**Action**: Click Home icon in sidebar
**Expected**: Navigate to `/`
**Pass Condition**: URL === `/`

### TEST 4.2: Nav - Registry Link Works
**Action**: Click Registry icon in sidebar
**Expected**: Navigate to `/registry`
**Pass Condition**: URL === `/registry`

### TEST 4.3: Nav - Activity Link Works
**Action**: Click Activity icon in sidebar
**Expected**: Navigate to `/activity`
**Pass Condition**: URL === `/activity`

### TEST 4.4: Nav - Settings Link Works
**Action**: Click Settings icon in sidebar
**Expected**: Navigate to `/settings`
**Pass Condition**: URL === `/settings`

### TEST 4.5: Home - Asset Card Navigation
**Action**: Click "Agents" card on home page
**Expected**: Navigate to `/registry?type=agent`
**Pass Condition**: URL contains `type=agent`

### TEST 4.6: Home - Project Card Navigation
**Action**: Click project card on home page
**Expected**: Navigate to `/projects/{slug}`
**Pass Condition**: URL starts with `/projects/`

### TEST 4.7: Registry - Type Filter Navigation
**Action**: Click "Command" filter tab
**Expected**: URL updates to include `?type=command`
**Pass Condition**: URL contains `type=command`

### TEST 4.8: ProjectDetail - Back Button
**Action**: Click back arrow on project detail page
**Expected**: Navigate to home page
**Pass Condition**: URL === `/`

---

## SECTION 5: DATA DISPLAY (12 tests)

### TEST 5.1: Registry - APIs Display
**URL**: `/registry?type=api`
**Expected**:
- 1 item displayed
- Item shows API icon
- Item shows correct name
**Pass Condition**: Count === 1 && icon visible

### TEST 5.2: Registry - Prompts Display
**URL**: `/registry?type=prompt`
**Expected**: 1 item displayed
**Pass Condition**: Count === 1

### TEST 5.3: Registry - Skills Display
**URL**: `/registry?type=skill`
**Expected**: 1 item displayed (miro-patterns)
**Pass Condition**: Count === 1 && name contains "miro"

### TEST 5.4: Registry - Agents Display
**URL**: `/registry?type=agent`
**Expected**: 15 items displayed
**Pass Condition**: Count === 15

### TEST 5.5: Registry - Commands Display
**URL**: `/registry?type=command`
**Expected**: 56 items displayed
**Pass Condition**: Count === 56

### TEST 5.6: Registry - Instructions Display
**URL**: `/registry?type=instruction`
**Expected**: 0 items, empty state shown
**Pass Condition**: Count === 0 && "No items" message visible

### TEST 5.7: Registry - hs-docs Commands Present
**URL**: `/registry?type=command`
**Expected**: hs-docs, hs-l4, hs-l5, hs-extract, hs-scan, hs-combine visible
**Pass Condition**: All 6 hs-* commands in list

### TEST 5.8: Registry - hs-docs Agents Present
**URL**: `/registry?type=agent`
**Expected**: 7 hs-docs agents visible
**Pass Condition**: At least 7 items with project="hs-docs"

### TEST 5.9: Registry - agent-os Items Present
**URL**: `/registry?type=agent&project=agent-os`
**Expected**: 8 agent-os agents visible
**Pass Condition**: Count === 8

### TEST 5.10: Project Filter - hs-docs
**URL**: `/registry?project=hs-docs`
**Expected**: Only hs-docs items (6 commands + 7 agents = 13)
**Pass Condition**: Total === 13

### TEST 5.11: Project Filter - agent-os
**URL**: `/registry?project=agent-os`
**Expected**: Only agent-os items
**Pass Condition**: All items have project="agent-os"

### TEST 5.12: Home Page - Recent Activity
**URL**: `/`
**Verification**: Activity section exists (may be empty)
**Pass Condition**: Activity section rendered

---

## SECTION 6: INTERACTIVE ELEMENTS (15 tests)

### TEST 6.1: ProjectSwitcher - Opens
**Action**: Click project dropdown button
**Expected**: Dropdown menu appears with project list
**Pass Condition**: Dropdown visible

### TEST 6.2: ProjectSwitcher - Shows Projects
**Action**: Open dropdown
**Expected**: "All", "agent-os", "hs-docs", etc. options visible
**Pass Condition**: At least 3 options visible

### TEST 6.3: ProjectSwitcher - Select Project
**Action**: Click "hs-docs" in dropdown
**Expected**: URL updates with `?project=hs-docs`
**Pass Condition**: URL contains `project=hs-docs`

### TEST 6.4: ProjectSwitcher - Select All
**Action**: Click "All" in dropdown
**Expected**: URL removes project parameter
**Pass Condition**: URL does not contain `project=`

### TEST 6.5: ProjectSwitcher - Closes on Outside Click
**Action**: Open dropdown, click outside
**Expected**: Dropdown closes
**Pass Condition**: Dropdown not visible

### TEST 6.6: Dark Mode Toggle - Enable
**Action**: Click dark mode toggle (sun icon)
**Expected**:
- Theme changes to dark
- LocalStorage updated
- Icon changes to moon
**Pass Condition**: Document has `.dark` class

### TEST 6.7: Dark Mode Toggle - Disable
**Action**: Click dark mode toggle again (moon icon)
**Expected**: Theme changes to light
**Pass Condition**: Document does not have `.dark` class

### TEST 6.8: Settings - Refresh Button
**Action**: Click refresh button on settings page
**Expected**:
- Button shows loading spinner
- Data refreshes
- Spinner disappears
**Pass Condition**: Loading state toggles

### TEST 6.9: Activity - Type Filter
**Action**: Click "Agents" type filter
**Expected**: Filter updates, button shows active state
**Pass Condition**: Button has active styling

### TEST 6.10: Activity - Period Filter
**Action**: Click "Week" period filter
**Expected**: Filter updates, button shows active state
**Pass Condition**: Button has active styling

### TEST 6.11: Mobile Menu - Opens
**Action**: Resize to mobile, click hamburger menu
**Expected**: Mobile nav overlay appears
**Pass Condition**: Mobile nav visible

### TEST 6.12: Mobile Menu - Closes
**Action**: Click X button on mobile menu
**Expected**: Mobile nav closes
**Pass Condition**: Mobile nav not visible

### TEST 6.13: Mobile Menu - Navigation Works
**Action**: Click nav item in mobile menu
**Expected**: Navigates + menu closes
**Pass Condition**: URL changed && menu closed

### TEST 6.14: Nav Tooltips - Desktop
**Action**: Hover over nav icon (desktop)
**Expected**: Tooltip with label appears
**Pass Condition**: Tooltip visible with correct text

### TEST 6.15: Registry Tabs - Visual State
**Action**: Click different type tabs
**Expected**: Active tab has distinct styling
**Pass Condition**: Active tab visually different

---

## SECTION 7: EDGE CASES (10 tests)

### TEST 7.1: Empty Registry Type
**URL**: `/registry?type=instruction`
**Expected**: "No items found" message
**Pass Condition**: Empty state message visible

### TEST 7.2: Invalid Registry Type
**URL**: `/registry?type=invalid`
**Expected**: Shows all items (fallback to "all")
**Pass Condition**: All items displayed

### TEST 7.3: Invalid Project Filter
**URL**: `/registry?project=nonexistent`
**Expected**: No items found (empty state)
**Pass Condition**: Count === 0 || empty state

### TEST 7.4: Settings - API Error Handling
**Simulate**: Disconnect from network
**Expected**: Error message displayed
**Pass Condition**: Error box visible with message

### TEST 7.5: Large Data Set Performance
**Verification**: Page loads within acceptable time
**Expected**: `/registry` loads in < 3 seconds
**Pass Condition**: Load time < 3000ms

### TEST 7.6: Browser Back/Forward
**Action**: Navigate Home → Registry → Back
**Expected**: Returns to Home
**Pass Condition**: URL === `/`

### TEST 7.7: Direct URL Access
**Action**: Open `/registry?type=agent&project=agent-os` directly
**Expected**: Page renders with correct filters
**Pass Condition**: Correct items displayed

### TEST 7.8: Concurrent Filter Params
**URL**: `/registry?type=command&project=hs-docs`
**Expected**: Shows only hs-docs commands (6)
**Pass Condition**: Count === 6

### TEST 7.9: Settings - Sync Status Indicators
**Verification**: Each status type has correct icon
**Expected**:
- Connected: green indicator
- Pending: clock icon
- Error: alert icon
**Pass Condition**: Correct icons displayed

### TEST 7.10: Page Refresh Preserves State
**Action**: Set filters on registry → refresh page
**Expected**: Filters preserved from URL params
**Pass Condition**: Same filters active after refresh

---

## ROLLBACK PROCEDURE

If critical failures occur:

1. **Database Issues**:
   ```bash
   # Restore from last known good state via sync
   cd sync-cli && npm run sync
   ```

2. **Build Failures**:
   ```bash
   # Clean and rebuild
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **API Failures**:
   - Check environment variables
   - Verify Supabase connection
   - Check `SYNC_API_KEY` match

---

## SUCCESS CRITERIA

| Metric | Target | Minimum |
|--------|--------|---------|
| Tests Passed | 65/65 | 60/65 |
| Pass Rate | 100% | 92% |
| Critical Tests (P0) | 20/20 | 20/20 |
| P1 Tests | 35/35 | 32/35 |
| P2 Tests | 10/10 | 8/10 |

**BLOCKING**: Any P0 failure blocks release.

---

## TEST EVIDENCE REQUIREMENTS

Each test must record:
```json
{
  "testId": "X.Y",
  "feature": "feature name",
  "status": "PASS" | "FAIL",
  "timestamp": "ISO datetime",
  "evidence": {
    "type": "screenshot" | "console" | "response",
    "data": "..."
  },
  "confidence": 0.9+,
  "notes": "optional"
}
```
