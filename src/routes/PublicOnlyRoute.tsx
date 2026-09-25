import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { homePathFor } from '@/lib/permissions'
import { FullPageSpinner } from '@/components/ui/Spinner'

// Login/forgot-password: send anyone with a session to "/", where
// ProtectedRoute shows either their home page or the right access screen.
export function PublicOnlyRoute() {
  const { status } = useAuth()
  if (status === 'loading') return <FullPageSpinner />
  if (status !== 'signed-out') return <Navigate to="/" replace />
  return <Outlet />
}

export function HomeRedirect() {
  const { employee } = useAuth()
  return <Navigate to={employee ? homePathFor(employee.role) : '/login'} replace />
}
