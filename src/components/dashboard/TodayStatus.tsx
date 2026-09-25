import { currentYearMonth, formatLongDate, todayIso } from '@/utils/date'
import { ATTENDANCE_META } from '@/utils/formatters'
import { useAttendance } from '@/hooks/useAttendance'
import { useLeaveRequests } from '@/hooks/useLeave'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DailyStatusPicker } from '@/components/dashboard/DailyStatusPicker'

export function TodayStatus({ employeeId }: { employeeId: string }) {
  const today = todayIso()
  const ym = currentYearMonth()

  const attendance = useAttendance({ employeeId, from: today, to: today })
  const leaves = useLeaveRequests({ employeeId, month: ym })
  const current = attendance.data?.[0]
  const todaysLeave = leaves.data?.find((l) => l.date === today && l.status !== 'CANCELLED')

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
      <DailyStatusPicker employeeId={employeeId} date={today} />
    </Card>
  )
}
