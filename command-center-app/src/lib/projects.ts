import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, description, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  return data || []
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !project) return null

  const [folders, credentials, changelog] = await Promise.all([
    supabase.from('project_folders').select('*').eq('project_id', project.id).order('sort_order'),
    supabase.from('project_credentials').select('*').eq('project_id', project.id),
    supabase.from('project_changelog').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
  ])

  return {
    ...project,
    folders: folders.data || [],
    credentials: credentials.data || [],
    changelog: changelog.data || [],
  }
}
