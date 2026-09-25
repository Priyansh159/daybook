import { useState } from 'react'
import type { AttendanceStatus, LeaveType } from '@/types/database'
import { currentYearMonth, formatLongDate, todayIso } from '@/utils/date'
import { canConsume, statusChangeDelta } from '@/utils/balance'
import { ATTENDANCE_META } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { toUserMessage } from '@/lib/errors'
import { useToast } from '@/hooks/useToast'
import { useAttendance, useSetDailyStatus } from '@/hooks/useAttendance'
import { useBalance } from '@/hooks/useBalances'
import { useLeaveRequests } from '@/hooks/useLeave'
import { useSettings } from '@/hooks/useSettings'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Form'
import { Skeleton } from '@/components/ui/Feedback'
import { Spinner } from '@/components/ui/Spinner'

type Choice = { key: string; status: AttendanceStatus; portion: LeaveType; label: string }

export function TodayStatus({ employeeId }: { employeeId: string }) {
  const today = todayIso()
  const ym = currentYearMonth()
  const toast = useToast()
  const [note, setNote] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  const attendance = useAttendance({ employeeId, from: today, to: today })
  const leaveBalance = useBalance('LEAVE', employeeId, ym)
  const wfhBalance = useBalance('WFH', employeeId, ym)
  const leaves = useLeaveRequests({ employeeId, month: ym })
  const settings = useSettings()
  const setStatus = useSetDailyStatus()

  const current = attendance.data?.[0]
  const todaysLeave = leaves.data?.find((l) => l.date === today && l.status !== 'CANCELLED')
  const currentState = current
    ? { status: current.status, leaveType: current.status === 'LEAVE' ? todaysLeave?.leave_type : undefined }
    : null

  const choices: Choice[] = [
    { key: 'WORKING', status: 'WORKING', portion: 'FULL', label: 'Working' },
    { key: 'WFH', status: 'WFH', portion: 'FULL', label: 'WFH' },
    { key: 'LEAVE', status: 'LEAVE', portion: 'FULL', label: 'Leave' },
  ]
  if (settings.data?.allow_half_day_leave) {
    choices.push({ key: 'LEAVE_HALF', status: 'LEAVE', portion: 'HALF', label: 'Half-day Leave' })
  }

  const isSelected = (c: Choice) =>
    current?.status === c.status && (c.status !== 'LEAVE' || (todaysLeave?.leave_type ?? 'FULL') === c.portion)

  // UI pre-check only; set_daily_status re-validates in the database.
  const blockedReason = (c: Choice): string | null => {
    const delta = statusChangeDelta(currentState, { status: c.status, leaveType: c.portion })
    if (delta.leave > 0 && leaveBalance.data && !canConsume(leaveBalance.data, delta.leave)) return 'No leave balance left this month'
    if (delta.wfh > 0 && wfhBalance.data && !canConsume(wfhBalance.data, delta.wfh)) return 'No WFH days left this month'
    return null
  }

  const choose = async (c: Choice) => {
    setPending(c.key)
    try {
      await setStatus.mutateAsync({ date: today, status: c.status, note: note.trim() || null, portion: c.portion })
      toast.success(`Today marked as ${c.label}`)
      setNote('')
    } catch (err) {
      toast.error(toUserMessage(err))
    } finally {
      setPending(null)
    }
  }

  const loading = attendance.isPending || leaveBalance.isPending || wfhBalance.isPending

  return (
    <Card
      title="Today's Status"
      description={formatLongDate(today)}
      actions={
        current ? (
          <Badge tone={ATTENDANCE_META[current.status].tone}>
            {ATTENDANCE_META[current.status].label}
            {current.status === 'LEAVE' && todaysLeave?.leave_type === 'HALF' ? ' (Half)' : ''}
          </Badge>
        ) : (
          <Badge tone="gray">Not marked</Badge>
        )
      }
    >
      {loading ? (
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Set today's status">
            {choices.map((c) => {
              const selected = isSelected(c)
              const blocked = selected ? null : blockedReason(c)
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => void choose(c)}
                  disabled={Boolean(pending) || selected || Boolean(blocked)}
                  title={blocked ?? undefined}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors',
                    selected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700 ' +
                        'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-300',
                    'disabled:cursor-not-allowed',
                    !selected && 'disabled:opacity-50',
                  )}
                >
                  {pending === c.key ? <Spinner /> : <span className={cn('h-2 w-2 rounded-full', ATTENDANCE_META[c.status].dot)} />}
                  {c.label}
                </button>
              )
            })}
          </div>
          <Input
            placeholder="Optional note for today (e.g. doctor's appointment)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            aria-label="Note for today"
          />
          {choices.some((c) => !isSelected(c) && blockedReason(c)) && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Some options are unavailable because this month's balance is used up. An admin can add an adjustment.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
