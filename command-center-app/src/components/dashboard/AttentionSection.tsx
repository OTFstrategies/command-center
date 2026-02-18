import { AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Alert } from '@/types'

interface AttentionSectionProps {
  alerts: Alert[]
}

export function AttentionSection({ alerts }: AttentionSectionProps) {
  const important = alerts.filter(
    (a) => (a.severity === 'critical' || a.severity === 'warning') && (a.status === 'new' || a.status === 'acknowledged')
  )

  if (important.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
        Aandacht Nodig
      </h2>
      <div className="space-y-2">
        {important.slice(0, 5).map((alert) => {
          const Icon = alert.severity === 'critical' ? AlertTriangle : AlertCircle
          const href = alert.entity_type === 'project' && alert.entity_id
            ? `/projects/${alert.entity_id}`
            : '/alerts'

          return (
            <Link
              key={alert.id}
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-zinc-200/50 bg-white/60 px-4 py-3 transition-all duration-300 hover:bg-white/80 dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80"
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {alert.title}
                </p>
                {alert.description && (
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                    {alert.description}
                  </p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
            </Link>
          )
        })}
        {important.length > 5 && (
          <Link
            href="/alerts"
            className="block text-center text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors py-2"
          >
            +{important.length - 5} meer alerts bekijken
          </Link>
        )}
      </div>
    </section>
  )
}
