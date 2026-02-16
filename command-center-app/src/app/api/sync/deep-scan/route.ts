import { NextRequest, NextResponse } from 'next/server'
import { storeDeepScanResult } from '@/lib/deep-scan/storage'
import type { DeepScanResult } from '@/lib/deep-scan/types'

/**
 * POST /api/sync/deep-scan
 *
 * Receives pre-computed Deep Scan results and stores them in Supabase.
 * The scan itself runs locally (not on Vercel) via scripts/deep-scan.ts
 *
 * Body: DeepScanResult JSON
 * Auth: x-api-key header
 */
export async function POST(request: NextRequest) {
  // Auth check
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate the scan result structure
    const result = body as DeepScanResult
    if (!result.items || !result.relationships || !result.stats) {
      return NextResponse.json(
        { error: 'Invalid scan result: missing items, relationships, or stats' },
        { status: 400 }
      )
    }

    // Store the scan results
    await storeDeepScanResult(result)

    return NextResponse.json({
      success: true,
      stats: result.stats,
    })
  } catch (error) {
    console.error('Deep scan storage error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Storage failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync/deep-scan
 *
 * Returns the latest scan stats from Supabase
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
        },
      }
    )

    const [relationships, hierarchies, clusters, insights] = await Promise.all([
      supabase.from('entity_relationships').select('id', { count: 'exact', head: true }),
      supabase.from('asset_hierarchy').select('id', { count: 'exact', head: true }),
      supabase.from('system_clusters').select('id', { count: 'exact', head: true }),
      supabase.from('map_insights').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      relationships: relationships.count || 0,
      hierarchies: hierarchies.count || 0,
      clusters: clusters.count || 0,
      insights: insights.count || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}
