import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { EmployeeRow } from '@/types/database'

export type AuthStatus =
  | 'loading'
  | 'error'
  | 'signed-out'
  | 'no-profile'
  | 'inactive'
  | 'ready'

export type AuthContextValue = {
  status: AuthStatus
  session: Session | null
  employee: EmployeeRow | null
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
