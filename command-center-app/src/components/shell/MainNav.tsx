'use client'

import type { NavigationItem } from './AppShell'

interface MainNavProps {
  items: NavigationItem[]
  onNavigate?: (href: string) => void
  showLabels?: boolean
}

export function MainNav({ items, onNavigate, showLabels = false }: MainNavProps) {
  return (
    <nav className="flex h-full flex-col py-6">
      <ul className="flex flex-1 flex-col gap-0.5 px-2">
        {items.map((item) => (
          <li key={item.href}>
            <button
              onClick={() => onNavigate?.(item.href)}
              className={`
                group relative flex w-full items-center gap-3 rounded-xl p-3 transition-all duration-300
                ${showLabels ? 'justify-start' : 'justify-center'}
                ${item.isActive
                  ? 'text-white glow-blue'
                  : 'text-zinc-400 hover:text-white glow-blue-hover'
                }
              `}
              aria-label={item.label}
            >
              {/* Glow background for active */}
              {item.isActive && (
                <div className="absolute inset-0 rounded-xl bg-[var(--accent-blue)] opacity-20 blur-xl" />
              )}
              <span className="relative h-5 w-5 shrink-0 [&>svg]:stroke-[1.5]">{item.icon}</span>

              {showLabels ? (
                <span className="relative text-sm font-medium">{item.label}</span>
              ) : (
                /* Tooltip on hover - glass style */
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-zinc-200/50 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-zinc-700 opacity-0 shadow-lg shadow-zinc-200/50 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 dark:border-zinc-700/50 dark:bg-zinc-800/90 dark:text-zinc-200 dark:shadow-zinc-900/50">
                  {item.label}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
