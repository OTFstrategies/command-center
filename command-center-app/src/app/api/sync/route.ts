import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// Initialize Supabase with service role for write access
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

// Type mapping from registry JSON to database
type RegistryType = 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction'

interface RegistryItem {
  id: string
  name: string
  path: string
  description?: string
  created: string
  project: string
  tags?: string[]
  // Type-specific fields stored in metadata
  [key: string]: unknown
}

interface SyncPayload {
  type: RegistryType
  items: RegistryItem[]
}

// POST /api/sync - Sync registry items to Supabase
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.SYNC_API_KEY

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'SYNC_API_KEY not configured on server' },
        { status: 500 }
      )
    }

    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, items } = body as SyncPayload

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid payload: type and items[] required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Transform items to database format
    const dbItems = items.map((item) => {
      // Extract known fields, rest goes to metadata
      const { id: originalId, name, path, description, created, project, tags, ...metadata } = item

      return {
        id: randomUUID(), // Generate proper UUID for database
        type,
        name,
        path,
        description: description || null,
        project: project || 'global',
        tags: tags || [],
        metadata: { ...metadata, originalId }, // Store original ID in metadata
        created_at: new Date(created).toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    // Delete existing items of this type, then insert new ones
    const { error: deleteError } = await supabase
      .from('registry_items')
      .delete()
      .eq('type', type)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: `Failed to clear existing ${type} items: ${deleteError.message}` },
        { status: 500 }
      )
    }

    // Insert new items
    if (dbItems.length > 0) {
      const { error: insertError } = await supabase
        .from('registry_items')
        .insert(dbItems)

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          { error: `Failed to insert ${type} items: ${insertError.message}` },
          { status: 500 }
        )
      }
    }

    // Log sync activity
    await supabase.from('activity_log').insert({
      item_type: type,
      item_id: 'sync',
      item_name: `${type} sync`,
      action: 'synced',
      details: { count: dbItems.length, timestamp: new Date().toISOString() },
    })

    return NextResponse.json({
      success: true,
      type,
      count: dbItems.length,
      message: `Synced ${dbItems.length} ${type} items`,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/sync - Get sync status
export async function GET() {
  try {
    const supabase = getSupabase()

    // Get counts per type
    const types: RegistryType[] = ['api', 'prompt', 'skill', 'agent', 'command', 'instruction']
    const stats: Record<string, number> = {}

    for (const type of types) {
      const { count } = await supabase
        .from('registry_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', type)

      stats[type] = count || 0
    }

    // Get last sync times from activity log
    const { data: syncLogs } = await supabase
      .from('activity_log')
      .select('item_type, created_at')
      .eq('action', 'synced')
      .order('created_at', { ascending: false })
      .limit(20)

    const lastSynced: Record<string, string> = {}
    for (const log of syncLogs || []) {
      if (!lastSynced[log.item_type]) {
        lastSynced[log.item_type] = log.created_at
      }
    }

    return NextResponse.json({
      connected: true,
      stats,
      lastSynced,
    })
  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json(
      { connected: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
