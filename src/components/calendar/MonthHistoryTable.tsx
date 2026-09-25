import type { DayEntry } from '@/hooks/useMonthData'
import { formatShortDate } from '@/utils/date'
import { ATTENDANCE_META, LEAVE_TYPE_LABEL } from '@/utils/formatters'
import { Badge } from '@/components/ui/Badge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/Feedback'

export function MonthHistoryTable({ days }: { days: DayEntry[] }) {
  const marked = days.filter((d) => d.status && !d.implied || d.attendance)
  if (marked.length === 0) {
    return <EmptyState title="No status recorded yet this month." />
  }

  return (
    <Table>
      <THead>
        <tr>
          <Th>Date</Th>
          <Th>Status</Th>
          <Th>Leave / WFH</Th>
          <Th>Note</Th>
        </tr>
      </THead>
      <TBody>
        {marked.map((day) => (
          <tr key={day.date}>
            <Td>{formatShortDate(day.date)}</Td>
            <Td>{day.status ? <Badge tone={ATTENDANCE_META[day.status].tone}>{ATTENDANCE_META[day.status].label}</Badge> : '—'}</Td>
            <Td>{day.leave ? LEAVE_TYPE_LABEL[day.leave.leave_type] : day.wfh ? '1 day' : '—'}</Td>
            <Td className="max-w-xs truncate">{day.attendance?.note || day.leave?.reason || day.wfh?.reason || '—'}</Td>
          </tr>
        ))}
      </TBody>
    </Table>
  )
}
