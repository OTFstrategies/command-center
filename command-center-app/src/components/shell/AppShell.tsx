'use client'

import { useState } from 'react'
import { Menu, X, Search } from 'lucide-react'
import { useSearch } from '@/components/search/SearchProvider'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'
import { ProjectSwitcher } from './ProjectSwitcher'

export interface NavigationItem {
  label: string
  href: string
  icon: React.ReactNode
  isActive?: boolean
}

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: { name: string; avatarUrl?: string }
  onNavigate?: (href: string) => void
  onLogout?: () => void
  projects?: string[]
  currentProject?: string | null
}

export function AppShell({
  children,
  navigationItems,
  user,
  onNavigate,
  onLogout,
  projects = [],
  currentProject = null,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { openSearch } = useSearch()

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 w-16 glass max-md:hidden flex flex-col">
        {/* Search Button */}
        <div className="flex justify-center p-3">
          <button
            onClick={openSearch}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
            aria-label="Search (Ctrl+K)"
          >
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation - Top */}
        <div className="flex-1">
          <MainNav
            items={navigationItems}
            onNavigate={onNavigate}
          />
        </div>

        {/* Bottom controls: Project, Dark mode, User */}
        <div className="flex flex-col items-center gap-1 p-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
          {/* Project Switcher - Compact */}
          <ProjectSwitcher
            projects={projects}
            currentProject={currentProject}
            sidebar
          />

          {/* User Menu with dark mode - Compact */}
          {user && (
            <UserMenu user={user} onLogout={onLogout} compact />
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200/50 bg-white/80 px-4 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={openSearch}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <ProjectSwitcher
            projects={projects}
            currentProject={currentProject}
          />
          {user && <UserMenu user={user} onLogout={onLogout} />}
        </div>
      </header>

      {/* Sidebar - Mobile overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 glass md:hidden flex flex-col">
            {/* Navigation - Top */}
            <div className="flex-1">
              <MainNav
                items={navigationItems}
                onNavigate={(href) => {
                  onNavigate?.(href)
                  setMobileMenuOpen(false)
                }}
                showLabels
              />
            </div>

            {/* Bottom controls */}
            <div className="flex flex-col gap-3 p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <ProjectSwitcher
                projects={projects}
                currentProject={currentProject}
              />
              {user && <UserMenu user={user} onLogout={onLogout} />}
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="min-h-screen max-md:pt-14 md:pl-16">
        {children}
      </main>
    </div>
  )
}
