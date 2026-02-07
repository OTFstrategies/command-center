'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AppShell, type NavigationItem } from './AppShell'
import { ToastProvider } from '@/components/ui/ToastProvider'
import {
  Home,
  Database,
  Activity,
  Settings,
  LayoutGrid,
} from 'lucide-react'

const navigationItems: Omit<NavigationItem, 'isActive'>[] = [
  { label: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: 'Tasks', href: '/tasks', icon: <LayoutGrid className="h-5 w-5" /> },
  { label: 'Registry', href: '/registry', icon: <Database className="h-5 w-5" /> },
  { label: 'Activity', href: '/activity', icon: <Activity className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

interface ShellLayoutProps {
  children: React.ReactNode
  projects: string[]
}

export function ShellLayout({ children, projects }: ShellLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentProject = searchParams.get('project')

  const navItemsWithActive = navigationItems.map((item) => ({
    ...item,
    isActive: pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)),
  }))

  const handleNavigate = (href: string) => {
    // Preserve project param when navigating
    const params = new URLSearchParams(searchParams.toString())
    const queryString = params.toString()
    router.push(queryString ? `${href}?${queryString}` : href)
  }

  return (
    <ToastProvider>
      <AppShell
        navigationItems={navItemsWithActive}
        user={{ name: 'Shadow' }}
        onNavigate={handleNavigate}
        projects={projects}
        currentProject={currentProject}
      >
        {children}
      </AppShell>
    </ToastProvider>
  )
}
