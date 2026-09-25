import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { fetchMyProfile, signOut as authSignOut } from '@/lib/auth'
import { canUseApp } from '@/lib/permissions'
import { AuthContext, type AuthContextValue, type AuthStatus } from '@/hooks/authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionLoaded(true)
    })
    // Don't call other Supabase APIs inside this callback (supabase-js can
    // deadlock); the profile query below reacts to the session change instead.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setSessionLoaded(true)
      if (event === 'SIGNED_OUT') queryClient.clear()
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [queryClient])

  const userId = session?.user.id
  const profileQuery = useQuery({
    queryKey: ['auth', 'profile', userId],
    queryFn: () => fetchMyProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  })

  const employee = profileQuery.data ?? null

  let status: AuthStatus
  if (!sessionLoaded) status = 'loading'
  else if (!session) status = 'signed-out'
  else if (profileQuery.isPending) status = 'loading'
  else if (profileQuery.isError) status = 'error'
  else if (!employee) status = 'no-profile'
  else if (!canUseApp(employee)) status = 'inactive'
  else status = 'ready'

  const signOut = useCallback(async () => {
    await authSignOut()
    queryClient.clear()
  }, [queryClient])

  const { refetch } = profileQuery
  const refreshProfile = useCallback(async () => {
    await refetch()
  }, [refetch])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      employee,
      isAdmin: employee?.role === 'ADMIN',
      signOut,
      refreshProfile,
    }),
    [status, session, employee, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
