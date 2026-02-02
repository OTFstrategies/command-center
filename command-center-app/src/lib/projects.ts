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
