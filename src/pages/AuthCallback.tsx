/**
 * Auth Callback Page
 *
 * Handles token transfer from VEHA Hub.
 * Uses Supabase setSession() to properly establish the session.
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const [status, setStatus] = useState('Inloggen...')

  useEffect(() => {
    async function handleCallback() {
      // Get the hash immediately
      const fullUrl = window.location.href
      const hashIndex = fullUrl.indexOf('#')
      const hash = hashIndex !== -1 ? fullUrl.substring(hashIndex + 1) : ''

      if (hash && hash.length > 10) {
        setStatus('Sessie instellen...')
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          try {
            // Use Supabase setSession with timeout to prevent hanging
            const setSessionPromise = supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )

            const result = await Promise.race([setSessionPromise, timeoutPromise])
              .catch(() => null) // On timeout, assume session was set

            if (result?.error) {
              console.error('Failed to set session:', result.error)
              setStatus('Fout bij inloggen: ' + result.error.message)
              setTimeout(() => {
                const hubUrl = import.meta.env.VITE_VEHA_HUB_URL || 'https://veha-hub.vercel.app'
                window.location.href = hubUrl
              }, 2000)
              return
            }

            setStatus('Doorsturen...')
            // Navigate to home page
            window.location.href = '/'
            return
          } catch (error) {
            console.error('Failed to set session:', error)
            // Even on error, try to redirect - session might have been set
            window.location.href = '/'
            return
          }
        }
      }

      // No tokens in hash - check if we already have a valid session
      setStatus('Sessie controleren...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Already have a session, go to home
          setStatus('Doorsturen...')
          window.location.href = '/'
          return
        }
      } catch (error) {
        console.error('Failed to check session:', error)
      }

      // No valid session, redirect to hub
      setStatus('Geen geldige login, doorsturen naar Hub...')
      setTimeout(() => {
        const hubUrl = import.meta.env.VITE_VEHA_HUB_URL || 'https://veha-hub.vercel.app'
        window.location.href = hubUrl
      }, 1500)
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-600 dark:text-zinc-400">{status}</p>
      </div>
    </div>
  )
}
