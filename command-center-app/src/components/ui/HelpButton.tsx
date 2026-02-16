'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface HelpButtonProps {
  content: string
  title?: string
}

export function HelpButton({ content, title }: HelpButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
        aria-label="Help"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-zinc-200/50 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {title && (
            <p className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              {title}
            </p>
          )}
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {content}
          </p>
        </div>
      )}
    </div>
  )
}
