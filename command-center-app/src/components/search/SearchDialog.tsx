'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { fuzzySearch, SearchItem } from '@/lib/search'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
}

const categoryIcons: Record<string, string> = {
  asset: 'A',
  project: 'P',
  task: 'T',
  page: '/',
}

const categoryColors: Record<string, string> = {
  asset: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  project: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
  task: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  page: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [allItems, setAllItems] = useState<SearchItem[]>([])
  const [results, setResults] = useState<SearchItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && allItems.length === 0) {
      fetch('/api/search')
        .then((res) => res.json())
        .then((data) => setAllItems(data.items || []))
        .catch(console.error)
    }
  }, [isOpen, allItems.length])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    setResults(fuzzySearch(allItems, query))
    setSelectedIndex(0)
  }, [query, allItems])

  const handleSelect = useCallback(
    (item: SearchItem) => {
      router.push(item.href)
      onClose()
    },
    [router, onClose]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-zinc-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 top-[20%] z-[91] mx-auto w-full max-w-lg px-4 animate-slide-up">
        <div className="overflow-hidden rounded-2xl glass shadow-2xl">
          <div className="flex items-center gap-3 border-b border-zinc-200/50 px-4 dark:border-zinc-700/50">
            <Search className="h-5 w-5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Zoek assets, projecten, taken..."
              className="flex-1 bg-transparent py-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
            <kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-700 sm:inline">
              ESC
            </kbd>
          </div>
          {query.length > 0 && (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">
                  Geen resultaten voor &ldquo;{query}&rdquo;
                </div>
              ) : (
                results.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-zinc-100 dark:bg-zinc-800/50'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium ${
                        categoryColors[item.category]
                      }`}
                    >
                      {categoryIcons[item.category]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {item.type}
                        {item.project && ` · ${item.project}`}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                  </button>
                ))
              )}
            </div>
          )}
          {query.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-zinc-400">
              Begin met typen om te zoeken
            </div>
          )}
        </div>
      </div>
    </>
  )
}
