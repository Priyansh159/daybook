import { useState } from 'react'
import type { DayEntry } from '@/hooks/useMonthData'
import { useMonthData } from '@/hooks/useMonthData'
import { currentYearMonth, formatLongDate, monthLabel, shiftMonth, todayIso, type YearMonth } from '@/utils/date'
import { ATTENDANCE_META, LEAVE_TYPE_LABEL } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { MonthPicker } from '@/components/ui/Navigation'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthCalendar({ employeeId, month, onMonthChange }: { employeeId: string; month: YearMonth; onMonthChange: (ym: YearMonth) => void }) {
  const { days, isLoading, error, refetch } = useMonthData(employeeId, month)
  const [selected, setSelected] = useState<DayEntry | null>(null)
  const today = todayIso()
  const now = currentYearMonth()
  const isCurrentOrFutureMonth = month.year > now.year || (month.year === now.year && month.month >= now.month)

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
          </div>
        )}
      </Dialog>
    </div>
  )
}
