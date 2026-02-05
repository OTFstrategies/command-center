import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Use service role key for server-side queries to bypass RLS
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase environment variables not configured')
    }

    supabase = createClient(url, key)
  }
  return supabase
}

// =============================================================================
// TYPES
// =============================================================================

interface RegistryItem {
  id: string
  type: 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction'
  name: string
  path: string
  description: string | null
  project: string
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// =============================================================================
// PUBLIC API
// =============================================================================

export async function getAgents(project?: string | null) {
  try {
    let query = getSupabase()
      .from('registry_items')
      .select('*')
      .eq('type', 'agent')

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching agents:', error)
      return []
    }

    return (data || []).map((item: RegistryItem) => ({
      id: item.id,
      name: item.name,
      toolCount: (item.metadata?.tools as string[])?.length || 0,
      parent: item.metadata?.parent as string | undefined,
      project: item.project,
      description: item.description,
      tags: item.tags,
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getCommands(project?: string | null) {
  try {
    let query = getSupabase()
      .from('registry_items')
      .select('*')
      .eq('type', 'command')

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching commands:', error)
      return []
    }

    const items = data || []

    // Group by category (first part of name before /)
    const categories = new Map<string, RegistryItem[]>()

    for (const item of items) {
      const category = item.name.includes('/')
        ? item.name.split('/')[0]
        : 'general'

      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(item)
    }

    return Array.from(categories.entries()).map(([name, commands]) => ({
      name,
      isExpanded: true,
      commands: commands.map((cmd: RegistryItem) => ({
        id: cmd.id,
        name: cmd.name,
        description: cmd.description,
        hasSubcommands: ((cmd.metadata?.subcommands as string[])?.length || 0) > 0,
        subcommandCount: (cmd.metadata?.subcommands as string[])?.length || 0,
      })),
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getSkills(project?: string | null) {
  try {
    let query = getSupabase()
      .from('registry_items')
      .select('*')
      .eq('type', 'skill')

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching skills:', error)
      return []
    }

    return (data || []).map((item: RegistryItem) => ({
      id: item.id,
      name: item.name,
      fileCount: (item.metadata?.files as string[])?.length || 0,
      project: item.project,
      description: item.description,
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getPrompts(project?: string | null) {
  try {
    let query = getSupabase()
      .from('registry_items')
      .select('*')
      .eq('type', 'prompt')

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching prompts:', error)
      return []
    }

    return (data || []).map((item: RegistryItem) => ({
      id: item.id,
      name: item.name,
      type: (item.metadata?.type as string) || 'template',
      preview: item.description?.slice(0, 100) + '...' || '',
      project: item.project,
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getApis(project?: string | null) {
  try {
    let query = getSupabase()
      .from('registry_items')
      .select('*')
      .eq('type', 'api')

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching apis:', error)
      return []
    }

    return (data || []).map((item: RegistryItem) => ({
      id: item.id,
      name: item.name,
      service: (item.metadata?.service as string) || item.name.toLowerCase(),
      authType: (item.metadata?.authType as string) || 'api_key',
      project: item.project,
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getInstructions(project?: string | null) {
  try {
    let query = getSupabase()
      .from('registry_items')
      .select('*')
      .eq('type', 'instruction')

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching instructions:', error)
      return []
    }

    return (data || []).map((item: RegistryItem) => ({
      id: item.id,
      name: item.name,
      scope: (item.metadata?.scope as string) || 'project',
      project: item.project,
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getProjects(): Promise<string[]> {
  try {
    const { data, error } = await getSupabase()
      .from('registry_items')
      .select('project')

    if (error) {
      console.error('Error fetching projects:', error)
      return []
    }

    const uniqueProjects = [...new Set((data || []).map((item: { project: string }) => item.project).filter(Boolean))]
    return uniqueProjects.sort()
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getStats(project?: string | null) {
  const [agents, commands, skills, prompts, apis, instructions] = await Promise.all([
    getAgents(project),
    getCommands(project),
    getSkills(project),
    getPrompts(project),
    getApis(project),
    getInstructions(project),
  ])

  // Flatten commands to count total
  const totalCommands = commands.reduce((sum, cat) => sum + cat.commands.length, 0)

  return {
    apis: apis.length,
    prompts: prompts.length,
    skills: skills.length,
    agents: agents.length,
    commands: totalCommands,
    instructions: instructions.length,
  }
}

export async function getRecentActivity(project?: string | null) {
  try {
    let query = getSupabase()
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching activity:', error)
      return []
    }

    return (data || []).map((item: {
      id: string
      item_type: string
      item_id: string
      item_name: string
      action: string
      created_at: string
      details: { project?: string }
    }) => ({
      id: item.id,
      type: item.item_type as 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction',
      assetId: item.item_id,
      assetName: item.item_name,
      event: item.action as 'created' | 'used',
      timestamp: item.created_at,
      relativeTime: getRelativeTime(item.created_at),
      project: item.details?.project || 'global',
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// =============================================================================
// CHANGELOG FUNCTIONS
// =============================================================================

export type ChangelogEntryType = 'added' | 'updated' | 'removed' | 'sync'

export interface ChangelogEntry {
  id: string
  project: string
  title: string
  description: string | null
  change_type: ChangelogEntryType
  items_affected: string[]
  metadata: Record<string, unknown>
  created_at: string
  relativeTime: string
}

/**
 * Gets recent changelog entries across all projects
 */
export async function getRecentChanges(limit = 10): Promise<ChangelogEntry[]> {
  try {
    const { data, error } = await getSupabase()
      .from('project_changelog')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching changelog:', error)
      return []
    }

    return (data || []).map((item: {
      id: string
      project: string
      title: string
      description: string | null
      change_type: ChangelogEntryType
      items_affected: string[]
      metadata: Record<string, unknown>
      created_at: string
    }) => ({
      id: item.id,
      project: item.project || 'global',
      title: item.title || item.description || 'Update',
      description: item.description,
      change_type: item.change_type || 'sync',
      items_affected: item.items_affected || [],
      metadata: item.metadata || {},
      created_at: item.created_at,
      relativeTime: getRelativeTime(item.created_at),
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

/**
 * Gets changelog entries for a specific project
 */
export async function getProjectChangelog(project: string, limit = 20): Promise<ChangelogEntry[]> {
  try {
    const { data, error } = await getSupabase()
      .from('project_changelog')
      .select('*')
      .eq('project', project)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching project changelog:', error)
      return []
    }

    return (data || []).map((item: {
      id: string
      project: string
      title: string
      description: string | null
      change_type: ChangelogEntryType
      items_affected: string[]
      metadata: Record<string, unknown>
      created_at: string
    }) => ({
      id: item.id,
      project: item.project || project,
      title: item.title || item.description || 'Update',
      description: item.description,
      change_type: item.change_type || 'sync',
      items_affected: item.items_affected || [],
      metadata: item.metadata || {},
      created_at: item.created_at,
      relativeTime: getRelativeTime(item.created_at),
    }))
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

/**
 * Adds a changelog entry (used by sync API)
 */
export async function addChangelogEntry(entry: {
  project: string
  title: string
  description?: string
  change_type: ChangelogEntryType
  items_affected?: string[]
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  try {
    const { error } = await getSupabase()
      .from('project_changelog')
      .insert({
        project: entry.project,
        title: entry.title,
        description: entry.description || null,
        change_type: entry.change_type,
        items_affected: entry.items_affected || [],
        metadata: entry.metadata || {},
      })

    if (error) {
      console.error('Error adding changelog entry:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('Supabase not configured:', e)
    return false
  }
}
