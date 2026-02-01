import {
  Home,
  Key,
  MessageSquare,
  Sparkles,
  Bot,
  Terminal,
  FileText,
  Activity,
  Settings,
  StickyNote,
} from 'lucide-react'
import { AppShell } from './AppShell'

const navigationItems = [
  { label: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
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

interface ShellWrapperProps {
  children: React.ReactNode
}

export default function ShellWrapper({ children }: ShellWrapperProps) {
  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      onNavigate={(href) => console.log('Navigate to:', href)}
      onLogout={() => console.log('Logout')}
    >
      {children}
    </AppShell>
  )
}
