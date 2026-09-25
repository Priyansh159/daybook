import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth, useCurrentEmployee } from '@/hooks/useAuth'
import { useTheme, type ThemePreference } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import { toUserMessage } from '@/lib/errors'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/formatters'
import type { EmployeeRow } from '@/types/database'
import { Icon } from '@/components/layout/Icon'
import { Logo } from '@/components/layout/Logo'
import { ADMIN_NAV, EMPLOYEE_NAV, type NavItem } from '@/components/layout/navigation'

const THEME_ORDER: ThemePreference[] = ['light', 'dark', 'system']
const THEME_LABEL: Record<ThemePreference, string> = { light: 'Light', dark: 'Dark', system: 'System' }

// One click on the avatar/name opens Profile, Theme, Sign out — instead of
// those living as separate always-visible icons in the header.
function AccountMenu({ employee, isAdmin }: { employee: EmployeeRow; isAdmin: boolean }) {
  const { preference, setPreference } = useTheme()
  const toast = useToast()
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const cycleTheme = () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(preference) + 1) % THEME_ORDER.length]!
    setPreference(next)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      toast.error(toUserMessage(err))
      setSigningOut(false)
    }
  }

  const itemClass =
    'flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
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
        <Icon name="chevronDown" className={cn('hidden h-4 w-4 shrink-0 text-slate-400 transition-transform sm:block', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 px-3 py-2 sm:hidden dark:border-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{employee.full_name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{employee.email}</p>
          </div>
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <Icon name="profile" className="h-4 w-4" />
            Profile settings
          </Link>
          <button type="button" role="menuitem" onClick={cycleTheme} className={cn(itemClass, 'justify-between')}>
            <span className="flex items-center gap-2.5">
              <Icon name="settings" className="h-4 w-4" />
              Theme
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{THEME_LABEL[preference]}</span>
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className={cn(itemClass, 'text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/50')}
          >
            <Icon name="logout" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

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
  const { isAdmin } = useAuth()
  const employee = useCurrentEmployee()
  const [drawerOpen, setDrawerOpen] = useState(false)
  // The drawer closes via each NavLink's onNavigate (below) or the backdrop click.

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
          <AccountMenu employee={employee} isAdmin={isAdmin} />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
