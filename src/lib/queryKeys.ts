import type { BalanceKind, RequestStatus } from '@/types/database'
import type { YearMonth } from '@/utils/date'

export const qk = {
  employees: ['employees'] as const,
  employee: (id: string) => ['employees', id] as const,
  balance: (kind: BalanceKind, employeeId: string, ym: YearMonth) => ['balance', kind, employeeId, ym.year, ym.month] as const,
  monthBalances: (kind: BalanceKind, ym: YearMonth) => ['balances', kind, ym.year, ym.month] as const,
  yearBalances: (kind: BalanceKind, employeeId: string, year: number) => ['balances-year', kind, employeeId, year] as const,
  adjustments: (filter: { kind?: BalanceKind; employeeId?: string }) => ['adjustments', filter] as const,
  leaveRequests: (filter: { employeeId?: string; status?: RequestStatus; month?: YearMonth }) => ['leave-requests', filter] as const,
  wfhRecords: (filter: { employeeId?: string; status?: RequestStatus; month?: YearMonth }) => ['wfh-records', filter] as const,
  attendance: (filter: { employeeId?: string; from: string; to: string }) => ['attendance', filter] as const,
  tasks: (filter: { employeeId?: string }) => ['tasks', filter] as const,
  settings: ['settings'] as const,
  holidays: (range?: { from: string; to: string }) => ['holidays', range ?? 'all'] as const,
  audit: (filter: { entityId?: string; limit?: number }) => ['audit', filter] as const,
}

// Everything a change of daily status can affect.
export const DAY_STATUS_DEPENDENTS = [
  ['attendance'],
  ['balance'],
  ['balances'],
  ['balances-year'],
  ['leave-requests'],
  ['wfh-records'],
] as const
