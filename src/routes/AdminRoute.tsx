import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Must be nested inside <ProtectedRoute>, which guarantees a loaded profile.
// Admins also keep full access to the personal employee pages (dashboard,
// tasks, leaves, ...) for themselves — being an admin only adds the
// /admin/* console on top, it never takes anything away.
export function AdminRoute() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
