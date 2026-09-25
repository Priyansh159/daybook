import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { InactiveScreen, NoProfileScreen, ProfileErrorScreen } from '@/routes/AccessScreens'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  switch (status) {
    case 'loading':
      return <FullPageSpinner />
    case 'signed-out':
      return <Navigate to="/login" replace state={{ from: location.pathname }} />
    case 'no-profile':
      return <NoProfileScreen />
    case 'inactive':
      return <InactiveScreen />
    case 'error':
      return <ProfileErrorScreen />
    case 'ready':
      return <Outlet />
  }
}
