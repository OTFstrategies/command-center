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
