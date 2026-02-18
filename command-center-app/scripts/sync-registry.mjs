#!/usr/bin/env node
// sync-registry.mjs — Sync ~/.claude/registry/ naar CC v2 Supabase via /api/sync

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const REGISTRY_DIR = join(homedir(), '.claude', 'registry')
const API_BASE = process.env.CC_API_URL || 'https://command-center-app-nine.vercel.app'
const API_KEY = process.env.SYNC_API_KEY

const TYPE_MAP = {
  'agents.json': 'agent',
  'commands.json': 'command',
  'skills.json': 'skill',
  'prompts.json': 'prompt',
  'apis.json': 'api',
  'instructions.json': 'instruction',
}

async function syncType(filename, type) {
  const filePath = join(REGISTRY_DIR, filename)

  let data
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error(`  [SKIP] ${filename}: ${err.message}`)
    return { type, status: 'skipped', reason: err.message }
  }

  const items = data.items || []
  if (items.length === 0) {
    console.log(`  [SKIP] ${type}: 0 items`)
    return { type, status: 'skipped', reason: 'no items' }
  }

  const response = await fetch(`${API_BASE}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ type, items }),
  })

  const result = await response.json()

  if (response.ok) {
    console.log(`  [OK]   ${type}: ${result.count} items synced, ${result.changelog} changelog entries`)
    return { type, status: 'ok', count: result.count }
  } else {
    console.error(`  [FAIL] ${type}: ${result.error}`)
    return { type, status: 'error', error: result.error }
  }
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: SYNC_API_KEY environment variable is required')
    console.error('Usage: SYNC_API_KEY="your-key" node scripts/sync-registry.mjs')
    process.exit(1)
  }

  console.log(`\nSync Registry -> CC v2`)
  console.log(`Source: ${REGISTRY_DIR}`)
  console.log(`Target: ${API_BASE}/api/sync`)
  console.log('---')

  // Create job entry
  let jobId = null
  try {
    const jobRes = await fetch(`${API_BASE}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ type: 'registry_sync' }),
    })
    if (jobRes.ok) {
      const jobData = await jobRes.json()
      jobId = jobData.job?.id || jobData.id
      console.log(`Job created: ${jobId}`)
    }
  } catch {
    console.log('  [WARN] Could not create job entry (jobs table may not exist)')
  }

  let files
  try {
    files = readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.json'))
  } catch (err) {
    console.error(`ERROR: Cannot read ${REGISTRY_DIR}: ${err.message}`)
    process.exit(1)
  }

  const results = []
  const startTime = Date.now()

  for (const filename of files) {
    const type = TYPE_MAP[filename]
    if (!type) {
      console.log(`  [SKIP] ${filename}: unknown type`)
      continue
    }
    const result = await syncType(filename, type)
    results.push(result)
  }

  const duration = Date.now() - startTime

  console.log('\n--- Summary ---')
  const ok = results.filter(r => r.status === 'ok')
  const failed = results.filter(r => r.status === 'error')
  const skipped = results.filter(r => r.status === 'skipped')
  const totalItems = ok.reduce((sum, r) => sum + (r.count || 0), 0)

  console.log(`Synced: ${ok.length} types, ${totalItems} total items`)
  console.log(`Duration: ${duration}ms`)
  if (skipped.length) console.log(`Skipped: ${skipped.length} types`)
  if (failed.length) console.log(`Failed: ${failed.length} types`)

  // Update job status
  if (jobId) {
    try {
      await fetch(`${API_BASE}/api/jobs`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          id: jobId,
          type: 'registry_sync',
          status: failed.length > 0 ? 'failed' : 'completed',
          result: { types_ok: ok.length, types_failed: failed.length, total_items: totalItems },
          duration_ms: duration,
        }),
      })
      console.log('Job status updated')
    } catch {
      console.log('  [WARN] Could not update job status')
    }
  }

  process.exit(failed.length > 0 ? 1 : 0)
}

main()
