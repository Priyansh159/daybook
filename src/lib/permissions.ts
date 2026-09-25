import type { EmployeeRow, Role } from '@/types/database'

// UX-only guards. Real enforcement lives in RLS and the SQL functions; these
// just keep people from landing on pages that would fail for them anyway.

export function homePathFor(role: Role): string {
  return role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'
}

export function canUseApp(employee: Pick<EmployeeRow, 'status'>): boolean {
  return employee.status !== 'INACTIVE'
}

export function isAdmin(employee: Pick<EmployeeRow, 'role'> | null | undefined): boolean {
  return employee?.role === 'ADMIN'
}
