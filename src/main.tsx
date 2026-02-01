import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Home, APIs, Prompts, Skills, Agents, Commands, Instructions, Activity, Settings } from '@/pages'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'apis', element: <APIs /> },
      { path: 'prompts', element: <Prompts /> },
      { path: 'skills', element: <Skills /> },
      { path: 'agents', element: <Agents /> },
      { path: 'commands', element: <Commands /> },
      { path: 'instructions', element: <Instructions /> },
      { path: 'activity', element: <Activity /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
