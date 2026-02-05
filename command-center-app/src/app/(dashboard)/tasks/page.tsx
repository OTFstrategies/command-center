import { getTasks } from '@/lib/tasks'
import { getProjects } from '@/lib/registry'
import { KanbanBoard } from '@/components/kanban'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([
    getTasks(),
    getProjects(),
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your project tasks with drag and drop
        </p>
      </div>

      <KanbanBoard initialTasks={tasks} projects={projects} />
    </div>
  )
}
