'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core'
import { Task, TaskStatus } from '@/lib/tasks'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { AddTaskModal } from './AddTaskModal'

interface KanbanBoardProps {
  initialTasks: Task[]
  projects?: string[]
}

const columns: TaskStatus[] = ['backlog', 'todo', 'doing', 'done']

export function KanbanBoard({ initialTasks, projects = [] }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem('kanban-collapsed')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  const toggleColumn = (status: TaskStatus) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      localStorage.setItem('kanban-collapsed', JSON.stringify([...next]))
      return next
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position)
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    // Check if over is a column
    if (columns.includes(overId as TaskStatus)) {
      if (activeTask.status !== overId) {
        setTasks(prev =>
          prev.map(t =>
            t.id === activeId ? { ...t, status: overId as TaskStatus } : t
          )
        )
      }
      return
    }

    // Over is another task
    const overTask = tasks.find(t => t.id === overId)
    if (!overTask) return

    if (activeTask.status !== overTask.status) {
      setTasks(prev =>
        prev.map(t =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const task = tasks.find(t => t.id === activeId)
    if (!task) return

    // Update in database
    try {
      await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: task.status }),
      })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleAddTask = async (taskData: { project: string; title: string; description?: string; priority?: string }) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          status: 'backlog',
          position: tasks.filter(t => t.status === 'backlog').length,
        }),
      })

      if (response.ok) {
        const newTask = await response.json()
        setTasks(prev => [...prev, newTask])
        setIsAddModalOpen(false)
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {tasks.length} tasks total
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {columns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              collapsed={collapsedColumns.has(status)}
              onToggleCollapse={() => toggleColumn(status)}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      {isAddModalOpen && (
        <AddTaskModal
          projects={projects}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  )
}
