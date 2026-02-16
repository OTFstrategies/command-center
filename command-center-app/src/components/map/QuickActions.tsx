'use client'

import { useState, useCallback } from 'react'
import { ScanSearch, RefreshCw, MoreVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function QuickActions() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const triggerSync = useCallback(async () => {
    setStatus('Synchroniseren...')
    setOpen(false)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setStatus('Gesynchroniseerd')
      } else {
        setStatus('Sync mislukt')
      }
    } catch {
      setStatus('Sync mislukt')
    }
    setTimeout(() => setStatus(null), 3000)
  }, [])

  const triggerDeepScan = useCallback(async () => {
    setStatus('Deep Scan starten...')
    setOpen(false)
    try {
      const res = await fetch('/api/sync/deep-scan', {
        method: 'GET',
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(`Scan klaar: ${data.stats?.clusters || 0} groepen, ${data.stats?.insights || 0} inzichten`)
      } else {
        setStatus('Scan status opgehaald')
      }
    } catch {
      setStatus('Scan gestart')
    }
    setTimeout(() => setStatus(null), 5000)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {/* Status toast */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-14 right-0 whitespace-nowrap rounded-xl border border-zinc-200/50 bg-white/90 px-4 py-2 text-sm text-zinc-700 shadow-lg backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/90 dark:text-zinc-300"
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute bottom-14 right-0 w-52 rounded-xl border border-zinc-200/50 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95"
          >
            <button
              onClick={triggerDeepScan}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
            >
              <ScanSearch className="h-4 w-4 text-zinc-400" />
              Volledige Scan
            </button>
            <button
              onClick={triggerSync}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
            >
              <RefreshCw className="h-4 w-4 text-zinc-400" />
              Synchroniseer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200/50 bg-white/90 shadow-lg backdrop-blur-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90"
      >
        <MoreVertical className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
      </button>
    </div>
  )
}
