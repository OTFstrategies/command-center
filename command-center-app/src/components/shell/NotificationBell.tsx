'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts'
import Link from 'next/link'

const severityConfig = {
  critical: { icon: AlertTriangle, class: 'text-red-500' },
  warning: { icon: AlertCircle, class: 'text-amber-500' },
  info: { icon: Info, class: 'text-zinc-400' },
}

export function NotificationBell() {
  const { alerts, unreadCount, markRead } = useRealtimeAlerts()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    setOpen(!open)
    if (!open) markRead()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
        aria-label="Alerts"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-200/50 bg-white/95 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95 z-50">
          <div className="flex items-center justify-between border-b border-zinc-200/50 px-4 py-3 dark:border-zinc-800/50">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Alerts</span>
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Bekijk alles
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-400">
                Geen recente alerts
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => {
                const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info
                const Icon = config.icon
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.class}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {alert.title}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(alert.created_at).toLocaleString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
