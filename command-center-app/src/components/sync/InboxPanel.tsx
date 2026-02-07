'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox, RefreshCw, Check, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import type { InboxPending } from '@/types'

export function InboxPanel() {
  const [pending, setPending] = useState<InboxPending[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const { addToast } = useToast()

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/sync/inbox')
      const data = await res.json()
      setPending(data.pending || [])
    } catch {
      console.error('Failed to fetch inbox')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const processItem = async (id: string, projectName: string) => {
    setProcessingIds((prev) => new Set(prev).add(id))

    try {
      const res = await fetch('/api/sync/inbox/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()

      if (data.success) {
        const result = data.results?.[0]
        addToast({
          type: 'success',
          title: `${projectName} gesynchroniseerd`,
          description: `${result?.itemsSynced || 0} items verwerkt`,
        })
        setPending((prev) => prev.filter((p) => p.id !== id))
      } else {
        addToast({ type: 'error', title: 'Sync mislukt', description: data.error })
      }
    } catch {
      addToast({ type: 'error', title: 'Sync mislukt', description: 'Netwerk fout' })
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const processAll = async () => {
    for (const item of pending) {
      await processItem(item.id, item.project)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Inbox laden...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-zinc-500" />
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Inbox</h2>
          {pending.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {pending.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPending}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            title="Ververs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {pending.length > 1 && (
            <button
              onClick={processAll}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Sync All
            </button>
          )}
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="p-6 text-center">
          <Check className="mx-auto h-8 w-8 text-green-400 mb-2" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Inbox is leeg - alles is gesynchroniseerd
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Gebruik <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/connect-project</code> om projecten toe te voegen
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {pending.map((item) => {
            const isProcessing = processingIds.has(item.id)
            const manifest = item.manifest
            const totalItems = manifest?.totalItems || 0

            return (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {item.project}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {totalItems} items
                    {manifest?.scannedAt && ` · Gescand ${new Date(manifest.scannedAt).toLocaleDateString('nl-NL')}`}
                  </p>
                </div>
                <button
                  onClick={() => processItem(item.id, item.project)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
