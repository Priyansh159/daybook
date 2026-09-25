import { useState } from 'react'
import { useCurrentEmployee } from '@/hooks/useAuth'
import { useMonthData } from '@/hooks/useMonthData'
import { currentYearMonth, monthLabel, shiftMonth } from '@/utils/date'
import { ATTENDANCE_META } from '@/utils/formatters'
import { MonthPicker, PageHeader } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/dashboard/StatCard'
import { MonthHistoryTable } from '@/components/calendar/MonthHistoryTable'
import { ErrorState, SkeletonRows } from '@/components/ui/Feedback'

export default function Attendance() {
  const employee = useCurrentEmployee()
  const [month, setMonth] = useState(currentYearMonth())
  const { days, summary, isLoading, error, refetch } = useMonthData(employee.id, month)
  const now = currentYearMonth()
  const disableNext = month.year > now.year || (month.year === now.year && month.month >= now.month)

  return (
    <div>
      <PageHeader
        title="My Attendance"
        description="Your monthly work status history"
        actions={<MonthPicker label={monthLabel(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} disableNext={disableNext} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label={ATTENDANCE_META.WORKING.label} value={summary.WORKING} loading={isLoading} accent="green" />
        <StatCard label={ATTENDANCE_META.WFH.label} value={summary.WFH} loading={isLoading} accent="blue" />
        <StatCard label={ATTENDANCE_META.LEAVE.label} value={summary.LEAVE} loading={isLoading} accent="amber" />
        <StatCard label={ATTENDANCE_META.WEEK_OFF.label} value={summary.WEEK_OFF} loading={isLoading} />
        <StatCard label={ATTENDANCE_META.HOLIDAY.label} value={summary.HOLIDAY} loading={isLoading} accent="purple" />
      </div>

      <Card title={monthLabel(month)} bodyClassName="p-0">
        {isLoading ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorState error={error} onRetry={refetch} />
          </div>
        ) : (
          <MonthHistoryTable days={days} />
        )}
      </Card>
    </div>
  )
}
