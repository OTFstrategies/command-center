'use client'

import { useState } from 'react'
import { Route, Shield, Database, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface ApiRoute {
  id: string
  path: string
  method: string
  auth_type: string
  file_path: string | null
  line_start: number | null
  tables_used: string[]
}

interface ApiRoutesTabProps {
  routes: ApiRoute[]
}

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
  POST: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200',
  PUT: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200',
  PATCH: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200',
  DELETE: 'bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-100',
}

const AUTH_LABELS: Record<string, string> = {
  none: 'Geen',
  api_key: 'API Key',
  bearer: 'Bearer Token',
  session: 'Sessie',
}

export default function ApiRoutesTab({ routes }: ApiRoutesTabProps) {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)

  if (routes.length === 0) {
    return (
      <div className="text-center py-8">
        <Route className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Geen API routes gedetecteerd.</p>
        <p className="text-xs text-zinc-400 mt-1">
          Draai eerst een code-analyse om routes te detecteren.
        </p>
      </div>
    )
  }

  // Groepeer per basis-pad
  const grouped = new Map<string, ApiRoute[]>()
  for (const route of routes) {
    const base = route.path.split('/').slice(0, 3).join('/')
    const existing = grouped.get(base) || []
    existing.push(route)
    grouped.set(base, existing)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            API Routes ({routes.length})
          </h3>
        </div>
      </div>

      {Array.from(grouped.entries()).map(([base, groupRoutes]) => (
        <div
          key={base}
          className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{base}</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {groupRoutes.map((route) => {
              const key = `${route.method}:${route.path}`
              const isExpanded = expandedRoute === key

              return (
                <div key={key}>
                  <button
                    onClick={() => setExpandedRoute(isExpanded ? null : key)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span
                      className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                        METHOD_STYLES[route.method] || METHOD_STYLES.GET
                      }`}
                    >
                      {route.method}
                    </span>
                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-200 flex-1 truncate">
                      {route.path}
                    </span>
                    {route.auth_type !== 'none' && (
                      <Shield className="h-3 w-3 text-zinc-400" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-zinc-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Shield className="h-3 w-3 text-zinc-400" />
                        <span className="text-zinc-400">Auth:</span>
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {AUTH_LABELS[route.auth_type] || route.auth_type}
                        </span>
                      </div>
                      {route.tables_used.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Database className="h-3 w-3 text-zinc-400" />
                          <span className="text-zinc-400">Tabellen:</span>
                          <div className="flex flex-wrap gap-1">
                            {route.tables_used.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {route.file_path && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                          <span className="text-zinc-400 font-mono truncate">
                            {route.file_path}
                            {route.line_start ? `:${route.line_start}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
