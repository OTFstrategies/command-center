/**
 * Deep Scan Script
 * Runs locally to scan ~/.claude/ and store results in Supabase
 *
 * Usage:
 *   npx tsx scripts/deep-scan.ts
 *   npx tsx scripts/deep-scan.ts --base-path /custom/path
 *   npx tsx scripts/deep-scan.ts --api-only   (POST to API instead of direct Supabase)
 */

import * as fs from 'fs'
import * as path from 'path'
import { runDeepScan } from '../src/lib/deep-scan/index'
import { storeDeepScanResult } from '../src/lib/deep-scan/storage'

// Load .env.local if not already loaded
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  try {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) continue
      const key = trimmed.substring(0, eqIdx)
      const value = trimmed.substring(eqIdx + 1)
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // .env.local not found — environment variables must be set externally
  }
}

async function main() {
  loadEnvFile()

  const args = process.argv.slice(2)
  const basePathIdx = args.indexOf('--base-path')
  const basePath = basePathIdx >= 0 ? args[basePathIdx + 1] : undefined
  const apiOnly = args.includes('--api-only')

  console.log('=== Deep Scan ===')
  console.log(`Base path: ${basePath || '~/.claude/ (default)'}`)
  console.log('')

  // Run the scan
  console.log('Phase 1: Inventarisatie...')
  const result = await runDeepScan(basePath)

  console.log(`  ${result.stats.items_found} items gevonden`)
  console.log(`Phase 2: Hierarchie...`)
  console.log(`  ${result.stats.hierarchies_built} boom-relaties`)
  console.log(`Phase 3: Koppelingen...`)
  console.log(`  ${result.stats.relationships_detected} koppelingen`)
  console.log(`Phase 4: Groepen...`)
  console.log(`  ${result.stats.clusters_formed} groepen`)
  console.log(`Phase 5: Inzichten...`)
  console.log(`  ${result.stats.insights_generated} inzichten`)
  console.log('')
  console.log(`Scan voltooid in ${result.stats.duration_ms}ms`)
  console.log('')

  // Show summary
  console.log('=== Samenvatting ===')
  const typeCounts = new Map<string, number>()
  for (const item of result.items) {
    typeCounts.set(item.type, (typeCounts.get(item.type) || 0) + 1)
  }
  for (const [type, count] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`)
  }
  console.log('')

  console.log('=== Groepen ===')
  for (const cluster of result.clusters) {
    console.log(`  ${cluster.name} (${cluster.members.length} leden, ${cluster.health})`)
  }
  console.log('')

  console.log('=== Inzichten ===')
  for (const insight of result.insights) {
    const icon = insight.severity === 'warning' ? '!' : insight.severity === 'attention' ? '!' : 'i'
    console.log(`  [${icon}] ${insight.title}`)
  }
  console.log('')

  // Store results
  if (apiOnly) {
    // POST to API route
    const apiUrl = process.env.DEEP_SCAN_API_URL
      || 'https://command-center-app-nine.vercel.app/api/sync/deep-scan'
    const syncApiKey = process.env.SYNC_API_KEY

    if (!syncApiKey) {
      console.log('SYNC_API_KEY niet gevonden in .env.local of environment.')
      return
    }

    console.log(`Opslaan via API: ${apiUrl}...`)
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': syncApiKey,
        },
        body: JSON.stringify(result),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`Fout bij opslaan: ${response.status}`, error)
        return
      }

      const data = await response.json()
      console.log('Opgeslagen via API!', data)
    } catch (error) {
      console.error('Verbindingsfout:', error)
    }
  } else {
    // Direct Supabase storage (default — no API route needed)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Supabase credentials niet gevonden.')
      console.log('Zorg dat .env.local bestaat met NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY')
      return
    }

    console.log('Opslaan naar Supabase (direct)...')
    try {
      await storeDeepScanResult(result)
      console.log('Opgeslagen!')
      console.log(`  ${result.stats.relationships_detected} koppelingen`)
      console.log(`  ${result.stats.hierarchies_built} hierarchieen`)
      console.log(`  ${result.stats.clusters_formed} groepen`)
      console.log(`  ${result.stats.insights_generated} inzichten`)
    } catch (error) {
      console.error('Opslagfout:', error)
    }
  }
}

main().catch(console.error)
