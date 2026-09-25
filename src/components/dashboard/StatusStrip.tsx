import { useRecentDays } from '@/hooks/useRecentDays'
import { formatShortDate } from '@/utils/date'
import { ATTENDANCE_META } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui/Feedback'
import type { AttendanceStatus } from '@/types/database'

const LEGEND_STATUSES: AttendanceStatus[] = ['WORKING', 'WFH', 'LEAVE', 'HOLIDAY', 'WEEK_OFF']
const DAYS = 30

export function StatusStrip({ employeeId }: { employeeId: string }) {
  const { entries, isLoading, error } = useRecentDays(employeeId, DAYS)

  if (error) return null // Non-critical widget — the dashboard's other cards already surface real errors.

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Last {DAYS} Days</h3>
      </div>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="flex flex-wrap gap-1">
          {entries.map((day, i) => {
            const meta = day.status ? ATTENDANCE_META[day.status] : null
            const label = meta ? meta.label : 'Not marked'
            return (
              <div key={day.date} className="group relative">
                <div
                  className={cn(
                    'animate-pop-in h-4 w-4 rounded-sm transition-transform group-hover:scale-125 group-focus-within:scale-125 sm:h-5 sm:w-5',
                    meta ? meta.dot : 'border border-dashed border-slate-300 dark:border-slate-700',
                  )}
                  style={{ animationDelay: `${i * 12}ms`, animationFillMode: 'backwards' }}
                  tabIndex={0}
                  role="img"
                  aria-label={`${formatShortDate(day.date)}: ${label}`}
                />
                <div
                  className={cn(
                    'pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1',
                    'text-xs font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100',
                    'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
                  )}
                >
                  {formatShortDate(day.date)} · {label}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        {LEGEND_STATUSES.map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-sm', ATTENDANCE_META[status].dot)} />
            {ATTENDANCE_META[status].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm border border-dashed border-slate-300 dark:border-slate-700" />
          Not marked
        </span>
      </div>
    </div>
  )
}
