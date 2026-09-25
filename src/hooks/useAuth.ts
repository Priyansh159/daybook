import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '@/hooks/authContext'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// For pages that only render once the profile has loaded (inside ProtectedRoute).
export function useCurrentEmployee() {
  const { employee } = useAuth()
  if (!employee) throw new Error('useCurrentEmployee used outside a protected route')
  return employee
}
