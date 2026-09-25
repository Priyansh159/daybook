import { useState } from 'react'
import { Navigate, useParams, Link } from 'react-router-dom'
import { useEmployeeById, useSetEmployeeStatus, useUpdateEmployee } from '@/hooks/useEmployee'
import { useAdjustBalance, useBalance } from '@/hooks/useBalances'
import { useTasks } from '@/hooks/useTasks'
import { useAuditLogs } from '@/hooks/useSettings'
import { currentYearMonth, formatDateTime, formatShortDate, monthLabel } from '@/utils/date'
import { formatDays, EMPLOYEE_STATUS_META, ROLE_META } from '@/utils/formatters'
import { taskStats } from '@/utils/tasks'
import { toUserMessage } from '@/lib/errors'
import type { AdjustmentValues, EmployeeUpdateValues } from '@/lib/validation'
import type { BalanceKind, EmployeeStatus } from '@/types/database'
import { useToast } from '@/hooks/useToast'
import { useTheme } from '@/hooks/useTheme'
import { EmployeeEditDialog } from '@/components/employees/EmployeeEditDialog'
import { AdjustBalanceDialog } from '@/components/employees/AdjustBalanceDialog'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { TaskCard } from '@/components/tasks/TaskCard'
import { PageHeader, Tabs } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { BalanceCard, StatCard } from '@/components/dashboard/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { FullPageSpinner } from '@/components/ui/Spinner'
import HoldButton from '@/components/micro/HoldButton'

