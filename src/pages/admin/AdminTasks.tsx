import { useMemo, useState } from 'react'
import { useEmployeeMap } from '@/hooks/useEmployee'
import { useTasks } from '@/hooks/useTasks'
import type { TaskPriority, TaskStatus } from '@/types/database'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { TaskCard } from '@/components/tasks/TaskCard'
import { PageHeader } from '@/components/ui/Navigation'
import { ThemedSelect } from '@/components/ui/ThemedSelect'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

export default function AdminTasks() {
  const employees = useEmployeeMap()
  const tasks = useTasks()
  const [employeeId, setEmployeeId] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | TaskStatus>('ALL')
  const [priority, setPriority] = useState<'ALL' | TaskPriority>('ALL')

  const filtered = useMemo(() => {
    return (tasks.data ?? []).filter(
      (t) => (employeeId === 'ALL' || t.employee_id === employeeId) && (status === 'ALL' || t.status === status) && (priority === 'ALL' || t.priority === priority),
    )
  }, [tasks.data, employeeId, status, priority])

  const loading = tasks.isPending || employees.isPending

  return (
    <div>
      <PageHeader title="Tasks" description="Every employee's tasks, read-only" />

      <div className="mb-4 flex flex-wrap gap-3">
        <ThemedSelect
          className="w-full sm:w-48"
          value={employeeId}
          onChange={setEmployeeId}
          options={[{ value: 'ALL', label: 'All employees' }, ...(employees.data ?? []).map((e) => ({ value: e.id, label: e.full_name }))]}
          ariaLabel="Filter by employee"
        />
        <ThemedSelect
          className="w-full sm:w-40"
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={[{ value: 'ALL', label: 'All statuses' }, ...Object.entries(TASK_STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))]}
          ariaLabel="Filter by status"
        />
        <ThemedSelect
          className="w-full sm:w-40"
          value={priority}
          onChange={(v) => setPriority(v as typeof priority)}
          options={[{ value: 'ALL', label: 'All priorities' }, ...Object.entries(TASK_PRIORITY_META).map(([value, meta]) => ({ value, label: meta.label }))]}
          ariaLabel="Filter by priority"
        />
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : tasks.error ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No tasks match these filters." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} ownerName={employees.map.get(task.employee_id)?.full_name} />
          ))}
        </div>
      )}
    </div>
  )
}
