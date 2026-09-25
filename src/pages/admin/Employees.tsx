import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCreateEmployee, useEmployees } from '@/hooks/useEmployee'
import { useMonthBalances } from '@/hooks/useBalances'
import { useAttendance } from '@/hooks/useAttendance'
import { currentYearMonth, todayIso } from '@/utils/date'
import { formatDays, EMPLOYEE_STATUS_META, ROLE_META, ATTENDANCE_META } from '@/utils/formatters'
import { toUserMessage } from '@/lib/errors'
import type { EmployeeCreateValues } from '@/lib/validation'
import type { EmployeeStatus, Role } from '@/types/database'
import { useToast } from '@/hooks/useToast'
import { EmployeeFormDialog } from '@/components/employees/EmployeeFormDialog'
import { PageHeader, Pagination } from '@/components/ui/Navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Form'
import { ThemedSelect } from '@/components/ui/ThemedSelect'
import { Card } from '@/components/ui/Card'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

const PAGE_SIZE = 10

export default function Employees() {
  const toast = useToast()
  const employees = useEmployees()
  const ym = currentYearMonth()
  const today = todayIso()
  const leaveBalances = useMonthBalances('LEAVE', ym)
  const wfhBalances = useMonthBalances('WFH', ym)
  const attendanceToday = useAttendance({ from: today, to: today })
  const createEmployee = useCreateEmployee()

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | EmployeeStatus>('ALL')
  const [role, setRole] = useState<'ALL' | Role>('ALL')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const leaveByEmployee = useMemo(() => new Map((leaveBalances.data ?? []).map((b) => [b.employee_id, b])), [leaveBalances.data]);
  const wfhByEmployee = useMemo(() => new Map((wfhBalances.data ?? []).map((b) => [b.employee_id, b])), [wfhBalances.data]);
  const statusByEmployee = useMemo(() => new Map((attendanceToday.data ?? []).map((a) => [a.employee_id, a.status])), [attendanceToday.data]);

  const departments = useMemo(() => {
    const set = new Set((employees.data ?? []).map((e) => e.department).filter((d): d is string => Boolean(d)))
    return Array.from(set).sort()
  }, [employees.data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (employees.data ?? []).filter((e) => {
      if (status !== 'ALL' && e.status !== status) return false
      if (role !== 'ALL' && e.role !== role) return false
      if (department !== 'ALL' && e.department !== department) return false
      if (q && !(e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.employee_code.toLowerCase().includes(q))) return false
      return true
    })
  }, [employees.data, search, status, role, department])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const submitCreate = async (values: EmployeeCreateValues) => {
    setFormError(null)
    try {
      await createEmployee.mutateAsync(values)
      toast.success(`${values.fullName} was added`)
      setDialogOpen(false)
    } catch (err) {
      setFormError(toUserMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="Employees" description="Everyone in your organization" actions={<Button onClick={() => setDialogOpen(true)}>+ Add Employee</Button>} />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search by name, email, or employee ID"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full sm:max-w-xs"
        />
        <ThemedSelect
          className="w-full sm:w-44"
          value={department}
          onChange={(v) => { setDepartment(v); setPage(1) }}
          options={[{ value: 'ALL', label: 'All departments' }, ...departments.map((d) => ({ value: d, label: d }))]}
          ariaLabel="Filter by department"
        />
        <ThemedSelect
          className="w-full sm:w-40"
          value={status}
          onChange={(v) => { setStatus(v as typeof status); setPage(1) }}
          options={[
            { value: 'ALL', label: 'All statuses' },
            ...Object.entries(EMPLOYEE_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
          ]}
          ariaLabel="Filter by status"
        />
        <ThemedSelect
          className="w-full sm:w-36"
          value={role}
          onChange={(v) => { setRole(v as typeof role); setPage(1) }}
          options={[{ value: 'ALL', label: 'All roles' }, ...Object.entries(ROLE_META).map(([value, meta]) => ({ value, label: meta.label }))]}
          ariaLabel="Filter by role"
        />
      </div>

      <Card bodyClassName="p-0">
        {employees.isPending ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : employees.error ? (
          <div className="p-5">
            <ErrorState error={employees.error} onRetry={() => void employees.refetch()} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={employees.data?.length ? 'No employees match these filters.' : 'No employees have been added yet.'} />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Employee ID</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Department</Th>
                  <Th>Designation</Th>
                  <Th>Status</Th>
                  <Th>Leave Left</Th>
                  <Th>WFH Left</Th>
                  <Th>Today</Th>
                  <Th />
                </tr>
              </THead>
              <TBody>
                {paged.map((e) => {
                  const leave = leaveByEmployee.get(e.id)
                  const wfh = wfhByEmployee.get(e.id)
                  const todayStatus = statusByEmployee.get(e.id)
                  return (
                    <tr key={e.id}>
                      <Td className="font-medium text-slate-900 dark:text-slate-100">{e.employee_code}</Td>
                      <Td>{e.full_name}</Td>
                      <Td>{e.email}</Td>
                      <Td>{e.department ?? '—'}</Td>
                      <Td>{e.designation ?? '—'}</Td>
                      <Td>
                        <Badge tone={EMPLOYEE_STATUS_META[e.status].tone}>{EMPLOYEE_STATUS_META[e.status].label}</Badge>
                      </Td>
                      <Td>{leave ? formatDays(leave.remaining) : '—'}</Td>
                      <Td>{wfh ? formatDays(wfh.remaining) : '—'}</Td>
                      <Td>{todayStatus ? <Badge tone={ATTENDANCE_META[todayStatus].tone}>{ATTENDANCE_META[todayStatus].label}</Badge> : '—'}</Td>
                      <Td>
                        <Link to={`/admin/employees/${e.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                          View
                        </Link>
                      </Td>
                    </tr>
                  )
                })}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </>
        )}
      </Card>

      <EmployeeFormDialog open={dialogOpen} error={formError} onClose={() => setDialogOpen(false)} onSubmit={submitCreate} />
    </div>
  )
}
