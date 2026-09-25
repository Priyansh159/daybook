import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

function Screen({ title, message }: { title: string; message: string }) {
  const { signOut } = useAuth()
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <Button variant="secondary" className="mt-5" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

export function NoProfileScreen() {
  return (
    <Screen
      title="No employee profile"
      message="Your login works, but there is no employee profile linked to it yet. Ask an administrator to finish setting up your account."
    />
  )
}

export function InactiveScreen() {
  return (
    <Screen
      title="Account inactive"
      message="Your employee account has been deactivated. Contact an administrator if you think this is a mistake."
    />
  )
}

export function ProfileErrorScreen() {
  return (
    <Screen
      title="Couldn't load your profile"
      message="We couldn't reach the server to load your account. Check your connection and refresh the page."
    />
  )
}
