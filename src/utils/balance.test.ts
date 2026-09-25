import { describe, expect, it } from 'vitest'
import {
  canConsume,
  computeRemaining,
  effectiveBalance,
  leaveDuration,
  statusChangeDelta,
  sumDurations,
  summarizeAttendance,
} from '@/utils/balance'

describe('leaveDuration', () => {
  it('is 1 for a full day and 0.5 for a half day (§10)', () => {
    expect(leaveDuration('FULL')).toBe(1)
    expect(leaveDuration('HALF')).toBe(0.5)
  })
})

describe('computeRemaining', () => {
  it('matches the default 2.5 monthly allocation with nothing used', () => {
    expect(computeRemaining({ allocated: 2.5, adjustment: 0, used: 0 })).toBe(2.5)
  })

  it('matches the spec example: full day + half day used against 2.5 (§10)', () => {
    // Monday full day (1) + Wednesday half day (0.5) = 1.5 used
    const used = leaveDuration('FULL') + leaveDuration('HALF')
    expect(used).toBe(1.5)
    expect(computeRemaining({ allocated: 2.5, adjustment: 0, used })).toBe(1)
  })

  it('applies an admin adjustment on top of allocated (§12)', () => {
    // allocated 2.5, used 1, adjustment +1 => remaining 2.5
    expect(computeRemaining({ allocated: 2.5, adjustment: 1, used: 1 })).toBe(2.5)
  })

  it('supports negative adjustments', () => {
    expect(computeRemaining({ allocated: 2.5, adjustment: -0.5, used: 0 })).toBe(2)
  })

  it('avoids floating point drift over repeated half-day steps', () => {
    let used = 0
    for (let i = 0; i < 5; i++) used += 0.5
    expect(computeRemaining({ allocated: 4, adjustment: 0, used })).toBe(1.5)
  })
})

describe('canConsume', () => {
  it('allows consuming exactly the remaining balance', () => {
    expect(canConsume({ allocated: 1, adjustment: 0, used: 0 }, 1)).toBe(true)
  })

  it('blocks consuming more than what remains', () => {
    expect(canConsume({ allocated: 0.5, adjustment: 0, used: 0 }, 1)).toBe(false)
  })

  it('blocks any usage once the balance is exhausted', () => {
    expect(canConsume({ allocated: 2.5, adjustment: 0, used: 2.5 }, 0.5)).toBe(false)
  })
})

describe('sumDurations', () => {
  it('only counts APPROVED records', () => {
    const records = [
      { duration: 1, status: 'APPROVED' },
      { duration: 0.5, status: 'APPROVED' },
      { duration: 1, status: 'CANCELLED' },
      { duration: 1, status: 'REJECTED' },
    ]
    expect(sumDurations(records)).toBe(1.5)
  })
})

describe('statusChangeDelta', () => {
  it('charges a full leave day when moving from Working to Leave', () => {
    expect(statusChangeDelta({ status: 'WORKING' }, { status: 'LEAVE', leaveType: 'FULL' })).toEqual({ leave: 1, wfh: 0 })
  })

  it('refunds the leave day when moving back to Working (§16 status switch)', () => {
    expect(statusChangeDelta({ status: 'LEAVE', leaveType: 'FULL' }, { status: 'WORKING' })).toEqual({ leave: -1, wfh: 0 })
  })

  it('nets to zero when switching Full to Full leave (no double charge)', () => {
    expect(statusChangeDelta({ status: 'LEAVE', leaveType: 'FULL' }, { status: 'LEAVE', leaveType: 'FULL' })).toEqual({ leave: 0, wfh: 0 })
  })

  it('charges the difference when switching Full leave to Half leave', () => {
    expect(statusChangeDelta({ status: 'LEAVE', leaveType: 'FULL' }, { status: 'LEAVE', leaveType: 'HALF' })).toEqual({ leave: -0.5, wfh: 0 })
  })

  it('swaps a leave day for a WFH day in one transition', () => {
    expect(statusChangeDelta({ status: 'LEAVE', leaveType: 'FULL' }, { status: 'WFH' })).toEqual({ leave: -1, wfh: 1 })
  })

  it('treats no prior record as Working (no charge to reverse)', () => {
    expect(statusChangeDelta(null, { status: 'WFH' })).toEqual({ leave: 0, wfh: 1 })
  })
})

describe('effectiveBalance', () => {
  it('falls back to the default allocation before the month row is initialized (§9, §40)', () => {
    const result = effectiveBalance(undefined, 2.5)
    expect(result).toEqual({ allocated: 2.5, adjustment: 0, used: 0, remaining: 2.5, initialized: false })
  })

  it('uses the real row once it exists', () => {
    const result = effectiveBalance({ allocated: 2.5, adjustment: 1, used: 1 }, 2.5)
    expect(result.remaining).toBe(2.5)
    expect(result.initialized).toBe(true)
  })
})

describe('summarizeAttendance', () => {
  it('counts each status independently', () => {
    const rows = [{ status: 'WORKING' as const }, { status: 'WORKING' as const }, { status: 'LEAVE' as const }, { status: 'WFH' as const }]
    expect(summarizeAttendance(rows)).toEqual({ WORKING: 2, WFH: 1, LEAVE: 1, HOLIDAY: 0, WEEK_OFF: 0 })
  })
})
