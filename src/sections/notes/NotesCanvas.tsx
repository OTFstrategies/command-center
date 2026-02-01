import { useState } from 'react'
import data from '@/../product/sections/notes/data.json'
import { NotesCanvas } from './components/NotesCanvas'
import type { NotesData, CanvasViewport } from '@/../product/sections/notes/types'

export default function NotesCanvasPreview() {
  const [notesData, setNotesData] = useState<NotesData>(data as NotesData)

  const handleProjectChange = (project: string) => {
    setNotesData(prev => ({ ...prev, currentProject: project }))
  }

  const handleNoteMove = (noteId: string, x: number, y: number) => {
    setNotesData(prev => ({
      ...prev,
      canvases: prev.canvases.map(canvas =>
        canvas.project === prev.currentProject
          ? {
              ...canvas,
              notes: canvas.notes.map(note =>
                note.id === noteId
                  ? { ...note, position: { x, y } }
                  : note
              ),
            }
          : canvas
      ),
    }))
  }

  const handleViewportChange = (viewport: CanvasViewport) => {
    setNotesData(prev => ({
      ...prev,
      canvases: prev.canvases.map(canvas =>
        canvas.project === prev.currentProject
          ? { ...canvas, viewport }
          : canvas
      ),
    }))
  }

  const handleNoteCreate = (x: number, y: number) => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: 'Nieuwe notitie',
      content: 'Dubbelklik om te bewerken',
      position: { x, y },
      size: { width: 240, height: 120 },
      project: notesData.currentProject,
      connections: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    setNotesData(prev => ({
      ...prev,
      canvases: prev.canvases.map(canvas =>
        canvas.project === prev.currentProject
          ? { ...canvas, notes: [...canvas.notes, newNote] }
          : canvas
      ),
    }))
  }

  return (
    <div className="h-screen">
      <NotesCanvas
        data={notesData}
        onProjectChange={handleProjectChange}
        onNoteMove={handleNoteMove}
        onNoteEdit={(id) => console.log('Edit note:', id)}
        onNoteCreate={handleNoteCreate}
        onViewportChange={handleViewportChange}
      />
    </div>
  )
}
