import { useState } from 'react'
import { useCurrentEmployee } from '@/hooks/useAuth'
import { currentYearMonth } from '@/utils/date'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { PageHeader } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'

export default function Calendar() {
  const employee = useCurrentEmployee()
  const [month, setMonth] = useState(currentYearMonth())

  return (
    <div>
      <PageHeader title="Calendar" description="Your daily status for the month" />
      <Card>
        <MonthCalendar employeeId={employee.id} month={month} onMonthChange={setMonth} />
      </Card>
    </div>
  )
}
