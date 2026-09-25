import { describe, expect, it } from 'vitest'
import { currentYearMonth, daysInMonth, isWeekOff, monthLabel, monthRange, shiftMonth, todayIso, yearMonthOf } from '@/utils/date'

describe('todayIso / currentYearMonth', () => {
  it('derive the calendar date from Asia/Kolkata, not the machine timezone', () => {
    // 2026-09-24T19:00:00Z is 2026-09-25 00:30 IST — already the next day in IST.
    const utcLateNight = new Date('2026-09-24T19:00:00.000Z')
    expect(todayIso(utcLateNight)).toBe('2026-09-25')
    expect(currentYearMonth(utcLateNight)).toEqual({ year: 2026, month: 9 })
  })

  it('does not roll over to the next month too early', () => {
    // 2026-01-31T17:00:00Z is 2026-01-31 22:30 IST — still January.
    const utcEvening = new Date('2026-01-31T17:00:00.000Z')
    expect(todayIso(utcEvening)).toBe('2026-01-31')
  })
})

describe('daysInMonth / monthRange', () => {
  it('returns every calendar day for the month, from and to', () => {
    const days = daysInMonth({ year: 2026, month: 2 })
    expect(days).toHaveLength(28) // 2026 is not a leap year
    expect(days[0]).toBe('2026-02-01')
    expect(days.at(-1)).toBe('2026-02-28')
    expect(monthRange({ year: 2026, month: 2 })).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('handles a leap year', () => {
    expect(daysInMonth({ year: 2024, month: 2 })).toHaveLength(29)
  })
})

describe('shiftMonth', () => {
  it('rolls forward across a year boundary', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
  })

  it('rolls backward across a year boundary', () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
  })
})

describe('isWeekOff', () => {
  it('treats only Sunday as the weekly off day (6-day work week)', () => {
    expect(isWeekOff('2026-09-27')).toBe(true) // Sunday
    expect(isWeekOff('2026-09-26')).toBe(false) // Saturday — a working day here
    expect(isWeekOff('2026-09-24')).toBe(false) // Thursday
  })
})

describe('yearMonthOf / monthLabel', () => {
  it('parses a date string into its year and month', () => {
    expect(yearMonthOf('2026-09-24')).toEqual({ year: 2026, month: 9 })
  })

  it('formats a readable month label', () => {
    expect(monthLabel({ year: 2026, month: 9 })).toBe('September 2026')
  })
})
