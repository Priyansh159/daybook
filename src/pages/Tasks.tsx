import { useMemo, useState } from 'react'
import { useCurrentEmployee } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import type { TaskPriority, TaskStatus } from '@/types/database'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { sortTasks, TASK_SORT_META, type TaskSortKey } from '@/utils/tasks'
import { TaskRow } from '@/components/tasks/TaskRow'
import { TaskDialogs } from '@/components/tasks/TaskDialogs'
import { useTaskActions } from '@/components/tasks/useTaskActions'
import { PageHeader } from '@/components/ui/Navigation'
import { Button } from '@/components/ui/Button'
import { ThemedSelect } from '@/components/ui/ThemedSelect'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

type StatusFilter = 'ALL' | TaskStatus
type PriorityFilter = 'ALL' | TaskPriority

export default function Tasks() {
  const employee = useCurrentEmployee()
  const tasks = useTasks({ employeeId: employee.id })
  const actions = useTaskActions(employee.id)
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [priority, setPriority] = useState<PriorityFilter>('ALL')
  const [sort, setSort] = useState<TaskSortKey>('due')

  const filtered = useMemo(() => {
    const rows = (tasks.data ?? []).filter((t) => (status === 'ALL' || t.status === status) && (priority === 'ALL' || t.priority === priority))
    return sortTasks(rows, sort)
  }, [tasks.data, status, priority, sort])

  return (
    <div>
      <PageHeader
        title="My Tasks"
        description="Everything you're working on — swipe a task left to complete, edit, or delete it"
        actions={<Button onClick={actions.openCreate}>+ Add Task</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <ThemedSelect
          className="w-full sm:w-40"
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[{ value: 'ALL', label: 'All statuses' }, ...Object.entries(TASK_STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))]}
          ariaLabel="Filter by status"
        />
        <ThemedSelect
          className="w-full sm:w-40"
          value={priority}
          onChange={(v) => setPriority(v as PriorityFilter)}
          options={[{ value: 'ALL', label: 'All priorities' }, ...Object.entries(TASK_PRIORITY_META).map(([value, meta]) => ({ value, label: meta.label }))]}
          ariaLabel="Filter by priority"
        />
        <ThemedSelect
          className="w-full sm:w-44"
          value={sort}
          onChange={(v) => setSort(v as TaskSortKey)}
          options={Object.entries(TASK_SORT_META).map(([value, label]) => ({ value, label: `Sort: ${label}` }))}
          ariaLabel="Sort tasks"
        />
      </div>

      {tasks.isPending ? (
        <SkeletonRows rows={5} />
      ) : tasks.error ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tasks.data?.length ? 'No tasks match these filters.' : 'No tasks yet. Create your first task.'}
          action={<Button onClick={actions.openCreate}>+ Add Task</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={task.status === 'COMPLETED' ? undefined : () => void actions.complete(task)}
              onEdit={() => actions.openEdit(task)}
              onDelete={() => actions.removeTask(task)}
            />
          ))}
        </div>
      )}

      <TaskDialogs actions={actions} />
    </div>
  )
}
