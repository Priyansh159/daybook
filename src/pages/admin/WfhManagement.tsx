import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEmployeeMap } from '@/hooks/useEmployee'
import { useMonthBalances } from '@/hooks/useBalances'
import { useWfhRecords } from '@/hooks/useWFH'
import { currentYearMonth, monthLabel, shiftMonth, todayIso } from '@/utils/date'
import { formatDays } from '@/utils/formatters'
import { PageHeader, MonthPicker } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

export default function WfhManagement() {
  const [month, setMonth] = useState(currentYearMonth())
  const employees = useEmployeeMap()
  const balances = useMonthBalances('WFH', month)
  const today = todayIso()
  const todayWfh = useWfhRecords({ month, status: 'APPROVED' })

  const workingFromHomeToday = useMemo(() => (todayWfh.data ?? []).filter((r) => r.date === today), [todayWfh.data, today])

  const rows = useMemo(() => {
    const activeEmployees = (employees.map ? Array.from(employees.map.values()) : []).filter((e) => e.status !== 'INACTIVE')
    const byEmployee = new Map(balances.data?.map((b) => [b.employee_id, b]))
    return activeEmployees
      .map((e) => ({ employee: e, balance: byEmployee.get(e.id) }))
      .sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name))
  }, [employees.map, balances.data])

  const loading = employees.isPending || balances.isPending

  return (
    <div>
      <PageHeader
        title="WFH Management"
        description={`Working from home today: ${workingFromHomeToday.length}`}
        actions={<MonthPicker label={monthLabel(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />}
      />

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={5} />
          </div>
        ) : employees.error || balances.error ? (
          <div className="p-5">
            <ErrorState error={employees.error ?? balances.error} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No employees found." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Employee</Th>
                <Th>Allocated</Th>
                <Th>Used</Th>
                <Th>Remaining</Th>
                <Th />
              </tr>
            </THead>
            <TBody>
              {rows.map(({ employee, balance }) => (
                <tr key={employee.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{employee.full_name}</Td>
                  <Td>{balance ? formatDays(balance.allocated + balance.adjustment) : '—'}</Td>
                  <Td>{balance ? formatDays(balance.used) : '0'}</Td>
                  <Td>{balance ? formatDays(balance.remaining) : '—'}</Td>
                  <Td>
                    <Link to={`/admin/employees/${employee.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                      Manage
                    </Link>
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
