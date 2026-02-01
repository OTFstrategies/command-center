import type { Note } from '@/../product/sections/notes/types'

export interface ConnectionLineProps {
  fromNote: Note
  toNote: Note
  zoom: number
}

export function ConnectionLine({ fromNote, toNote, zoom }: ConnectionLineProps) {
  // Calculate center points of each note
  const fromX = fromNote.position.x + fromNote.size.width / 2
  const fromY = fromNote.position.y + fromNote.size.height / 2
  const toX = toNote.position.x + toNote.size.width / 2
  const toY = toNote.position.y + toNote.size.height / 2

  // Calculate edge points (where line should connect to card edge)
  const angle = Math.atan2(toY - fromY, toX - fromX)

  // Start point (edge of from note)
  const startX = fromNote.position.x + fromNote.size.width / 2 + Math.cos(angle) * (fromNote.size.width / 2)
  const startY = fromNote.position.y + fromNote.size.height / 2 + Math.sin(angle) * (fromNote.size.height / 2)

  // End point (edge of to note)
  const endX = toNote.position.x + toNote.size.width / 2 - Math.cos(angle) * (toNote.size.width / 2)
  const endY = toNote.position.y + toNote.size.height / 2 - Math.sin(angle) * (toNote.size.height / 2)

  // Arrow head
  const arrowSize = 8
  const arrowAngle = Math.PI / 6
  const arrow1X = endX - arrowSize * Math.cos(angle - arrowAngle)
  const arrow1Y = endY - arrowSize * Math.sin(angle - arrowAngle)
  const arrow2X = endX - arrowSize * Math.cos(angle + arrowAngle)
  const arrow2Y = endY - arrowSize * Math.sin(angle + arrowAngle)

  return (
    <g style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
      {/* Main line */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-zinc-300 dark:text-zinc-600"
      />
      {/* Arrow head */}
      <path
        d={`M ${endX} ${endY} L ${arrow1X} ${arrow1Y} L ${arrow2X} ${arrow2Y} Z`}
        fill="currentColor"
        className="text-zinc-300 dark:text-zinc-600"
      />
    </g>
  )
}
