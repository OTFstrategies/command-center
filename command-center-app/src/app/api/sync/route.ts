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

    // Get existing items to detect changes
    const { data: existingItems } = await supabase
      .from('registry_items')
      .select('name, project')
      .eq('type', type)

    const existingNames = new Set((existingItems || []).map(i => `${i.project}:${i.name}`))
    const newNames = new Set(items.map(i => `${i.project || 'global'}:${i.name}`))

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

    // Calculate changes per project
    const changesByProject = new Map<string, { added: string[], removed: string[] }>()

    // Find added items
    for (const item of dbItems) {
      const key = `${item.project}:${item.name}`
      if (!existingNames.has(key)) {
        if (!changesByProject.has(item.project)) {
          changesByProject.set(item.project, { added: [], removed: [] })
        }
        changesByProject.get(item.project)!.added.push(item.name)
      }
    }

    // Find removed items
    for (const existing of existingItems || []) {
      const key = `${existing.project}:${existing.name}`
      if (!newNames.has(key)) {
        const project = existing.project || 'global'
        if (!changesByProject.has(project)) {
          changesByProject.set(project, { added: [], removed: [] })
        }
        changesByProject.get(project)!.removed.push(existing.name)
      }
    }

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
      item_id: null,
      item_name: `${type} sync`,
      action: 'synced',
      details: { count: dbItems.length, timestamp: new Date().toISOString() },
    })

    // Create changelog entries for each project with changes
    const changelogEntries = []
    for (const [project, changes] of changesByProject) {
      if (changes.added.length > 0) {
        changelogEntries.push({
          project,
          title: `Added ${changes.added.length} ${type}${changes.added.length > 1 ? 's' : ''}`,
          description: `New: ${changes.added.join(', ')}`,
          change_type: 'added',
          items_affected: changes.added,
          metadata: { type, action: 'sync' },
        })
      }
      if (changes.removed.length > 0) {
        changelogEntries.push({
          project,
          title: `Removed ${changes.removed.length} ${type}${changes.removed.length > 1 ? 's' : ''}`,
          description: `Removed: ${changes.removed.join(', ')}`,
          change_type: 'removed',
          items_affected: changes.removed,
          metadata: { type, action: 'sync' },
        })
      }
    }

    // Insert changelog entries
    if (changelogEntries.length > 0) {
      await supabase.from('project_changelog').insert(changelogEntries)
    }

    // Auto-create projects in projects table if they don't exist
    const uniqueProjects = [...new Set(dbItems.map(i => i.project).filter(p => p !== 'global'))]
    for (const projectName of uniqueProjects) {
      const slug = projectName.toLowerCase().replace(/\s+/g, '-')

      // Check if project exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .limit(1)
        .single()

      if (!existingProject) {
        // Create new project
        await supabase.from('projects').insert({
          name: projectName,
          slug,
          description: null,
        })

        // Log project creation in changelog
        await supabase.from('project_changelog').insert({
          project: projectName,
          title: 'Project created',
          description: `Project "${projectName}" auto-created during sync`,
          change_type: 'added',
          items_affected: [],
          metadata: { auto_created: true },
        })
      }
    }

    return NextResponse.json({
      success: true,
      type,
      count: dbItems.length,
      message: `Synced ${dbItems.length} ${type} items`,
      changelog: changelogEntries.length,
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
