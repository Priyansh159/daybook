import type { IconName } from '@/components/layout/Icon'

export type NavItem = { to: string; label: string; icon: IconName }

export const EMPLOYEE_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/tasks', label: 'My Tasks', icon: 'tasks' },
  { to: '/attendance', label: 'My Attendance', icon: 'attendance' },
  { to: '/leaves', label: 'Leaves', icon: 'leave' },
  { to: '/wfh', label: 'WFH', icon: 'wfh' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
]

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin/dashboard', label: 'Admin Dashboard', icon: 'dashboard' },
  { to: '/admin/employees', label: 'Employees', icon: 'employees' },
  { to: '/admin/leaves', label: 'Leave Management', icon: 'leave' },
  { to: '/admin/wfh', label: 'WFH Management', icon: 'wfh' },
  { to: '/admin/attendance', label: 'Attendance', icon: 'attendance' },
  { to: '/admin/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/admin/reports', label: 'Reports', icon: 'reports' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
]
