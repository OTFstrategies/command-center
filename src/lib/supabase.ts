import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wwvpcdxctqytqnzxoscl.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dnBjZHhjdHF5dHFuenhvc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDY1ODgsImV4cCI6MjA4NTQ4MjU4OH0.vrBL5xLrzlurl4l9YGgdASxtbPHwYnk8U71L0EU8xH0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
