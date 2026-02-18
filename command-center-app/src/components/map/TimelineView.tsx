'use client'

import { useState } from 'react'
import { Clock, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface EntityVersion {
  id: string
  entity_type: string
  entity_id: string
  version: string
  change_type: 'added' | 'modified' | 'removed'
  title: string
  description: string | null
  items_changed: unknown[]
  detected_at: string
  detected_by: string
}

interface TimelineDay {
  date: string
  label: string
  events: EntityVersion[]
}

interface TimelineViewProps {
  days: TimelineDay[]
}

const CHANGE_ICONS: Record<string, typeof Plus> = {
  added: Plus,
  modified: Pencil,
  removed: Trash2,
}

const CHANGE_LABELS: Record<string, string> = {
  added: 'Toegevoegd',
  modified: 'Gewijzigd',
  removed: 'Verwijderd',
}

const TYPE_LABELS: Record<string, string> = {
  agent: 'Agent',
  command: 'Command',
  skill: 'Skill',
  prompt: 'Prompt',
  api: 'API',
  instruction: 'Instructie',
  project: 'Project',
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export default function TimelineView({ days }: TimelineViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(days.slice(0, 3).map((d) => d.date))
  )

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-6 text-center">
        <Clock className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Nog geen tijdlijndata beschikbaar.</p>
        <p className="text-xs text-zinc-400 mt-1">
          Versiegeschiedenis wordt opgebouwd bij elke sync en deep scan.
        </p>
      </div>
    )
  }

  const toggleDay = (date: string) => {
    const next = new Set(expandedDays)
    if (next.has(date)) next.delete(date)
    else next.add(date)
    setExpandedDays(next)
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const isExpanded = expandedDays.has(day.date)

        return (
          <div
            key={day.date}
            className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm"
          >
            {/* Day header */}
            <button
              onClick={() => toggleDay(day.date)}
              className="flex items-center justify-between w-full p-3 text-left hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {day.label}
                </span>
                <span className="text-xs text-zinc-400">
                  {day.events.length} {day.events.length === 1 ? 'wijziging' : 'wijzigingen'}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>

            {/* Events */}
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-zinc-200/30 dark:border-zinc-800/30">
                <div className="relative ml-4 mt-2">
                  {/* Vertical timeline line */}
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />

                  <div className="space-y-3">
                    {day.events.map((event) => {
                      const Icon = CHANGE_ICONS[event.change_type] || Pencil

                      return (
                        <div key={event.id} className="relative pl-6">
                          {/* Dot on timeline */}
                          <div className="absolute left-0 top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-white dark:border-zinc-900" />

                          <div className="flex items-start gap-2">
                            <Icon className="h-3 w-3 text-zinc-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                                  {event.title}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                  {TYPE_LABELS[event.entity_type] || event.entity_type}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {CHANGE_LABELS[event.change_type] || event.change_type}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              <span className="text-[10px] text-zinc-400">
                                {formatTime(event.detected_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