type Tab = 'overview' | 'calendar' | 'tasks' | 'activity'

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const { resolved } = useTheme()
  const employee = useEmployeeById(id)
  const ym = currentYearMonth()

  const [tab, setTab] = useState<Tab>('overview')
  const [calendarMonth, setCalendarMonth] = useState(ym)
  const [editOpen, setEditOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [adjustKind, setAdjustKind] = useState<BalanceKind | null>(null)
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const leave = useBalance('LEAVE', id, ym)
  const wfh = useBalance('WFH', id, ym)
  const tasks = useTasks({ employeeId: id })
  const audit = useAuditLogs({ entityId: id })

  const updateEmployee = useUpdateEmployee()
  const setStatus = useSetEmployeeStatus()
  const adjustBalance = useAdjustBalance()

  if (!id) return <Navigate to="/admin/employees" replace />
  if (employee.isPending) return <FullPageSpinner />
  if (employee.error || !employee.data) return <ErrorState error={employee.error} onRetry={() => void employee.refetch()} />

  const emp = employee.data
  const stats = taskStats(tasks.data ?? [])

  const submitEdit = async (values: EmployeeUpdateValues) => {
    setEditError(null)
    try {
      await updateEmployee.mutateAsync({ id: emp.id, values })
      toast.success('Employee updated')
      setEditOpen(false)
    } catch (err) {
      setEditError(toUserMessage(err))
    }
  }

  const submitAdjust = async (values: AdjustmentValues) => {
    if (!adjustKind) return
    setAdjustError(null)
    try {
      await adjustBalance.mutateAsync({ kind: adjustKind, employeeId: emp.id, ym, amount: values.amount, reason: values.reason })
      toast.success('Balance adjusted')
      setAdjustKind(null)
    } catch (err) {
      setAdjustError(toUserMessage(err))
    }
  }

  const confirmDeactivate = async () => {
    const next: EmployeeStatus = emp.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
    try {
      await setStatus.mutateAsync({ id: emp.id, status: next })
      toast.success(next === 'INACTIVE' ? 'Employee deactivated' : 'Employee reactivated')
      setDeactivating(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div>
      <Link to="/admin/employees" className="mb-2 inline-block text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        ← Back to Employees
      </Link>
      <PageHeader
        title={emp.full_name}
        description={`${emp.employee_code} · ${emp.email}`}
        actions={
          <>
            <Badge tone={ROLE_META[emp.role].tone}>{ROLE_META[emp.role].label}</Badge>
            <Badge tone={EMPLOYEE_STATUS_META[emp.status].tone}>{EMPLOYEE_STATUS_META[emp.status].label}</Badge>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant={emp.status === 'INACTIVE' ? 'primary' : 'danger'} onClick={() => setDeactivating(true)}>
              {emp.status === 'INACTIVE' ? 'Reactivate' : 'Deactivate'}
            </Button>
          </>
        }
      />

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'calendar', label: 'Calendar' },
          { value: 'tasks', label: 'Tasks', count: tasks.data?.length },
          { value: 'activity', label: 'Activity' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <BalanceCard title={`Leave · ${monthLabel(ym)}`} balance={leave.data} loading={leave.isPending} format={formatDays} />
                <Button size="sm" variant="secondary" onClick={() => setAdjustKind('LEAVE')}>
                  Adjust leave
                </Button>
              </div>
              <div className="space-y-2">
                <BalanceCard title={`WFH · ${monthLabel(ym)}`} balance={wfh.data} loading={wfh.isPending} format={formatDays} />
                <Button size="sm" variant="secondary" onClick={() => setAdjustKind('WFH')}>
                  Adjust WFH
                </Button>
              </div>
            </div>
            <Card title="Tasks" description={`This month's task summary`}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <StatCard label="Total" value={stats.total} loading={tasks.isPending} />
                <StatCard label="Completed" value={stats.completed} accent="green" loading={tasks.isPending} />
                <StatCard label="In Progress" value={stats.IN_PROGRESS} accent="blue" loading={tasks.isPending} />
              </div>
            </Card>
            <Card title="Employee information">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info label="Department" value={emp.department ?? '—'} />
                <Info label="Designation" value={emp.designation ?? '—'} />
                <Info label="Phone" value={emp.phone ?? '—'} />
                <Info label="Joined" value={formatShortDate(emp.joining_date)} />
              </dl>
            </Card>
          </div>
        )}

        {tab === 'calendar' && (
          <Card>
            <MonthCalendar employeeId={emp.id} month={calendarMonth} onMonthChange={setCalendarMonth} />
          </Card>
        )}

        {tab === 'tasks' && (
          <Card bodyClassName="p-5">
            {tasks.isPending ? null : tasks.data?.length === 0 ? (
              <EmptyState title="This employee has no tasks yet." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {tasks.data?.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'activity' && (
          <Card title="Recent activity" bodyClassName="p-0">
            {audit.data?.length === 0 ? (
              <EmptyState title="No recorded activity yet." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {audit.data?.map((log) => (
                  <li key={log.id} className="px-5 py-3 text-sm">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{log.action.replaceAll('_', ' ')}</p>
                    <p className="text-slate-500 dark:text-slate-400">{formatDateTime(log.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <EmployeeEditDialog open={editOpen} employee={emp} error={editError} onClose={() => setEditOpen(false)} onSubmit={submitEdit} />
      {adjustKind && (
        <AdjustBalanceDialog open={Boolean(adjustKind)} kind={adjustKind} ym={ym} error={adjustError} onClose={() => setAdjustKind(null)} onSubmit={submitAdjust} />
      )}
      {emp.status === 'INACTIVE' ? (
        <ConfirmDialog
          open={deactivating}
          title="Reactivate employee?"
          message={`${emp.full_name} will regain access to the portal.`}
          tone="primary"
          confirmLabel="Reactivate"
          loading={setStatus.isPending}
          onConfirm={() => void confirmDeactivate()}
          onCancel={() => setDeactivating(false)}
        />
      ) : (
        <Dialog open={deactivating} onClose={setStatus.isPending ? () => undefined : () => setDeactivating(false)} title="Deactivate employee?" size="sm">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-slate-100">{emp.full_name}</span> will lose access to the portal. Their
            historical data is kept. Hold the button below to confirm.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeactivating(false)} disabled={setStatus.isPending}>
              Cancel
            </Button>
            <HoldButton
              backgroundColor={resolved === 'dark' ? '#1e293b' : '#f1f5f9'}
              textColor={resolved === 'dark' ? '#f1f5f9' : '#0f172a'}
              fillColor="#dc2626"
              holdTime={1200}
              disabled={setStatus.isPending}
              onHold={() => void confirmDeactivate()}
            >
              Hold to deactivate
            </HoldButton>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  )
}
