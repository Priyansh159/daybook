import type { AttendanceStatus, LeaveType } from '@/types/database'

// Mirrors the rules enforced in supabase/migrations/0002_functions.sql.
// The database is the source of truth; these are used for UI pre-checks
// (e.g. disabling the WFH button) and are unit-tested against the spec.

export type BalanceInputs = { allocated: number; adjustment: number; used: number }

export const LEAVE_DURATION: Record<LeaveType, number> = { FULL: 1, HALF: 0.5 }

export function leaveDuration(type: LeaveType): number {
  return LEAVE_DURATION[type]
}

// Rounded to one decimal to avoid float drift from repeated 0.5 steps.
export function computeRemaining({ allocated, adjustment, used }: BalanceInputs): number {
  return Math.round((allocated + adjustment - used) * 10) / 10
}

export type EffectiveBalance = BalanceInputs & { remaining: number; initialized: boolean }

// A month row that doesn't exist yet would be created with the default
// allocation and nothing used, so admin overviews can show that directly
// instead of initializing every employee's row just to display it.
export function effectiveBalance(
  row: BalanceInputs | undefined,
  defaultAllocation: number,
): EffectiveBalance {
  const inputs = row
    ? { allocated: Number(row.allocated), adjustment: Number(row.adjustment), used: Number(row.used) }
    : { allocated: defaultAllocation, adjustment: 0, used: 0 }
  return { ...inputs, remaining: computeRemaining(inputs), initialized: Boolean(row) }
}

export function canConsume(balance: BalanceInputs, duration: number): boolean {
  return computeRemaining(balance) >= duration
}

export function sumDurations(records: ReadonlyArray<{ duration: number; status: string }>): number {
  const total = records
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + Number(r.duration), 0)
  return Math.round(total * 10) / 10
}

// Balance effect of switching a day's status from `from` to `to`, as applied
// by set_daily_status(): reverse the old effect, then apply the new one.
export function statusChangeDelta(
  from: { status: AttendanceStatus; leaveType?: LeaveType } | null,
  to: { status: AttendanceStatus; leaveType?: LeaveType },
): { leave: number; wfh: number } {
  const effect = (s: { status: AttendanceStatus; leaveType?: LeaveType } | null) => ({
    leave: s?.status === 'LEAVE' ? leaveDuration(s.leaveType ?? 'FULL') : 0,
    wfh: s?.status === 'WFH' ? 1 : 0,
  })
  const before = effect(from)
  const after = effect(to)
  return { leave: after.leave - before.leave, wfh: after.wfh - before.wfh }
}

export type MonthSummary = Record<AttendanceStatus, number>

export function summarizeAttendance(rows: ReadonlyArray<{ status: AttendanceStatus }>): MonthSummary {
  const summary: MonthSummary = { WORKING: 0, WFH: 0, LEAVE: 0, HOLIDAY: 0, WEEK_OFF: 0 }
  for (const row of rows) summary[row.status] += 1
  return summary
}
