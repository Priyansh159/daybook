import { useMemo, useState } from 'react'
import { useEmployeeMap } from '@/hooks/useEmployee'
import { useMonthBalances } from '@/hooks/useBalances'
import { useTasks } from '@/hooks/useTasks'
import { useAttendance } from '@/hooks/useAttendance'
import { currentYearMonth, monthLabel, monthRange, shiftMonth } from '@/utils/date'
import { formatDays } from '@/utils/formatters'
import { taskStats } from '@/utils/tasks'
import { PageHeader, MonthPicker } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/dashboard/StatCard'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { ErrorState, SkeletonRows } from '@/components/ui/Feedback'

export default function Reports() {
  const [month, setMonth] = useState(currentYearMonth())
  const employees = useEmployeeMap()
  const leave = useMonthBalances('LEAVE', month)
  const wfh = useMonthBalances('WFH', month)
  const tasks = useTasks()
  const range = monthRange(month)
  const attendance = useAttendance({ from: range.from, to: range.to })

  const rows = useMemo(() => {
    const leaveByEmp = new Map(leave.data?.map((b) => [b.employee_id, b]))
    const wfhByEmp = new Map(wfh.data?.map((b) => [b.employee_id, b]))
    const attendanceByEmp = new Map<string, { working: number; wfh: number; leave: number }>()
    for (const a of attendance.data ?? []) {
      const entry = attendanceByEmp.get(a.employee_id) ?? { working: 0, wfh: 0, leave: 0 }
      if (a.status === 'WORKING') entry.working += 1
      if (a.status === 'WFH') entry.wfh += 1
      if (a.status === 'LEAVE') entry.leave += 1
      attendanceByEmp.set(a.employee_id, entry)
    }
    return (employees.data ?? [])
      .filter((e) => e.status !== 'INACTIVE')
      .map((e) => ({
        employee: e,
        leaveUsed: leaveByEmp.get(e.id)?.used ?? 0,
        wfhUsed: wfhByEmp.get(e.id)?.used ?? 0,
        attendance: attendanceByEmp.get(e.id) ?? { working: 0, wfh: 0, leave: 0 },
        tasks: taskStats((tasks.data ?? []).filter((t) => t.employee_id === e.id)),
      }))
      .sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name))
  }, [employees.data, leave.data, wfh.data, attendance.data, tasks.data])

  const totals = useMemo(
    () => ({
      leave: rows.reduce((s, r) => s + r.leaveUsed, 0),
      wfh: rows.reduce((s, r) => s + r.wfhUsed, 0),
      tasksCompleted: rows.reduce((s, r) => s + r.tasks.completed, 0),
      tasksTotal: rows.reduce((s, r) => s + r.tasks.total, 0),
    }),
    [rows],
  )

  const loading = employees.isPending || leave.isPending || wfh.isPending || tasks.isPending || attendance.isPending
  const error = employees.error ?? leave.error ?? wfh.error ?? tasks.error ?? attendance.error

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Monthly usage across the organization"
        actions={<MonthPicker label={monthLabel(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Leave Days Used" value={formatDays(totals.leave)} loading={loading} />
        <StatCard label="WFH Days Used" value={formatDays(totals.wfh)} loading={loading} />
        <StatCard label="Tasks Completed" value={totals.tasksCompleted} loading={loading} accent="green" />
        <StatCard label="Tasks Total" value={totals.tasksTotal} loading={loading} />
      </div>

      <Card title={monthLabel(month)} bodyClassName="p-0">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorState error={error} />
          </div>
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Employee</Th>
                <Th>Leave Used</Th>
                <Th>WFH Used</Th>
                <Th>Working Days</Th>
                <Th>Tasks Completed</Th>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <tr key={r.employee.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{r.employee.full_name}</Td>
                  <Td>{formatDays(r.leaveUsed)}</Td>
                  <Td>{formatDays(r.wfhUsed)}</Td>
                  <Td>{r.attendance.working}</Td>
                  <Td>
                    {r.tasks.completed} / {r.tasks.total}
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
