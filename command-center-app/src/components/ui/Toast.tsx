'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  description?: string
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'border-green-500/20',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'border-red-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'border-blue-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'border-amber-500/20',
  },
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const config = toastConfig[toast.type]
  const Icon = config.icon

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`
        pointer-events-auto w-80 rounded-xl border ${config.bg}
        glass p-4 shadow-xl transition-all duration-300
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onDismiss(toast.id), 300)
          }}
          className="shrink-0 rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
