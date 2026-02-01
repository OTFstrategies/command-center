import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Home, Registry, Activity, Settings, AuthCallback } from '@/pages'
import './index.css'

const router = createBrowserRouter([
  // Auth callback (public route, no shell)
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  // Main app routes with shell
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'registry', element: <Registry /> },
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
