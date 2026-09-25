import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// Only the public anon key is ever used in the browser. All privileged
// operations go through RLS-checked RPCs or the create-employee Edge Function.
export const supabase = createClient<Database>(
  url || 'http://localhost:54321',
  anonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
