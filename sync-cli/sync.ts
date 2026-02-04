#!/usr/bin/env npx tsx

/**
 * Command Center Sync CLI
 *
 * Syncs local ~/.claude/registry/*.json files to Supabase via the Command Center API.
 *
 * Usage:
 *   npx tsx sync.ts                    # Sync all types
 *   npx tsx sync.ts --type apis        # Sync only APIs
 *   npx tsx sync.ts --dry-run          # Preview without syncing
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Configuration
const REGISTRY_PATH = path.join(os.homedir(), '.claude', 'registry')
const API_URL = process.env.COMMAND_CENTER_URL || 'https://command-center-app-nine.vercel.app'
const API_KEY = process.env.COMMAND_CENTER_SYNC_KEY

// Type mapping: filename -> API type
const TYPE_MAP: Record<string, string> = {
  'apis.json': 'api',
  'prompts.json': 'prompt',
  'skills.json': 'skill',
  'agents.json': 'agent',
  'commands.json': 'command',
  'instructions.json': 'instruction',
}

interface RegistryFile {
  description?: string
  items: Array<Record<string, unknown>>
}

interface SyncResult {
  type: string
  success: boolean
  count: number
  error?: string
}

async function loadRegistryFile(filename: string): Promise<RegistryFile | null> {
  const filepath = path.join(REGISTRY_PATH, filename)

  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠ ${filename} not found, skipping`)
    return null
  }

  try {
    const content = fs.readFileSync(filepath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`  ✗ Failed to parse ${filename}:`, error)
    return null
  }
}

async function syncType(filename: string, dryRun: boolean): Promise<SyncResult> {
  const type = TYPE_MAP[filename]
  if (!type) {
    return { type: filename, success: false, count: 0, error: 'Unknown type' }
  }

  console.log(`\n→ Syncing ${type}...`)

  const data = await loadRegistryFile(filename)
  if (!data) {
    return { type, success: false, count: 0, error: 'File not found or invalid' }
  }

  const items = data.items || []
  console.log(`  Found ${items.length} items`)

  if (dryRun) {
    console.log(`  [DRY RUN] Would sync ${items.length} ${type} items`)
    items.forEach((item: Record<string, unknown>) => {
      console.log(`    - ${item.name} (${item.project})`)
    })
    return { type, success: true, count: items.length }
  }

  try {
    const response = await fetch(`${API_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY || '',
      },
      body: JSON.stringify({ type, items }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error(`  ✗ Failed: ${result.error || response.statusText}`)
      return { type, success: false, count: 0, error: result.error }
    }

    console.log(`  ✓ Synced ${result.count} items`)
    return { type, success: true, count: result.count }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`  ✗ Error: ${message}`)
    return { type, success: false, count: 0, error: message }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  // Parse --type argument
  let typeArg: string | undefined
  const typeEqualsArg = args.find(a => a.startsWith('--type='))
  if (typeEqualsArg) {
    typeArg = typeEqualsArg.split('=')[1]
  } else {
    const typeIndex = args.indexOf('--type')
    if (typeIndex !== -1 && args[typeIndex + 1] && !args[typeIndex + 1].startsWith('--')) {
      typeArg = args[typeIndex + 1]
    }
  }

  console.log('╔════════════════════════════════════════╗')
  console.log('║    Command Center Sync CLI             ║')
  console.log('╚════════════════════════════════════════╝')
  console.log('')
  console.log(`Registry: ${REGISTRY_PATH}`)
  console.log(`API:      ${API_URL}`)
  console.log(`Mode:     ${dryRun ? 'DRY RUN' : 'LIVE'}`)

  if (!API_KEY && !dryRun) {
    console.error('\n✗ Error: COMMAND_CENTER_SYNC_KEY environment variable not set')
    console.log('\nSet it with:')
    console.log('  export COMMAND_CENTER_SYNC_KEY=your-secret-key')
    process.exit(1)
  }

  // Check registry path exists
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`\n✗ Error: Registry path not found: ${REGISTRY_PATH}`)
    process.exit(1)
  }

  // Determine which files to sync
  let filesToSync = Object.keys(TYPE_MAP)

  if (typeArg) {
    const filename = `${typeArg}.json`
    if (!TYPE_MAP[filename]) {
      console.error(`\n✗ Error: Unknown type: ${typeArg}`)
      console.log('Available types:', Object.values(TYPE_MAP).join(', '))
      process.exit(1)
    }
    filesToSync = [filename]
  }

  // Sync each type
  const results: SyncResult[] = []

  for (const filename of filesToSync) {
    const result = await syncType(filename, dryRun)
    results.push(result)
  }

  // Summary
  console.log('\n────────────────────────────────────────')
  console.log('Summary:')

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const totalItems = successful.reduce((sum, r) => sum + r.count, 0)

  console.log(`  ✓ ${successful.length} types synced (${totalItems} items)`)

  if (failed.length > 0) {
    console.log(`  ✗ ${failed.length} types failed:`)
    failed.forEach(r => console.log(`    - ${r.type}: ${r.error}`))
  }

  console.log('')
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch(console.error)
