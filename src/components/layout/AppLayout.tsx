import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth, useCurrentEmployee } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { toUserMessage } from '@/lib/errors'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/formatters'
import { Icon } from '@/components/layout/Icon'
import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ADMIN_NAV, EMPLOYEE_NAV, type NavItem } from '@/components/layout/navigation'

function NavGroup({ label, items, onNavigate }: { label?: string; items: NavItem[]; onNavigate?: () => void }) {
  return (
    <div className="space-y-0.5 px-3 py-3">
      {label && <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          end
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
            )
          }
        >
          <Icon name={item.icon} className="h-5 w-5 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

// Admins get both nav groups — being an admin adds the console, it never
// takes away their own personal workspace.
function SidebarNav({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  if (!isAdmin) {
    return (
      <nav className="flex-1 overflow-y-auto">
        <NavGroup items={EMPLOYEE_NAV} onNavigate={onNavigate} />
      </nav>
    )
  }
  return (
    <nav className="flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
      <NavGroup label="My Workspace" items={EMPLOYEE_NAV} onNavigate={onNavigate} />
      <NavGroup label="Admin" items={ADMIN_NAV} onNavigate={onNavigate} />
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
      <Logo className="h-8 w-8 rounded-lg" />
      <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Daybook</span>
    </div>
  )
}

export function AppLayout() {
  const { isAdmin, signOut } = useAuth()
  const employee = useCurrentEmployee()
  const toast = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  // The drawer closes via each NavLink's onNavigate (below) or the backdrop click.

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      toast.error(toUserMessage(err))
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <Brand />
        <SidebarNav isAdmin={isAdmin} />
      </aside>

      {/* Mobile / tablet drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl dark:bg-slate-900">
            <Brand />
            <SidebarNav isAdmin={isAdmin} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block dark:text-slate-400">{isAdmin ? 'Admin console' : 'Employee portal'}</div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{employee.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{employee.designation ?? (isAdmin ? 'Administrator' : 'Employee')}</p>
            </div>
            {employee.avatar_url ? (
              <img src={employee.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                {initials(employee.full_name)}
              </div>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Sign out"
              title="Sign out"
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
