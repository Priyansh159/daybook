import { useEffect, useMemo, useState } from 'react'
import { useRecentDays } from '@/hooks/useRecentDays'
import { useMonthData } from '@/hooks/useMonthData'
import { currentYearMonth, formatShortDate, monthLabel } from '@/utils/date'
import { ATTENDANCE_META } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui/Feedback'
import type { AttendanceStatus } from '@/types/database'

const LEGEND_STATUSES: AttendanceStatus[] = ['WORKING', 'WFH', 'LEAVE', 'HOLIDAY', 'WEEK_OFF']
const DAYS = 30

type View = 'detailed' | 'compact'
type Range = 'last30' | 'month'
const VIEW_KEY = 'daybook-status-strip-view'
const RANGE_KEY = 'daybook-status-strip-range'

function readStored<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return (valid as readonly string[]).includes(v ?? '') ? (v as T) : fallback
  } catch {
    return fallback
  }
}

// Same column breakpoints for both ranges, so boxes stay the same size either
// way — 30 divides evenly (10/15/30), a 28–31 day month is close enough that
// the only cost is an occasionally short last row, not a size difference.
const COLUMNS = 'grid-cols-[repeat(10,minmax(0,1fr))] sm:grid-cols-[repeat(15,minmax(0,1fr))] lg:grid-cols-[repeat(30,minmax(0,1fr))]'

// The darker/more saturated dot colors read fine with light numerals; the
// lighter ones (amber, slate) need dark numerals for contrast.
const NUMBER_TEXT: Record<AttendanceStatus, string> = {
  WORKING: 'text-white',
  WFH: 'text-white',
  LEAVE: 'text-amber-950',
  HOLIDAY: 'text-white',
  WEEK_OFF: 'text-slate-700',
}

function DayTooltip({ date, label }: { date: string; label: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1',
        'text-xs font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100',
        'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
      )}
    >
      {formatShortDate(date)} · {label}
    </div>
  )
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: readonly { key: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 p-0.5 text-xs dark:border-slate-800" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={cn(
            'rounded px-2 py-0.5 font-medium transition-colors',
            value === o.key
              ? 'bg-brand-600 text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function StatusStrip({ employeeId }: { employeeId: string }) {
  const [view, setView] = useState<View>(() => readStored(VIEW_KEY, ['detailed', 'compact'], 'detailed'))
  const [range, setRange] = useState<Range>(() => readStored(RANGE_KEY, ['last30', 'month'], 'last30'))

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      // Ignore — the toggle still works for this session without persistence.
    }
  }, [view])
  useEffect(() => {
    try {
      localStorage.setItem(RANGE_KEY, range)
    } catch {
      // Ignore — the toggle still works for this session without persistence.
    }
  }, [range])

  const last30 = useRecentDays(employeeId, DAYS)
  const month = useMonthData(employeeId, currentYearMonth())

  const { entries, isLoading, error } = useMemo(() => {
    if (range === 'month') {
      return { entries: month.days.map((d) => ({ date: d.date, status: d.status })), isLoading: month.isLoading, error: month.error }
    }
    return { entries: last30.entries.map((d) => ({ date: d.date, status: d.status })), isLoading: last30.isLoading, error: last30.error }
  }, [range, last30.entries, last30.isLoading, last30.error, month.days, month.isLoading, month.error])

  const heading = range === 'month' ? monthLabel(currentYearMonth()) : `Last ${DAYS} Days`

  if (error) return null // Non-critical widget — the dashboard's other cards already surface real errors.

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{heading}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Date range"
            value={range}
            onChange={setRange}
            options={[
              { key: 'last30', label: 'Last 30 Days' },
              { key: 'month', label: 'Current Month' },
            ]}
          />
          <SegmentedControl
            label="Strip style"
            value={view}
            onChange={setView}
            options={[
              { key: 'compact', label: 'Compact' },
              { key: 'detailed', label: 'Detailed' },
            ]}
          />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className={view === 'detailed' ? 'h-28 w-full' : 'h-10 w-full'} />
      ) : view === 'detailed' ? (
        <div className={cn('grid gap-1.5', COLUMNS)}>
          {entries.map((day, i) => {
            const meta = day.status ? ATTENDANCE_META[day.status] : null
            const label = meta ? meta.label : 'Not marked'
            return (
              <div key={day.date} className="group relative">
                <div
                  className={cn(
                    // A fixed-width ring/brightness bump instead of scale() — scaling grows
                    // proportionally to the cell's own size, which overlaps neighbors badly
                    // once cells get big (e.g. the 7-wide month view).
                    'animate-pop-in flex aspect-square items-center justify-center rounded-md text-xs font-semibold ' +
                      'ring-0 ring-white/70 transition-[filter,box-shadow] group-hover:brightness-110 group-hover:ring-2 ' +
                      'group-focus-within:brightness-110 group-focus-within:ring-2 dark:ring-slate-950/70',
                    meta ? meta.dot : 'border border-dashed border-slate-300 dark:border-slate-700',
                    day.status ? NUMBER_TEXT[day.status] : 'text-slate-400 dark:text-slate-600',
                  )}
                  style={{ animationDelay: `${i * 12}ms`, animationFillMode: 'backwards' }}
                  tabIndex={0}
                  role="img"
                  aria-label={`${formatShortDate(day.date)}: ${label}`}
                >
                  {Number(day.date.slice(-2))}
                </div>
                <DayTooltip date={day.date} label={label} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {entries.map((day, i) => {
            const meta = day.status ? ATTENDANCE_META[day.status] : null
            const label = meta ? meta.label : 'Not marked'
            return (
              <div key={day.date} className="group relative">
                <div
                  className={cn(
                    'animate-pop-in h-4 w-4 rounded-sm ring-0 ring-white/70 transition-[filter,box-shadow] group-hover:brightness-110 ' +
                      'group-hover:ring-2 group-focus-within:brightness-110 group-focus-within:ring-2 dark:ring-slate-950/70 sm:h-5 sm:w-5',
                    meta ? meta.dot : 'border border-dashed border-slate-300 dark:border-slate-700',
                  )}
                  style={{ animationDelay: `${i * 12}ms`, animationFillMode: 'backwards' }}
                  tabIndex={0}
                  role="img"
                  aria-label={`${formatShortDate(day.date)}: ${label}`}
                />
                <DayTooltip date={day.date} label={label} />
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
