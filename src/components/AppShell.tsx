import { NavLink, Outlet } from 'react-router-dom'
import { Home, Database, Activity, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/registry', icon: Database, label: 'Registry' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-16 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <nav className="flex h-full flex-col py-4">
          <ul className="flex flex-1 flex-col gap-1 px-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `
                    group relative flex w-full items-center justify-center rounded-lg p-3 transition-colors
                    ${isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900">
                    {label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="min-h-screen pl-16">
        <Outlet />
      </main>
    </div>
  )
}
