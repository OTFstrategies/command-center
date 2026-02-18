// API Test Suite for CC v2
const BASE = 'http://localhost:3000'
const API_KEY = '09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f'

const results = []

async function test(name, url, options = {}) {
  const { method = 'GET', body, headers = {}, expect } = options
  const fetchOpts = { method, headers: { ...headers } }
  if (body) {
    fetchOpts.headers['Content-Type'] = 'application/json'
    fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  try {
    const res = await fetch(`${BASE}${url}`, fetchOpts)
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = null }

    const status = res.status
    let pass = true
    let detail = `Status=${status}`

    if (expect.status && status !== expect.status) {
      pass = false
      detail += ` (expected ${expect.status})`
    }
    if (expect.hasKey && json && !(expect.hasKey in json)) {
      pass = false
      detail += ` (missing key: ${expect.hasKey})`
    }
    if (expect.errorContains && json?.error && !json.error.includes(expect.errorContains)) {
      pass = false
      detail += ` (error mismatch: "${json?.error}")`
    }
    if (expect.bodyContains && !text.includes(expect.bodyContains)) {
      pass = false
      detail += ` (body missing: ${expect.bodyContains})`
    }
    if (expect.isEmptyArray && (!json || !Array.isArray(json.memories) || json.memories.length > 0)) {
      // Only fail if we got back ALL memories (injection worked)
      if (json?.memories?.length > 10) {
        pass = false
        detail += ` (got ${json.memories.length} memories — possible injection!)`
      }
    }

    const shortBody = text.length > 200 ? text.substring(0, 200) + '...' : text
    results.push({ name, pass: pass ? 'PASS' : 'FAIL', detail, body: shortBody })
    return { status, json, text }
  } catch (err) {
    results.push({ name, pass: 'ERROR', detail: err.message, body: '' })
    return null
  }
}

