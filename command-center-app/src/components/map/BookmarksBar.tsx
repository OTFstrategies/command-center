'use client'

import { Bookmark, X } from 'lucide-react'

interface BookmarkItem {
  id: string
  entity_type: string
  entity_id: string
  label: string | null
  sort_order: number
}

interface BookmarksBarProps {
  bookmarks: BookmarkItem[]
  onSelect: (entityId: string) => void
  onRemove: (bookmarkId: string) => void
}

export default function BookmarksBar({ bookmarks, onSelect, onRemove }: BookmarksBarProps) {
  if (bookmarks.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-1 py-1.5 overflow-x-auto">
      <Bookmark className="h-3 w-3 text-zinc-400 shrink-0" />
      {bookmarks.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b.entity_id)}
          className="group flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
        >
          <span className="truncate max-w-[120px]">{b.label || b.entity_id}</span>
          <X
            className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(b.id)
            }}
          />
        </button>
      ))}
    </div>
  )
}
