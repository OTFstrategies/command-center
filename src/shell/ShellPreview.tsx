import {
  Home,
  Key,
  MessageSquare,
  Sparkles,
  Bot,
  Terminal,
  FileText,
  Activity,
  StickyNote,
  Settings,
} from 'lucide-react'
import { AppShell } from './components'
import type { NavigationItem } from './components/AppShell'

const navigationItems: NavigationItem[] = [
  { label: 'Home', href: '/', icon: <Home className="h-5 w-5" />, isActive: true },
  { label: 'APIs', href: '/apis', icon: <Key className="h-5 w-5" /> },
  { label: 'Prompts', href: '/prompts', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Skills', href: '/skills', icon: <Sparkles className="h-5 w-5" /> },
  { label: 'Agents', href: '/agents', icon: <Bot className="h-5 w-5" /> },
  { label: 'Commands', href: '/commands', icon: <Terminal className="h-5 w-5" /> },
  { label: 'Instructions', href: '/instructions', icon: <FileText className="h-5 w-5" /> },
  { label: 'Activity', href: '/activity', icon: <Activity className="h-5 w-5" /> },
  { label: 'Notes', href: '/notes', icon: <StickyNote className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

const user = {
  name: 'Shadow',
  avatarUrl: undefined,
}

export default function ShellPreview() {
  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      onNavigate={(href) => console.log('Navigate to:', href)}
      onLogout={() => console.log('Logout')}
    >
      <div className="p-8">
        <h1 className="font-heading text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Content Area
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Section content will render here.
        </p>
      </div>
    </AppShell>
  )
}
