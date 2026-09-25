import { useMemo, useState } from 'react'
import { useEmployeeMap } from '@/hooks/useEmployee'
import { useAttendance } from '@/hooks/useAttendance'
import { formatLongDate, todayIso } from '@/utils/date'
import { ATTENDANCE_META } from '@/utils/formatters'
import { PageHeader } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/dashboard/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Form'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

export default function AdminAttendance() {
  const [date, setDate] = useState(todayIso())
  const employees = useEmployeeMap()
  const attendance = useAttendance({ from: date, to: date })

  const rows = useMemo(() => {
    const byEmployee = new Map(attendance.data?.map((a) => [a.employee_id, a]))
    return (employees.data ?? [])
      .filter((e) => e.status !== 'INACTIVE')
      .map((e) => ({ employee: e, record: byEmployee.get(e.id) }))
      .sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name))
  }, [employees.data, attendance.data])

  const counts = useMemo(() => {
    const c = { WORKING: 0, WFH: 0, LEAVE: 0, HOLIDAY: 0, WEEK_OFF: 0, unmarked: 0 }
    for (const row of rows) {
      if (row.record) c[row.record.status] += 1
      else c.unmarked += 1
    }
    return c
  }, [rows])

  const loading = employees.isPending || attendance.isPending

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={formatLongDate(date)}
        actions={<Input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} className="w-auto" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Working" value={counts.WORKING} loading={loading} accent="green" />
        <StatCard label="WFH" value={counts.WFH} loading={loading} accent="blue" />
        <StatCard label="Leave" value={counts.LEAVE} loading={loading} accent="amber" />
        <StatCard label="Holiday" value={counts.HOLIDAY} loading={loading} accent="purple" />
        <StatCard label="Week Off" value={counts.WEEK_OFF} loading={loading} />
        <StatCard label="Not Marked" value={counts.unmarked} loading={loading} />
      </div>

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : employees.error || attendance.error ? (
          <div className="p-5">
            <ErrorState error={employees.error ?? attendance.error} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No employees found." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Employee</Th>
                <Th>Department</Th>
                <Th>Status</Th>
                <Th>Note</Th>
              </tr>
            </THead>
            <TBody>
              {rows.map(({ employee, record }) => (
                <tr key={employee.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{employee.full_name}</Td>
                  <Td>{employee.department ?? '—'}</Td>
                  <Td>{record ? <Badge tone={ATTENDANCE_META[record.status].tone}>{ATTENDANCE_META[record.status].label}</Badge> : <Badge tone="gray">Not marked</Badge>}</Td>
                  <Td className="max-w-xs truncate">{record?.note || '—'}</Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
