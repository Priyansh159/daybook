import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export const BUSINESS_TIMEZONE = 'Asia/Kolkata'

export type YearMonth = { year: number; month: number }

// Calendar dates travel as 'yyyy-MM-dd' strings end-to-end (Postgres DATE),
// so parse them as local wall-clock dates, never through UTC.
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayIso(now: Date = new Date()): string {
  return formatInTimeZone(now, BUSINESS_TIMEZONE, 'yyyy-MM-dd')
}

export function currentYearMonth(now: Date = new Date()): YearMonth {
  const [year, month] = formatInTimeZone(now, BUSINESS_TIMEZONE, 'yyyy-MM').split('-').map(Number)
  return { year: year ?? 1970, month: month ?? 1 }
}

export function yearMonthOf(iso: string): YearMonth {
  const [year, month] = iso.split('-').map(Number)
  return { year: year ?? 1970, month: month ?? 1 }
}

export function formatLongDate(iso: string): string {
  return format(parseIsoDate(iso), 'd MMMM yyyy')
}

export function formatShortDate(iso: string): string {
  return format(parseIsoDate(iso), 'd MMM yyyy')
}

export function formatDateTime(timestamp: string): string {
  return formatInTimeZone(new Date(timestamp), BUSINESS_TIMEZONE, 'd MMM yyyy, h:mm a')
}

export function monthLabel({ year, month }: YearMonth): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy')
}

export function daysInMonth({ year, month }: YearMonth): string[] {
  const count = new Date(year, month, 0).getDate()
  return Array.from({ length: count }, (_, i) => toIsoDate(new Date(year, month - 1, i + 1)))
}

export function monthRange({ year, month }: YearMonth): { from: string; to: string } {
  const days = daysInMonth({ year, month })
  return { from: days[0]!, to: days[days.length - 1]! }
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

// Weekly off day — Sunday only (6-day work week, Mon–Sat).
// The trailing N days ending today (inclusive), oldest first.
export function lastNDays(n: number, end: Date = new Date()): string[] {
  const endDate = parseIsoDate(todayIso(end))
  return Array.from({ length: n }, (_, i) =>
    toIsoDate(new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - (n - 1 - i))),
  )
}

export function isWeekOff(iso: string): boolean {
  return parseIsoDate(iso).getDay() === 0
}

export function greeting(now: Date = new Date()): string {
  const hour = Number(formatInTimeZone(now, BUSINESS_TIMEZONE, 'H'))
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function relativeDueLabel(dueIso: string, today: string = todayIso()): string {
  const diff = Math.round((parseIsoDate(dueIso).getTime() - parseIsoDate(today).getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)} days overdue`
  return formatShortDate(dueIso)
}
