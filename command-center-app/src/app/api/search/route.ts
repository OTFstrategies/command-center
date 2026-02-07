import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase not configured')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET() {
  try {
    const supabase = getSupabase()

    const [registryResult, projectsResult, tasksResult] = await Promise.all([
      supabase.from('registry_items').select('id, type, name, description, project'),
      supabase.from('projects').select('id, name, slug, description'),
      supabase.from('kanban_tasks').select('id, title, project, status'),
    ])

    const items = []

    for (const item of registryResult.data || []) {
      items.push({
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        project: item.project,
        category: 'asset',
        href: `/registry?type=${item.type}&search=${encodeURIComponent(item.name)}`,
      })
    }

    for (const proj of projectsResult.data || []) {
      items.push({
        id: proj.id,
        type: 'project',
        name: proj.name,
        description: proj.description,
        project: proj.name,
        category: 'project',
        href: `/projects/${proj.slug}`,
      })
    }

    for (const task of tasksResult.data || []) {
      items.push({
        id: task.id,
        type: 'task',
        name: task.title,
        description: null,
        project: task.project,
        category: 'task',
        href: '/tasks',
      })
    }

    const pages = [
      { name: 'Home', href: '/', description: 'Dashboard overview' },
      { name: 'Registry', href: '/registry', description: 'Asset registry' },
      { name: 'Tasks', href: '/tasks', description: 'Kanban board' },
      { name: 'Activity', href: '/activity', description: 'Activity log' },
      { name: 'Settings', href: '/settings', description: 'Sync configuratie' },
    ]
    for (const page of pages) {
      items.push({
        id: `page-${page.href}`,
        type: 'page',
        name: page.name,
        description: page.description,
        project: null,
        category: 'page',
        href: page.href,
      })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ items: [], error: 'Search failed' }, { status: 500 })
  }
}
