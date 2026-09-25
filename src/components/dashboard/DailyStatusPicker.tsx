import { useState } from 'react'
import type { AttendanceStatus, LeaveType } from '@/types/database'
import { formatLongDate, yearMonthOf } from '@/utils/date'
import { canConsume, statusChangeDelta } from '@/utils/balance'
import { ATTENDANCE_META } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { toUserMessage } from '@/lib/errors'
import { useToast } from '@/hooks/useToast'
import { useAttendance, useSetDailyStatus } from '@/hooks/useAttendance'
import { useBalance } from '@/hooks/useBalances'
import { useLeaveRequests } from '@/hooks/useLeave'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Form'
import { Skeleton } from '@/components/ui/Feedback'
import { Spinner } from '@/components/ui/Spinner'

type Choice = { key: string; status: AttendanceStatus; portion: LeaveType; label: string; shortLabel?: string }

// The Working/WFH/Leave picker for a single day — used both for "today" on
// the dashboard (compact off: one click, no confirm — it's the everyday
// action) and for any past/future day from the calendar (compact on: small
// buttons + a confirm step, since editing another day is occasional and
// should feel deliberate). The backend doesn't restrict which date this can
// be called for.
export function DailyStatusPicker({ employeeId, date, compact = false }: { employeeId: string; date: string; compact?: boolean }) {
  const ym = yearMonthOf(date)
  const toast = useToast()
  const [note, setNote] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<Choice | null>(null)

  const attendance = useAttendance({ employeeId, from: date, to: date })
  const leaveBalance = useBalance('LEAVE', employeeId, ym)
  const wfhBalance = useBalance('WFH', employeeId, ym)
  const leaves = useLeaveRequests({ employeeId, month: ym })
  const settings = useSettings()
  const setStatus = useSetDailyStatus()

  const current = attendance.data?.[0]
  const dateLeave = leaves.data?.find((l) => l.date === date && l.status !== 'CANCELLED')
  const currentState = current
    ? { status: current.status, leaveType: current.status === 'LEAVE' ? dateLeave?.leave_type : undefined }
    : null

  const choices: Choice[] = [
    { key: 'WORKING', status: 'WORKING', portion: 'FULL', label: 'Working' },
    { key: 'WFH', status: 'WFH', portion: 'FULL', label: 'WFH' },
    { key: 'LEAVE', status: 'LEAVE', portion: 'FULL', label: 'Leave' },
  ]
  if (settings.data?.allow_half_day_leave) {
    choices.push({ key: 'LEAVE_HALF', status: 'LEAVE', portion: 'HALF', label: 'Half-day Leave', shortLabel: 'Half Day' })
  }

  const isSelected = (c: Choice) =>
    current?.status === c.status && (c.status !== 'LEAVE' || (dateLeave?.leave_type ?? 'FULL') === c.portion)

  // UI pre-check only; set_daily_status re-validates in the database.
  const blockedReason = (c: Choice): string | null => {
    const delta = statusChangeDelta(currentState, { status: c.status, leaveType: c.portion })
    if (delta.leave > 0 && leaveBalance.data && !canConsume(leaveBalance.data, delta.leave)) return 'No leave balance left that month'
    if (delta.wfh > 0 && wfhBalance.data && !canConsume(wfhBalance.data, delta.wfh)) return 'No WFH days left that month'
    return null
  }

  const choose = async (c: Choice) => {
    setPending(c.key)
    try {
      await setStatus.mutateAsync({ date, status: c.status, note: note.trim() || null, portion: c.portion })
      toast.success(`Marked as ${c.label}`)
      setNote('')
    } catch (err) {
      toast.error(toUserMessage(err))
    } finally {
      setPending(null)
    }
  }

  const requestChoice = (c: Choice) => {
    if (compact) setConfirming(c)
    else void choose(c)
  }

  const loading = attendance.isPending || leaveBalance.isPending || wfhBalance.isPending

  if (loading) {
    return (
      <div className="flex gap-1.5">
        <Skeleton className={compact ? 'h-6 w-14' : 'h-10 w-24'} />
        <Skeleton className={compact ? 'h-6 w-14' : 'h-10 w-24'} />
        <Skeleton className={compact ? 'h-6 w-14' : 'h-10 w-24'} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className={cn('flex gap-1.5', compact ? 'flex-nowrap overflow-x-auto' : 'flex-wrap gap-2')}
        role="group"
        aria-label={`Set status for ${date}`}
      >
        {choices.map((c) => {
          const selected = isSelected(c)
          const blocked = selected ? null : blockedReason(c)
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => requestChoice(c)}
              disabled={Boolean(pending) || selected || Boolean(blocked)}
              title={blocked ?? undefined}
              aria-pressed={selected}
              className={cn(
                'inline-flex shrink-0 items-center rounded-lg border font-medium transition-colors',
                compact ? 'h-6 gap-1 px-2 text-[11px]' : 'h-10 gap-2 px-4 text-sm',
                selected
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700 ' +
                    'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-300',
                'disabled:cursor-not-allowed',
                !selected && 'disabled:opacity-50',
              )}
            >
              {pending === c.key ? (
                <Spinner />
              ) : (
                !compact && <span className={cn('h-2 w-2 rounded-full', ATTENDANCE_META[c.status].dot)} />
              )}
              {compact ? (c.shortLabel ?? c.label) : c.label}
            </button>
          )
        })}
      </div>
      <Input
        placeholder="Optional note (e.g. doctor's appointment)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        aria-label="Note"
      />
      {choices.some((c) => !isSelected(c) && blockedReason(c)) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Some options are unavailable because that month's balance is used up. An admin can add an adjustment.
        </p>
      )}
      <ConfirmDialog
        open={Boolean(confirming)}
        title="Update status?"
        message={
          confirming ? (
            <>
              Mark <span className="font-medium text-slate-900 dark:text-slate-100">{formatLongDate(date)}</span> as{' '}
              <span className="font-medium text-slate-900 dark:text-slate-100">{confirming.label}</span>?
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Confirm"
        tone="primary"
        loading={Boolean(pending)}
        onConfirm={() => {
          const c = confirming
          setConfirming(null)
          if (c) void choose(c)
        }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  )
}
