'use client'

import { Search, Plus, RefreshCw } from 'lucide-react'
import { useSearch } from '@/components/search/SearchProvider'
import { useRouter } from 'next/navigation'

export function QuickActionBar() {
  const { openSearch } = useSearch()
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={openSearch}
        className="flex items-center gap-2 rounded-xl border border-zinc-200/50 bg-white/50 px-4 py-2.5 text-sm text-zinc-400 transition-all duration-300 hover:border-zinc-300 hover:text-zinc-600 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:border-zinc-600 dark:hover:text-zinc-300 flex-1"
      >
        <Search className="h-4 w-4" />
        <span>Zoeken...</span>
        <kbd className="ml-auto hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] dark:border-zinc-700 sm:inline">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => router.push('/tasks')}
        className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <Plus className="h-4 w-4" />
        Task
      </button>
      <button
        onClick={() => router.push('/settings')}
        className="flex items-center gap-2 rounded-xl border border-zinc-200/50 bg-white/50 px-4 py-2.5 text-sm text-zinc-600 transition-all duration-300 hover:border-zinc-300 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-zinc-600"
      >
        <RefreshCw className="h-4 w-4" />
        Sync
      </button>
    </div>
  )
}
