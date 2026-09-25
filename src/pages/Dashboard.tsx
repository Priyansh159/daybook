import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentEmployee } from '@/hooks/useAuth'
import { useBalance } from '@/hooks/useBalances'
import { useTasks } from '@/hooks/useTasks'
import { currentYearMonth, formatLongDate, greeting, monthLabel, todayIso } from '@/utils/date'
import { formatDays } from '@/utils/formatters'
import { sortOpenTasks, taskStats } from '@/utils/tasks'
import { TodayStatus } from '@/components/dashboard/TodayStatus'
import { StatusStrip } from '@/components/dashboard/StatusStrip'
import { BalanceCard, StatCard } from '@/components/dashboard/StatCard'
import { TaskRow } from '@/components/tasks/TaskRow'
import { TaskDialogs } from '@/components/tasks/TaskDialogs'
import { useTaskActions } from '@/components/tasks/useTaskActions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

export default function Dashboard() {
  const employee = useCurrentEmployee()
  const ym = currentYearMonth()
  const leave = useBalance('LEAVE', employee.id, ym)
  const wfh = useBalance('WFH', employee.id, ym)
  const tasks = useTasks({ employeeId: employee.id })
  const actions = useTaskActions(employee.id)

  const stats = useMemo(() => taskStats(tasks.data ?? []), [tasks.data])
  const openTasks = useMemo(() => sortOpenTasks(tasks.data ?? []).slice(0, 6), [tasks.data])
  const firstName = employee.full_name.split(' ')[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Today: {formatLongDate(todayIso())}</p>
      </div>

      <TodayStatus employeeId={employee.id} />

      <div className="grid gap-4 md:grid-cols-3">
        <BalanceCard title={`Leave · ${monthLabel(ym)}`} balance={leave.data} loading={leave.isPending} format={formatDays} />
        <BalanceCard title={`WFH · ${monthLabel(ym)}`} balance={wfh.data} loading={wfh.isPending} format={formatDays} />
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-0 md:rounded-xl md:border md:border-slate-200 md:bg-white md:p-4 md:shadow-sm dark:md:border-slate-800 dark:md:bg-slate-900">
          <p className="col-span-3 hidden text-sm font-semibold text-slate-900 dark:text-slate-100 md:block">Tasks</p>
          <div className="contents md:mt-3 md:grid md:grid-cols-3 md:gap-2 md:text-center">
            <StatCard label="Total" value={stats.total} loading={tasks.isPending} />
            <StatCard label="Pending" value={stats.pending} accent="amber" loading={tasks.isPending} />
            <StatCard label="Completed" value={stats.completed} accent="green" loading={tasks.isPending} />
          </div>
        </div>
      </div>
      {(leave.error || wfh.error) && <ErrorState error={leave.error ?? wfh.error} onRetry={() => { void leave.refetch(); void wfh.refetch() }} />}

      <Card>
        <StatusStrip employeeId={employee.id} />
      </Card>

      <Card
        title="Current Tasks"
        description="Your open tasks, soonest due first — swipe left for actions"
        actions={
          <>
            <Link to="/tasks" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              View all
            </Link>
            <Button size="sm" onClick={actions.openCreate}>
              + Add Task
            </Button>
          </>
        }
      >
        {tasks.isPending ? (
          <SkeletonRows rows={3} />
        ) : tasks.error ? (
          <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
        ) : openTasks.length === 0 ? (
          <EmptyState
            title="No tasks yet. Create your first task."
            action={
              <Button size="sm" onClick={actions.openCreate}>
                + Add Task
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onComplete={() => void actions.complete(task)}
                onEdit={() => actions.openEdit(task)}
                onDelete={() => void actions.deleteDirect(task)}
              />
            ))}
          </div>
        )}
      </Card>

      <TaskDialogs actions={actions} />
    </div>
  )
}
