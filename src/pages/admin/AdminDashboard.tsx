import { useMemo } from 'react'
import { useAdminOverview } from '@/hooks/useAdminOverview'
import { formatLongDate, todayIso } from '@/utils/date'
import { PageHeader } from '@/components/ui/Navigation'
import { StatCard } from '@/components/dashboard/StatCard'
import { ErrorState } from '@/components/ui/Feedback'

export default function AdminDashboard() {
  const overview = useAdminOverview()

  const activeEmployees = useMemo(() => (overview.employees.data ?? []).filter((e) => e.status === 'ACTIVE').length, [overview.employees.data])
  const totalEmployees = overview.employees.data?.length ?? 0

  if (overview.error) return <ErrorState error={overview.error} />

  return (
    <div>
      <PageHeader title="Admin Dashboard" description={formatLongDate(todayIso())} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Employees" value={totalEmployees} loading={overview.isLoading} />
        <StatCard label="Active Employees" value={activeEmployees} loading={overview.isLoading} accent="green" />
        <StatCard label="Working Today" value={overview.todayCounts.working} loading={overview.isLoading} accent="green" />
        <StatCard label="WFH Today" value={overview.todayCounts.wfh} loading={overview.isLoading} accent="blue" />
        <StatCard label="On Leave Today" value={overview.todayCounts.leave} loading={overview.isLoading} accent="amber" />
        <StatCard label="Pending Leave Requests" value={overview.pendingLeaves.data?.length ?? 0} loading={overview.isLoading} accent="amber" />
        <StatCard label="Tasks In Progress" value={overview.taskCounts.inProgress} loading={overview.isLoading} accent="blue" />
        <StatCard label="Tasks Completed" value={overview.taskCounts.completed} loading={overview.isLoading} accent="green" />
      </div>
    </div>
  )
}
