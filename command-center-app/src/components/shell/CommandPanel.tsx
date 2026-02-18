'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ScanSearch, HeartPulse, Code, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CommandAction {
  id: string
  label: string
  description: string
  icon: typeof RefreshCw
  handler: () => Promise<string>
}

export function CommandPanel() {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const actions: CommandAction[] = [
    {
      id: 'sync',
      label: 'Sync Registry',
      description: 'Synchroniseer ~/.claude/registry/ naar database',
      icon: RefreshCw,
      handler: async () => {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'registry_sync' }),
        })
        const data = await res.json()
        return data.success ? 'Sync job aangemaakt' : 'Sync mislukt'
      },
    },
    {
      id: 'scan',
      label: 'Deep Scan',
      description: 'Scan heel ~/.claude/ voor relaties en clusters',
      icon: ScanSearch,
      handler: async () => {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'deep_scan' }),
        })
        const data = await res.json()
        return data.success ? 'Deep Scan job aangemaakt' : 'Scan mislukt'
      },
    },
    {
      id: 'health',
      label: 'Health Check',
      description: 'Controleer gezondheid van alle projecten',
      icon: HeartPulse,
      handler: async () => {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'health_check' }),
        })
        const data = await res.json()
        return data.success ? 'Health Check job aangemaakt' : 'Check mislukt'
      },
    },
    {
      id: 'analysis',
      label: 'Code Analyse',
      description: 'Draai TypeScript analyse via MCP server',
      icon: Code,
      handler: async () => {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'code_analysis' }),
        })
        const data = await res.json()
        return data.success ? 'Code Analyse job aangemaakt' : 'Analyse mislukt'
      },
    },
  ]

  const runAction = useCallback(async (action: CommandAction) => {
    setRunning(action.id)
    setResult(null)
    try {
      const msg = await action.handler()
      setResult(msg)
    } catch {
      setResult('Actie mislukt')
    }
    setRunning(null)
    setTimeout(() => setResult(null), 3000)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/3 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200/50 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200/50 dark:border-zinc-800/50 mb-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Acties
              </span>
              <div className="flex items-center gap-2">
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-mono">
                  Ctrl+J
                </kbd>
                <button onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => runAction(action)}
                    disabled={running !== null}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 disabled:opacity-50"
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${
                      running === action.id ? 'animate-spin text-zinc-500' : 'text-zinc-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">{action.label}</p>
                      <p className="text-xs text-zinc-400 truncate">{action.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {result && (
              <div className="mx-2 mt-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                {result}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
