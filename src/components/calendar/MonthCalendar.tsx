import { useMemo, useState } from 'react'
import type { DayEntry } from '@/hooks/useMonthData'
import { useMonthData } from '@/hooks/useMonthData'
import { useTasks } from '@/hooks/useTasks'
import type { TaskRow } from '@/types/database'
import { currentYearMonth, formatLongDate, monthLabel, shiftMonth, todayIso, type YearMonth } from '@/utils/date'
import { ATTENDANCE_META, LEAVE_TYPE_LABEL, TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { taskFallsOnDate } from '@/utils/tasks'
import { cn } from '@/utils/cn'
import { MonthPicker } from '@/components/ui/Navigation'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { DailyStatusPicker } from '@/components/dashboard/DailyStatusPicker'
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthCalendar({ employeeId, month, onMonthChange }: { employeeId: string; month: YearMonth; onMonthChange: (ym: YearMonth) => void }) {
  const { days, isLoading, error, refetch } = useMonthData(employeeId, month)
  const tasks = useTasks({ employeeId })
  const [selected, setSelected] = useState<DayEntry | null>(null)
  const [viewingTask, setViewingTask] = useState<TaskRow | null>(null)
  const today = todayIso()
  const now = currentYearMonth()
  const isCurrentOrFutureMonth = month.year > now.year || (month.year === now.year && month.month >= now.month)

  const tasksOnSelected = useMemo(
    () => (selected ? (tasks.data ?? []).filter((t) => taskFallsOnDate(t, selected.date)) : []),
    [tasks.data, selected],
  )

  const leadingBlanks = new Date(month.year, month.month - 1, 1).getDay()

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{monthLabel(month)}</h3>
        <MonthPicker
          label={monthLabel(month)}
          onPrev={() => onMonthChange(shiftMonth(month, -1))}
          onNext={() => onMonthChange(shiftMonth(month, 1))}
          disableNext={isCurrentOrFutureMonth}
        />
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {isLoading
          ? Array.from({ length: days.length || 30 }, (_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
          : days.map((day) => {
              const meta = day.status ? ATTENDANCE_META[day.status] : null
              const isToday = day.date === today
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={cn(
                    'flex h-16 flex-col items-start rounded-lg border p-1.5 text-left transition-colors hover:border-brand-400 dark:hover:border-brand-500',
                    isToday ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-800',
                  )}
                >
                  <span className={cn('text-xs font-medium', isToday ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400')}>
                    {Number(day.date.slice(-2))}
                  </span>
                  {meta && (
                    <span className="mt-auto inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium">
                      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                      <span className="truncate text-slate-600 dark:text-slate-400">{meta.label}</span>
                    </span>
                  )}
                </button>
              )
            })}
      </div>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? formatLongDate(selected.date) : ''} size="sm">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              {selected.status ? <Badge tone={ATTENDANCE_META[selected.status].tone}>{ATTENDANCE_META[selected.status].label}</Badge> : <Badge tone="gray">Not marked</Badge>}
              {selected.implied && <span className="text-xs text-slate-400 dark:text-slate-500">(auto)</span>}
            </div>
            {selected.leave && (
              <p>
                <span className="text-slate-500 dark:text-slate-400">Leave type:</span> {LEAVE_TYPE_LABEL[selected.leave.leave_type]}
              </p>
            )}
            {selected.holiday && (
              <p>
                <span className="text-slate-500 dark:text-slate-400">Holiday:</span> {selected.holiday.name}
              </p>
            )}
            {(selected.attendance?.note || selected.leave?.reason || selected.wfh?.reason) && (
              <p>
                <span className="text-slate-500 dark:text-slate-400">Note:</span> {selected.attendance?.note || selected.leave?.reason || selected.wfh?.reason}
              </p>
            )}

            {tasksOnSelected.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tasks</p>
                {tasksOnSelected.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setViewingTask(task)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-brand-400 dark:border-slate-800 dark:hover:border-brand-500"
                  >
                    <span className={cn('truncate font-medium', task.status === 'COMPLETED' && 'text-slate-400 line-through dark:text-slate-500')}>
                      {task.title}
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <Badge tone={TASK_STATUS_META[task.status].tone}>{TASK_STATUS_META[task.status].label}</Badge>
                      <Badge tone={TASK_PRIORITY_META[task.priority].tone}>{TASK_PRIORITY_META[task.priority].label}</Badge>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Update status</p>
              <DailyStatusPicker employeeId={employeeId} date={selected.date} compact />
            </div>
          </div>
        )}
      </Dialog>
      <TaskDetailDialog task={viewingTask} onClose={() => setViewingTask(null)} />
    </div>
  )
}
