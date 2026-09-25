import { useMemo } from 'react'
import type { AttendanceRow, AttendanceStatus, HolidayRow, LeaveRequestRow, WfhRecordRow } from '@/types/database'
import { daysInMonth, isWeekOff, monthRange, type YearMonth } from '@/utils/date'
import { summarizeAttendance } from '@/utils/balance'
import { useAttendance } from '@/hooks/useAttendance'
import { useLeaveRequests } from '@/hooks/useLeave'
import { useWfhRecords } from '@/hooks/useWFH'
import { useHolidays } from '@/hooks/useSettings'

export type DayEntry = {
  date: string
  // Recorded status, or an implied HOLIDAY / WEEK_OFF when nothing is recorded.
  status: AttendanceStatus | null
  implied: boolean
  attendance?: AttendanceRow
  leave?: LeaveRequestRow
  wfh?: WfhRecordRow
  holiday?: HolidayRow
}

// One month of a single employee's days, built from four queries total.
export function useMonthData(employeeId: string, ym: YearMonth) {
  const range = monthRange(ym)
  const attendance = useAttendance({ employeeId, ...range })
  const leaves = useLeaveRequests({ employeeId, month: ym })
  const wfh = useWfhRecords({ employeeId, month: ym })
  const holidays = useHolidays(range)

  const days = useMemo<DayEntry[]>(() => {
    const byDate = <T extends { date: string }>(rows: T[] | undefined, keep: (r: T) => boolean = () => true) =>
      new Map((rows ?? []).filter(keep).map((r) => [r.date, r]))
    const att = byDate(attendance.data)
    const lv = byDate(leaves.data, (r) => r.status !== 'CANCELLED')
    const wf = byDate(wfh.data, (r) => r.status !== 'CANCELLED')
    const hol = byDate(holidays.data)

    return daysInMonth(ym).map((date) => {
      const record = att.get(date)
      const holiday = hol.get(date)
      let status: AttendanceStatus | null = record?.status ?? null
      let implied = false
      if (!status && holiday) {
        status = 'HOLIDAY'
        implied = true
      } else if (!status && isWeekOff(date)) {
        status = 'WEEK_OFF'
        implied = true
      }
      return { date, status, implied, attendance: record, leave: lv.get(date), wfh: wf.get(date), holiday }
    })
  }, [attendance.data, leaves.data, wfh.data, holidays.data, ym])

  const summary = useMemo(
    () => summarizeAttendance(days.filter((d): d is DayEntry & { status: AttendanceStatus } => d.status !== null)),
    [days],
  )

  const queries = [attendance, leaves, wfh, holidays]
  return {
    days,
    summary,
    isLoading: queries.some((q) => q.isPending),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => queries.forEach((q) => void q.refetch()),
  }
}