async function run() {
  console.log('=== ANGLE A: SECURITY TESTS ===\n')

  // A.1: SQL injection via GET memories
  await test('A.1 SQL injection GET memories', "/api/projects/test'%20OR%201=1--/memories", {
    expect: { status: 200, isEmptyArray: true }
  })

  // A.2: SQL injection via POST memories
  await test('A.2 SQL injection POST memories', "/api/projects/test'%20OR%201=1--/memories", {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: { name: 'injection-test', content: 'test' },
    expect: { status: 200 }
  })

  // A.3: POST without API key
  await test('A.3 POST no API key', '/api/projects/global/memories', {
    method: 'POST',
    body: { name: 'hack', content: 'unauthorized' },
    expect: { status: 401, errorContains: 'Unauthorized' }
  })

  // A.4: POST with wrong API key
  await test('A.4 POST wrong API key', '/api/projects/global/memories', {
    method: 'POST',
    headers: { 'x-api-key': 'wrong-key-here' },
    body: { name: 'hack', content: 'unauthorized' },
    expect: { status: 401, errorContains: 'Unauthorized' }
  })

  // A.5: DELETE without auth
  await test('A.5 DELETE no auth', '/api/projects/global/memories/test', {
    method: 'DELETE',
    headers: { 'x-api-key': 'wrong' },
    expect: { status: 401, errorContains: 'Unauthorized' }
  })

  // A.6: PATCH without auth
  await test('A.6 PATCH no auth', '/api/projects/command-center', {
    method: 'PATCH',
    body: { description: 'hacked' },
    expect: { status: 401, errorContains: 'Unauthorized' }
  })

  // Cleanup A.2 test data
  await fetch(`${BASE}/api/projects/test'%20OR%201=1--/memories/injection-test`, {
    method: 'DELETE', headers: { 'x-api-key': API_KEY }
  }).catch(() => {})

  console.log('=== ANGLE B: MEMORIES CRUD TESTS ===\n')

  // B.1: Create memory
  await test('B.1 Create memory', '/api/projects/command-center/memories', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: { name: 'test-quality-check', content: '# Test Memory\nAangemaakt door QA-plan.' },
    expect: { status: 200, hasKey: 'success' }
  })

  // B.2: List memories
  const listRes = await test('B.2 List memories', '/api/projects/command-center/memories', {
    expect: { status: 200, hasKey: 'memories' }
  })

  // B.3: Read specific memory
  await test('B.3 Read specific memory', '/api/projects/command-center/memories/test-quality-check', {
    expect: { status: 200, hasKey: 'memory' }
  })

  // B.4: Update memory (upsert)
  await test('B.4 Update memory', '/api/projects/command-center/memories', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: { name: 'test-quality-check', content: '# Updated Test Memory\nContent bijgewerkt.' },
    expect: { status: 200, hasKey: 'success' }
  })

  // B.5: Verify update
  await test('B.5 Verify update', '/api/projects/command-center/memories/test-quality-check', {
    expect: { status: 200, bodyContains: 'Updated Test Memory' }
  })

  // B.6: Delete memory
  await test('B.6 Delete memory', '/api/projects/command-center/memories/test-quality-check', {
    method: 'DELETE',
    headers: { 'x-api-key': API_KEY },
    expect: { status: 200, hasKey: 'success' }
  })

  // B.7: Verify deletion
  await test('B.7 Verify deletion', '/api/projects/command-center/memories/test-quality-check', {
    expect: { status: 404, errorContains: 'not found' }
  })

  // B.8: Non-existent memory
  await test('B.8 Non-existent memory', '/api/projects/command-center/memories/does-not-exist', {
    expect: { status: 404, errorContains: 'not found' }
  })

  console.log('=== ANGLE C: PROJECT METADATA TESTS ===\n')

  // C.1: Read project metadata
  await test('C.1 Read project metadata', '/api/projects/command-center', {
    expect: { status: 200, hasKey: 'project' }
  })

  // C.2: Update single field
  await test('C.2 Update tech_stack', '/api/projects/command-center', {
    method: 'PATCH',
    headers: { 'x-api-key': API_KEY },
    body: { tech_stack: ['Next.js 14', 'Supabase', 'Tailwind CSS v4', 'Lucide React', '@dnd-kit'] },
    expect: { status: 200, hasKey: 'project' }
  })

  // C.3: Update multiple fields
  await test('C.3 Update multiple fields', '/api/projects/command-center', {
    method: 'PATCH',
    headers: { 'x-api-key': API_KEY },
    body: { languages: ['typescript'], build_command: 'npm run build', dev_command: 'npm run dev', live_url: 'https://command-center-app-nine.vercel.app' },
    expect: { status: 200, hasKey: 'project' }
  })

  // C.4: Rejected fields
  await test('C.4 Rejected fields', '/api/projects/command-center', {
    method: 'PATCH',
    headers: { 'x-api-key': API_KEY },
    body: { id: 'hacked-id', created_at: '1970-01-01' },
    expect: { status: 400, errorContains: 'No valid fields' }
  })

  // C.5: Type validation
  await test('C.5 Type validation tech_stack', '/api/projects/command-center', {
    method: 'PATCH',
    headers: { 'x-api-key': API_KEY },
    body: { tech_stack: 'not-an-array' },
    expect: { status: 400, errorContains: 'must be an array' }
  })

  console.log('=== ANGLE D: EDGE CASE TESTS ===\n')

  // D.1: POST without name
  await test('D.1 POST no name', '/api/projects/command-center/memories', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: { content: 'no name' },
    expect: { status: 400, errorContains: 'name and content required' }
  })

  // D.2: POST without content
  await test('D.2 POST no content', '/api/projects/command-center/memories', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: { name: 'empty' },
    expect: { status: 400, errorContains: 'name and content required' }
  })

  // D.3: POST empty body
  await test('D.3 POST empty body', '/api/projects/command-center/memories', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: {},
    expect: { status: 400, errorContains: 'name and content required' }
  })

  // D.4: POST invalid JSON
  await test('D.4 POST invalid JSON', '/api/projects/command-center/memories', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: 'this is not json',
    expect: { status: 400 }
  })

  // D.5: PATCH without valid fields
  await test('D.5 PATCH no valid fields', '/api/projects/command-center', {
    method: 'PATCH',
    headers: { 'x-api-key': API_KEY },
    body: { invalid_field: 'test' },
    expect: { status: 400, errorContains: 'No valid fields' }
  })

  // D.6: Memories for non-existent project
  await test('D.6 Non-existent project', '/api/projects/does-not-exist-project/memories', {
    expect: { status: 200, hasKey: 'memories' }
  })

  // D.7: Invalid URL encoding
  await test('D.7 Invalid URL encoding', '/api/projects/command-center/memories/%E0%A4%A', {
    expect: { status: 400 }
  })

  // Print results table
  console.log('\n========================================')
  console.log('         TEST RESULTS SUMMARY')
  console.log('========================================\n')

  let passed = 0, failed = 0, errors = 0
  for (const r of results) {
    const icon = r.pass === 'PASS' ? 'OK' : r.pass === 'FAIL' ? 'FAIL' : 'ERR'
    console.log(`[${icon}] ${r.name} — ${r.detail}`)
    if (r.pass !== 'PASS') console.log(`     Response: ${r.body}`)
    if (r.pass === 'PASS') passed++
    else if (r.pass === 'FAIL') failed++
    else errors++
  }

  console.log(`\n--- TOTALS: ${passed} PASS | ${failed} FAIL | ${errors} ERROR ---`)
}

run().catch(console.error)
