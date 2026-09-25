import { useMemo } from 'react'
import { useEmployees } from '@/hooks/useEmployee'
import { useMonthBalances } from '@/hooks/useBalances'
import { useAttendance } from '@/hooks/useAttendance'
import { useLeaveRequests } from '@/hooks/useLeave'
import { useTasks } from '@/hooks/useTasks'
import { currentYearMonth, todayIso } from '@/utils/date'

// One shared bundle of the handful of queries every admin overview page needs.
export function useAdminOverview() {
  const today = todayIso()
  const ym = currentYearMonth()
  const employees = useEmployees()
  const leaveBalances = useMonthBalances('LEAVE', ym)
  const wfhBalances = useMonthBalances('WFH', ym)
  const todayAttendance = useAttendance({ from: today, to: today })
  const pendingLeaves = useLeaveRequests({ status: 'PENDING' })
  const tasks = useTasks()

  const queries = [employees, leaveBalances, wfhBalances, todayAttendance, pendingLeaves, tasks]

  const todayCounts = useMemo(() => {
    const rows = todayAttendance.data ?? []
    return {
      working: rows.filter((r) => r.status === 'WORKING').length,
      wfh: rows.filter((r) => r.status === 'WFH').length,
      leave: rows.filter((r) => r.status === 'LEAVE').length,
    }
  }, [todayAttendance.data])

  const taskCounts = useMemo(() => {
    const rows = tasks.data ?? []
    return {
      inProgress: rows.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: rows.filter((t) => t.status === 'COMPLETED').length,
    }
  }, [tasks.data])

  return {
    employees,
    leaveBalances,
    wfhBalances,
    todayAttendance,
    pendingLeaves,
    tasks,
    todayCounts,
    taskCounts,
    isLoading: queries.some((q) => q.isPending),
    error: queries.find((q) => q.error)?.error ?? null,
  }
}
