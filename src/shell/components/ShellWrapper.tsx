import { useMemo } from 'react'
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
  MessageCircle,
} from 'lucide-react'
import { AppShell } from './AppShell'

// Map section routes to their screen design URLs
const sectionRoutes: Record<string, string> = {
  '/': '/sections/home/screen-designs/HomeDashboard/fullscreen',
  '/apis': '/sections/apis/screen-designs/ApiList/fullscreen',
  '/prompts': '/sections/prompts/screen-designs/PromptList/fullscreen',
  '/skills': '/sections/skills/screen-designs/SkillList/fullscreen',
  '/agents': '/sections/agents/screen-designs/AgentList/fullscreen',
  '/commands': '/sections/commands/screen-designs/CommandList/fullscreen',
  '/instructions': '/sections/instructions/screen-designs/InstructionList/fullscreen',
  '/activity': '/sections/activity/screen-designs/ActivityFeed/fullscreen',
  '/notes': '/sections/notes/screen-designs/NotesCanvas/fullscreen',
  '/chat': '/sections/chat/screen-designs/ChatPage/fullscreen',
  '/settings': '/sections/settings/screen-designs/SettingsPage/fullscreen',
}

// Reverse map to detect current section from URL
function getCurrentSection(): string {
  const path = window.location.pathname
  for (const [route, fullPath] of Object.entries(sectionRoutes)) {
    if (path === fullPath || path.includes(`/sections${route === '/' ? '/home' : route}/`)) {
      return route
    }
  }
  return '/'
}

const user = {
  name: 'Shadow',
  avatarUrl: undefined,
}

interface ShellWrapperProps {
  children: React.ReactNode
}

export default function ShellWrapper({ children }: ShellWrapperProps) {
  const currentSection = useMemo(() => getCurrentSection(), [])

  const navigationItems = useMemo(() => [
    { label: 'Home', href: '/', icon: <Home className="h-5 w-5" />, isActive: currentSection === '/' },
    { label: 'APIs', href: '/apis', icon: <Key className="h-5 w-5" />, isActive: currentSection === '/apis' },
    { label: 'Prompts', href: '/prompts', icon: <MessageSquare className="h-5 w-5" />, isActive: currentSection === '/prompts' },
    { label: 'Skills', href: '/skills', icon: <Sparkles className="h-5 w-5" />, isActive: currentSection === '/skills' },
    { label: 'Agents', href: '/agents', icon: <Bot className="h-5 w-5" />, isActive: currentSection === '/agents' },
    { label: 'Commands', href: '/commands', icon: <Terminal className="h-5 w-5" />, isActive: currentSection === '/commands' },
    { label: 'Instructions', href: '/instructions', icon: <FileText className="h-5 w-5" />, isActive: currentSection === '/instructions' },
    { label: 'Activity', href: '/activity', icon: <Activity className="h-5 w-5" />, isActive: currentSection === '/activity' },
    { label: 'Notes', href: '/notes', icon: <StickyNote className="h-5 w-5" />, isActive: currentSection === '/notes' },
    { label: 'Chat', href: '/chat', icon: <MessageCircle className="h-5 w-5" />, isActive: currentSection === '/chat' },
    { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" />, isActive: currentSection === '/settings' },
  ], [currentSection])

  const handleNavigate = (href: string) => {
    const fullPath = sectionRoutes[href]
    if (fullPath) {
      window.location.href = fullPath
    }
  }

  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      onNavigate={handleNavigate}
      onLogout={() => console.log('Logout')}
    >
      {children}
    </AppShell>
  )
}
