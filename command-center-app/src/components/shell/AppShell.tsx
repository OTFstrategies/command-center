'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'

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
  headerContent?: React.ReactNode
}

export function AppShell({
  children,
  navigationItems,
  user,
  onNavigate,
  onLogout,
  headerContent,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 w-16 glass max-md:hidden">
        <MainNav
          items={navigationItems}
          onNavigate={onNavigate}
        />
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
          {headerContent}
          {user && <UserMenu user={user} onLogout={onLogout} />}
        </div>
      </header>

      {/* Desktop header content - floating */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3 max-md:hidden">
        {headerContent}
        {user && <UserMenu user={user} onLogout={onLogout} />}
      </div>

      {/* Sidebar - Mobile overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 glass md:hidden">
            <MainNav
              items={navigationItems}
              onNavigate={(href) => {
                onNavigate?.(href)
                setMobileMenuOpen(false)
              }}
              showLabels
            />
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
