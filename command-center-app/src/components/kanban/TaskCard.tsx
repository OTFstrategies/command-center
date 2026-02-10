'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, TaskPriority } from '@/lib/tasks'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (id: string) => void
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  high: 'bg-state-warning-bg text-state-warning-text',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
}

const priorityBorderHex: Record<TaskPriority, string> = {
  low: '#9ca3af',
  medium: '#71717a',
  high: '#a1a1aa',
  urgent: '#ef4444',
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: priorityBorderHex[task.priority],
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        border-l-[3px]
        p-3 cursor-grab active:cursor-grabbing
        hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm
        transition-all duration-150
        ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-zinc-400/30' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex-1">
          {task.title}
        </h4>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
          {task.project}
        </span>

        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(task) }}
                className="text-gray-400 hover:text-foreground p-1"
                title="Edit"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
