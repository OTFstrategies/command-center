import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase environment variables not configured')
    }

    supabase = createClient(url, key)
  }
  return supabase
}

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  updated_at: string
}

export interface ProjectFolder {
  id: string
  path: string
  description: string | null
  sort_order: number
}

export interface ProjectCredential {
  id: string
  service: string
  username: string | null
  password: string | null
  notes: string | null
}

export interface ProjectChangelog {
  id: string
  description: string
  created_at: string
}

export interface ProjectDetail extends Project {
  folders: ProjectFolder[]
  credentials: ProjectCredential[]
  changelog: ProjectChangelog[]
}

export async function getProjects(): Promise<Project[]> {
  try {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('id, name, slug, description, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching projects:', error)
      return []
    }
    return data || []
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  try {
    const client = getSupabase()
    const { data: project, error } = await client
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !project) return null

    const [folders, credentials, changelog] = await Promise.all([
      client.from('project_folders').select('*').eq('project_id', project.id).order('sort_order'),
      client.from('project_credentials').select('*').eq('project_id', project.id),
      client.from('project_changelog').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    ])

    return {
      ...project,
      folders: folders.data || [],
      credentials: credentials.data || [],
      changelog: changelog.data || [],
    }
  } catch (e) {
    console.error('Supabase not configured:', e)
    return null
  }
}

// =============================================================================
// UNIFIED PROJECT SOURCE (registry_items + projects table)
// =============================================================================

export interface UnifiedProject {
  name: string           // project name from registry_items.project
  slug: string           // URL-safe version of name
  description: string | null
  itemCount: number      // total items in registry
  hasMetadata: boolean   // true if exists in projects table
  updated_at: string | null
}

/**
 * Gets all unique projects from registry_items, enriched with metadata from projects table if available.
 * This is the primary source for project listings.
 */
export async function getProjectsFromRegistry(): Promise<UnifiedProject[]> {
  try {
    const client = getSupabase()

    // Get unique projects from registry_items with counts
    const { data: registryData, error: registryError } = await client
      .from('registry_items')
      .select('project')

    if (registryError) {
      console.error('Error fetching registry projects:', registryError)
      return []
    }

    // Count items per project
    const projectCounts = new Map<string, number>()
    for (const item of registryData || []) {
      if (item.project) {
        projectCounts.set(item.project, (projectCounts.get(item.project) || 0) + 1)
      }
    }

    // Get metadata from projects table
    const { data: projectsData } = await client
      .from('projects')
      .select('name, slug, description, updated_at')

    const projectMetadata = new Map<string, { description: string | null; updated_at: string }>()
    for (const p of projectsData || []) {
      // Match by slug or name (case-insensitive)
      projectMetadata.set(p.slug.toLowerCase(), { description: p.description, updated_at: p.updated_at })
      projectMetadata.set(p.name.toLowerCase(), { description: p.description, updated_at: p.updated_at })
    }

    // Build unified project list
    const projects: UnifiedProject[] = []
    for (const [name, count] of projectCounts) {
      const slug = name.toLowerCase().replace(/\s+/g, '-')
      const metadata = projectMetadata.get(slug) || projectMetadata.get(name.toLowerCase())

      projects.push({
        name,
        slug,
        description: metadata?.description || null,
        itemCount: count,
        hasMetadata: !!metadata,
        updated_at: metadata?.updated_at || null,
      })
    }

    // Sort: projects with metadata first, then by item count
    return projects.sort((a, b) => {
      if (a.hasMetadata !== b.hasMetadata) return a.hasMetadata ? -1 : 1
      return b.itemCount - a.itemCount
    })
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

/**
 * Gets a project by name (from registry_items.project), with all related data.
 * Uses registry_items as primary source, enriched with projects table data.
 */
export async function getProjectByName(projectName: string): Promise<ProjectDetail | null> {
  try {
    const client = getSupabase()

    // Check if project exists in registry_items
    const { data: registryItems, error: registryError } = await client
      .from('registry_items')
      .select('id')
      .eq('project', projectName)
      .limit(1)

    if (registryError || !registryItems || registryItems.length === 0) {
      return null
    }

    // Try to find matching project in projects table
    const slug = projectName.toLowerCase().replace(/\s+/g, '-')
    const { data: projectData } = await client
      .from('projects')
      .select('*')
      .or(`slug.eq.${slug},name.ilike.${projectName}`)
      .limit(1)
      .single()

    // Get changelog for this project (by project name string)
    const { data: changelogData } = await client
      .from('project_changelog')
      .select('*')
      .eq('project', projectName)
      .order('created_at', { ascending: false })
      .limit(20)

    // If we have a project record, get folders and credentials
    let folders: ProjectFolder[] = []
    let credentials: ProjectCredential[] = []

    if (projectData) {
      const [foldersResult, credentialsResult] = await Promise.all([
        client.from('project_folders').select('*').eq('project_id', projectData.id).order('sort_order'),
        client.from('project_credentials').select('*').eq('project_id', projectData.id),
      ])
      folders = foldersResult.data || []
      credentials = credentialsResult.data || []
    }

    return {
      id: projectData?.id || projectName,
      name: projectData?.name || projectName,
      slug: projectData?.slug || slug,
      description: projectData?.description || null,
      updated_at: projectData?.updated_at || new Date().toISOString(),
      folders,
      credentials,
      changelog: changelogData || [],
    }
  } catch (e) {
    console.error('Error fetching project by name:', e)
    return null
  }
}
