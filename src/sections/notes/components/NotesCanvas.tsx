import { useState, useRef, useCallback } from 'react'
import { ChevronDown, ZoomIn, ZoomOut } from 'lucide-react'
import type { NotesData, CanvasViewport } from '@/../product/sections/notes/types'
import { NoteCard } from './NoteCard'
import { ConnectionLine } from './ConnectionLine'

export interface NotesCanvasProps {
  data: NotesData
  onProjectChange?: (project: string) => void
  onNoteMove?: (noteId: string, x: number, y: number) => void
  onNoteEdit?: (noteId: string) => void
  onNoteCreate?: (x: number, y: number) => void
  onViewportChange?: (viewport: CanvasViewport) => void
}

export function NotesCanvas({
  data,
  onProjectChange,
  onNoteMove,
  onNoteEdit,
  onNoteCreate,
  onViewportChange,
}: NotesCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showProjectMenu, setShowProjectMenu] = useState(false)

  // Get current canvas
  const currentCanvas = data.canvases.find(c => c.project === data.currentProject)
  const notes = currentCanvas?.notes || []
  const viewport = currentCanvas?.viewport || { x: 0, y: 0, zoom: 1 }

  // Get all projects
  const projects = data.canvases.map(c => c.project)

  // Create a map for quick note lookup
  const noteMap = new Map(notes.map(n => [n.id, n]))

  // Handle canvas pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current) {
      // Left click on empty canvas - deselect and start pan
      setSelectedNoteId(null)
      setIsPanning(true)
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y })
    }
  }

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const newX = e.clientX - panStart.x
      const newY = e.clientY - panStart.y
      onViewportChange?.({ ...viewport, x: newX, y: newY })
    }
  }, [isPanning, panStart, viewport, onViewportChange])

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
  }

  // Handle zoom
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.25, Math.min(2, viewport.zoom + delta))
    onViewportChange?.({ ...viewport, zoom: newZoom })
  }

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      handleZoom(delta)
    }
  }, [viewport])

  // Handle double click to create note
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - viewport.x) / viewport.zoom
      const y = (e.clientY - rect.top - viewport.y) / viewport.zoom
      onNoteCreate?.(x, y)
    }
  }

  // Handle note move
  const handleNoteMove = (noteId: string, x: number, y: number) => {
    onNoteMove?.(noteId, x, y)
  }

  return (
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        {/* Project selector */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            {data.currentProject}
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </button>

          {showProjectMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProjectMenu(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {projects.map((project) => (
                  <button
                    key={project}
                    onClick={() => {
                      onProjectChange?.(project)
                      setShowProjectMenu(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      project === data.currentProject
                        ? 'font-medium text-blue-600 dark:text-blue-400'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {project}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-0.1)}
            className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs text-zinc-500 dark:text-zinc-400">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.1)}
            className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`relative flex-1 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        style={{
          backgroundImage: `
            radial-gradient(circle, rgb(212 212 216 / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        {/* Connections layer */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px)`,
          }}
        >
          {notes.map((note) =>
            note.connections.map((targetId) => {
              const targetNote = noteMap.get(targetId)
              if (!targetNote) return null
              return (
                <ConnectionLine
                  key={`${note.id}-${targetId}`}
                  fromNote={note}
                  toNote={targetNote}
                  zoom={viewport.zoom}
                />
              )
            })
          )}
        </svg>

        {/* Notes layer */}
        <div
          className="absolute"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px)`,
          }}
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              zoom={viewport.zoom}
              onSelect={() => setSelectedNoteId(note.id)}
              onMove={(x, y) => handleNoteMove(note.id, x, y)}
              onEdit={() => onNoteEdit?.(note.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Dubbelklik om een notitie toe te voegen
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
