import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or SERVICE_ROLE_KEY not configured')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/sync/inbox/process - Process pending inbox items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { id } = body // Optional: process specific item

    const supabase = getSupabase()

    // Fetch pending items
    let query = supabase
      .from('inbox_pending')
      .select('*')
      .eq('status', 'pending')

    if (id) {
      query = query.eq('id', id)
    }

    const { data: pendingItems, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!pendingItems || pendingItems.length === 0) {
      return NextResponse.json({ message: 'No pending items', processed: 0 })
    }

    const results = []

    for (const item of pendingItems) {
      // Mark as processing
      await supabase
        .from('inbox_pending')
        .update({ status: 'processing' })
        .eq('id', item.id)

      try {
        const registryData = item.registry_data as Record<string, unknown[]>
        let totalSynced = 0

        // Process each type in the registry data
        for (const [type, items] of Object.entries(registryData)) {
          if (!Array.isArray(items) || items.length === 0) continue

          // Delete existing items for this type + project
          await supabase
            .from('registry_items')
            .delete()
            .eq('type', type)
            .eq('project', item.project)

          // Transform and insert
          const typedItems = items as Record<string, unknown>[]
          const dbItems = typedItems.map((regItem) => {
            const { id: originalId, name, path, description, created, project, tags, ...metadata } = regItem as {
              id?: string; name: string; path: string; description?: string;
              created?: string; project?: string; tags?: string[];
              [key: string]: unknown
            }

            return {
              id: randomUUID(),
              type,
              name: name || 'unnamed',
              path: path || '',
              description: (description as string) || null,
              project: item.project,
              tags: (tags as string[]) || [],
              metadata: { ...metadata, originalId },
              created_at: created ? new Date(created as string).toISOString() : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          })

          const { error: insertError } = await supabase
            .from('registry_items')
            .insert(dbItems)

          if (insertError) {
            console.error(`Insert error for ${type}:`, insertError)
          } else {
            totalSynced += dbItems.length
          }
        }

        // Auto-create project if needed
        const slug = item.slug
        const { data: existingProject } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', slug)
          .limit(1)
          .single()

        if (!existingProject) {
          await supabase.from('projects').insert({
            name: item.project,
            slug,
            description: (item.project_meta as { description?: string })?.description || null,
          })
        }

        // Log to changelog
        await supabase.from('project_changelog').insert({
          project: item.project,
          title: `Inbox sync: ${totalSynced} items`,
          description: `Synced via inbox from dashboard`,
          change_type: 'sync',
          items_affected: [],
          metadata: { source: 'inbox', totalItems: totalSynced },
        })

        // Log activity
        await supabase.from('activity_log').insert({
          item_type: 'sync',
          item_id: null,
          item_name: `${item.project} inbox sync`,
          action: 'synced',
          details: { count: totalSynced, source: 'inbox' },
        })

        // Mark as synced
        await supabase
          .from('inbox_pending')
          .update({ status: 'synced', synced_at: new Date().toISOString() })
          .eq('id', item.id)

        results.push({
          id: item.id,
          project: item.project,
          itemsSynced: totalSynced,
          status: 'synced',
        })
      } catch (processError) {
        console.error(`Error processing ${item.project}:`, processError)

        await supabase
          .from('inbox_pending')
          .update({ status: 'error' })
          .eq('id', item.id)

        results.push({
          id: item.id,
          project: item.project,
          status: 'error',
          error: processError instanceof Error ? processError.message : 'Unknown',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Process inbox error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
