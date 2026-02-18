'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle, AlertCircle, Info, Check, X, Eye } from 'lucide-react'
import type { Alert } from '@/types'

interface AlertsListProps {
  initialAlerts: Alert[]
}

const severityConfig = {
  critical: { icon: AlertTriangle, class: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20', label: 'Kritiek' },
  warning: { icon: AlertCircle, class: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'Waarschuwing' },
  info: { icon: Info, class: 'text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-800/50', label: 'Info' },
}

export default function AlertsList({ initialAlerts }: AlertsListProps) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('open')

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    if (statusFilter === 'open' && !['new', 'acknowledged'].includes(a.status)) return false
    if (statusFilter === 'resolved' && a.status !== 'resolved') return false
    if (statusFilter === 'dismissed' && a.status !== 'dismissed') return false
    return true
  })

  const updateAlert = useCallback(async (id: string, status: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: status as Alert['status'] } : a))
      )
    } catch {
      // silently fail
    }
  }, [])

  const bulkDismissInfo = useCallback(async () => {
    const infoIds = alerts
      .filter((a) => a.severity === 'info' && ['new', 'acknowledged'].includes(a.status))
      .map((a) => a.id)

    if (infoIds.length === 0) return

    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: infoIds, status: 'dismissed' }),
      })
      setAlerts((prev) =>
        prev.map((a) => (infoIds.includes(a.id) ? { ...a, status: 'dismissed' as const } : a))
      )
    } catch {
      // silently fail
    }
  }, [alerts])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'critical', 'warning', 'info'].map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              severityFilter === s
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {s === 'all' ? 'Alles' : s === 'critical' ? 'Kritiek' : s === 'warning' ? 'Waarschuwing' : 'Info'}
          </button>
        ))}

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />

        {['open', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              statusFilter === s
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {s === 'open' ? 'Open' : s === 'resolved' ? 'Opgelost' : 'Genegeerd'}
          </button>
        ))}

        <button
          onClick={bulkDismissInfo}
          className="ml-auto text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          Negeer alle info
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200/50 bg-white/60 dark:border-zinc-800/50 dark:bg-zinc-900/60 p-8 text-center">
          <p className="text-sm text-zinc-400">
            {statusFilter === 'open'
              ? 'Geen openstaande alerts — alles ziet er goed uit'
              : 'Geen alerts in deze categorie'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info
            const Icon = config.icon

            return (
              <div
                key={alert.id}
                className={`rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 ${config.bg} p-4`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.class}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-medium ${config.class}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(alert.created_at).toLocaleString('nl-NL', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                      {alert.title}
                    </p>
                    {alert.description && (
                      <p className="text-xs text-zinc-500 mt-1">{alert.description}</p>
                    )}
                  </div>

                  {['new', 'acknowledged'].includes(alert.status) && (
                    <div className="flex items-center gap-1 shrink-0">
                      {alert.status === 'new' && (
                        <button
                          onClick={() => updateAlert(alert.id, 'acknowledged')}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                          title="Markeer als gezien"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => updateAlert(alert.id, 'resolved')}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                        title="Markeer als opgelost"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => updateAlert(alert.id, 'dismissed')}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                        title="Negeer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
