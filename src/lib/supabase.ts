import { createClient } from '@supabase/supabase-js'

// VEHA Hub Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikpmlhmbooaxfrlpzcfa.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcG1saG1ib29heGZybHB6Y2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NjUzNjUsImV4cCI6MjA4NTU0MTM2NX0.OaTF51iom5IbHlqURVGbKuGSCqTLLxAGv7SITenFOgU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
