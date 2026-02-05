import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase not configured')
    supabase = createClient(url, key)
  }
  return supabase
}

export interface Task {
  id: string
  project: string
  title: string
  description: string | null
  status: 'backlog' | 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  position: number
  created_at: string
  updated_at: string
}

export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']

export async function getTasks(project?: string): Promise<Task[]> {
  try {
    let query = getSupabase()
      .from('kanban_tasks')
      .select('*')
      .order('position')

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return []
    }

    return data || []
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function getTasksByStatus(status: TaskStatus, project?: string): Promise<Task[]> {
  try {
    let query = getSupabase()
      .from('kanban_tasks')
      .select('*')
      .eq('status', status)
      .order('position')

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks by status:', error)
      return []
    }

    return data || []
  } catch (e) {
    console.error('Supabase not configured:', e)
    return []
  }
}

export async function createTask(task: {
  project: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  position?: number
}): Promise<Task | null> {
  try {
    const { data, error } = await getSupabase()
      .from('kanban_tasks')
      .insert({
        project: task.project,
        title: task.title,
        description: task.description || null,
        status: task.status || 'backlog',
        priority: task.priority || 'medium',
        position: task.position || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return null
    }

    return data
  } catch (e) {
    console.error('Supabase not configured:', e)
    return null
  }
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task | null> {
  try {
    const { data, error } = await getSupabase()
      .from('kanban_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return null
    }

    return data
  } catch (e) {
    console.error('Supabase not configured:', e)
    return null
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const { error } = await getSupabase()
      .from('kanban_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      return false
    }

    return true
  } catch (e) {
    console.error('Supabase not configured:', e)
    return false
  }
}

export async function moveTask(id: string, newStatus: TaskStatus, newPosition: number): Promise<Task | null> {
  return updateTask(id, { status: newStatus, position: newPosition })
}

export async function reorderTasks(taskUpdates: { id: string; position: number }[]): Promise<boolean> {
  try {
    const client = getSupabase()

    for (const { id, position } of taskUpdates) {
      const { error } = await client
        .from('kanban_tasks')
        .update({ position, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error reordering task:', error)
        return false
      }
    }

    return true
  } catch (e) {
    console.error('Supabase not configured:', e)
    return false
  }
}
