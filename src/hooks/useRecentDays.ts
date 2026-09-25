import { useMemo } from 'react'
import type { AttendanceStatus } from '@/types/database'
import { isWeekOff, lastNDays } from '@/utils/date'
import { useAttendance } from '@/hooks/useAttendance'
import { useHolidays } from '@/hooks/useSettings'

export type RecentDay = { date: string; status: AttendanceStatus | null; implied: boolean; note: string | null }

// A rolling N-day window ending today — independent of calendar months, for
// the dashboard's "last 30 days" strip. Only needs attendance + holidays: the
// day's resolved status already lives on the attendance row once it's set.
export function useRecentDays(employeeId: string, days: number) {
  const dates = useMemo(() => lastNDays(days), [days])
  const from = dates[0]!
  const to = dates[dates.length - 1]!

  const attendance = useAttendance({ employeeId, from, to })
  const holidays = useHolidays({ from, to })

  const entries = useMemo<RecentDay[]>(() => {
    const att = new Map((attendance.data ?? []).map((r) => [r.date, r]))
    const hol = new Set((holidays.data ?? []).map((h) => h.date))
    return dates.map((date) => {
      const record = att.get(date)
      let status: AttendanceStatus | null = record?.status ?? null
      let implied = false
      if (!status && hol.has(date)) {
        status = 'HOLIDAY'
        implied = true
      } else if (!status && isWeekOff(date)) {
        status = 'WEEK_OFF'
        implied = true
      }
      return { date, status, implied, note: record?.note ?? null }
    })
  }, [dates, attendance.data, holidays.data])

  return {
    entries,
    isLoading: attendance.isPending || holidays.isPending,
    error: attendance.error ?? holidays.error,
  }
}
