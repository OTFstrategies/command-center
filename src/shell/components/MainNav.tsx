import type { NavigationItem } from './AppShell'

interface MainNavProps {
  items: NavigationItem[]
  onNavigate?: (href: string) => void
  showLabels?: boolean
}

export function MainNav({ items, onNavigate, showLabels = false }: MainNavProps) {
  return (
    <nav className="flex h-full flex-col py-4">
      <ul className="flex flex-1 flex-col gap-1 px-2">
        {items.map((item) => (
          <li key={item.href}>
            <button
              onClick={() => onNavigate?.(item.href)}
              className={`
                group relative flex w-full items-center gap-3 rounded-lg p-3 transition-colors
                ${showLabels ? 'justify-start' : 'justify-center'}
                ${item.isActive
                  ? 'bg-zinc-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                }
              `}
              aria-label={item.label}
            >
              <span className="h-5 w-5 shrink-0">{item.icon}</span>

              {showLabels ? (
                <span className="text-sm font-medium">{item.label}</span>
              ) : (
                /* Tooltip on hover */
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900">
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
