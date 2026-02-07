'use client'

import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Er ging iets mis
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          {error.message || 'Een onverwachte fout is opgetreden.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Probeer opnieuw
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
