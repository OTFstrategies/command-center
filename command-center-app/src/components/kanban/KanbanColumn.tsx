'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown } from 'lucide-react'
import { Task, TaskStatus } from '@/lib/tasks'
import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (id: string) => void
}

const statusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  backlog: {
    label: 'Backlog',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  todo: {
    label: 'To Do',
    color: 'text-zinc-700 dark:text-zinc-300',
    bgColor: 'bg-zinc-50 dark:bg-zinc-900/20',
  },
  doing: {
    label: 'In Progress',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  done: {
    label: 'Done',
    color: 'text-zinc-600 dark:text-zinc-300',
    bgColor: 'bg-zinc-50 dark:bg-zinc-800/20',
  },
}

export function KanbanColumn({ status, tasks, collapsed, onToggleCollapse, onEditTask, onDeleteTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const config = statusConfig[status]

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-h-[500px] rounded-lg border
        ${config.bgColor}
        ${isOver ? 'border-zinc-400 ring-2 ring-zinc-400/30' : 'border-gray-200 dark:border-gray-700'}
        transition-all duration-150
      `}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1"
          >
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
            <h3 className={`font-semibold ${config.color}`}>
              {config.label}
            </h3>
          </button>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              No tasks
            </div>
          )}
        </div>
      )}
    </div>
  )
}
