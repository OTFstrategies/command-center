import { useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import type { Note } from '@/../product/sections/notes/types'

export interface NoteCardProps {
  note: Note
  isSelected?: boolean
  zoom: number
  onSelect?: () => void
  onMove?: (x: number, y: number) => void
  onResize?: (width: number, height: number) => void
  onEdit?: () => void
}

export function NoteCard({
  note,
  isSelected = false,
  zoom,
  onSelect,
  onMove,
  onEdit,
}: NoteCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    e.stopPropagation()
    onSelect?.()

    setIsDragging(true)
    setDragStart({
      x: e.clientX - note.position.x * zoom,
      y: e.clientY - note.position.y * zoom,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const newX = (e.clientX - dragStart.x) / zoom
    const newY = (e.clientY - dragStart.y) / zoom
    onMove?.(newX, newY)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.()
  }

  // Simple markdown rendering (basic)
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{line.slice(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{line.slice(3)}</h2>
        }
        if (line.startsWith('- [x] ')) {
          return <div key={i} className="flex items-center gap-2 text-xs text-zinc-500 line-through"><span>&#10003;</span>{line.slice(6)}</div>
        }
        if (line.startsWith('- [ ] ')) {
          return <div key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"><span className="opacity-30">&#9633;</span>{line.slice(6)}</div>
        }
        if (line.startsWith('- ')) {
          return <div key={i} className="text-xs text-zinc-600 dark:text-zinc-400 pl-2">{line.slice(2)}</div>
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />
        }
        return <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400">{line}</p>
      })
  }

  return (
    <div
      ref={cardRef}
      className={`
        absolute select-none rounded-lg border bg-white shadow-sm transition-shadow
        dark:bg-zinc-900
        ${isSelected
          ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
          : 'border-zinc-200 hover:border-zinc-300 hover:shadow dark:border-zinc-700 dark:hover:border-zinc-600'
        }
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      `}
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.size.width,
        minHeight: note.size.height,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <GripVertical className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
        <span className="flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {note.title}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-1 p-3">
        {renderContent(note.content)}
      </div>
    </div>
  )
}
