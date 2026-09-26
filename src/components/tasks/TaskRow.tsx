import { useState } from 'react'
import type { TaskRow as TaskRowData } from '@/types/database'
import { todayIso } from '@/utils/date'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { taskDateLabel } from '@/utils/tasks'
import { getChecklistProgress } from '@/utils/richText'
import { cn } from '@/utils/cn'
import { useTheme } from '@/hooks/useTheme'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog'
import SwipeRow, { type SwipeAction } from '@/components/micro/SwipeRow'

type Props = {
  task: TaskRowData
  ownerName?: string
  onComplete?: () => void
  onEdit: () => void
  onDelete: () => void
}

// A single row for the swipeable task list — swipe left to reveal Complete
// (if not already done) and Edit, full-swipe or tap Delete to remove it.
// The swipe gesture itself is the confirmation, so delete happens directly.
export function TaskRow({ task, ownerName, onComplete, onEdit, onDelete }: Props) {
  const [viewing, setViewing] = useState(false)
  const { resolved } = useTheme()
  const done = task.status === 'COMPLETED'
  const overdue = !done && task.due_date !== null && task.due_date < todayIso()
  const dark = resolved === 'dark'
  const progress = getChecklistProgress(task.description)

  const actions: SwipeAction[] = [
    { id: 'delete', label: 'Delete', dismiss: true },
    ...(onComplete && !done ? [{ id: 'complete', label: 'Done', color: '#16a34a' }] : []),
    { id: 'edit', label: 'Edit', color: dark ? '#334155' : '#64748b' },
  ]

  return (
    <>
      <SwipeRow
        actions={actions}
        label={task.title}
        rowColor={dark ? '#0f172a' : '#ffffff'}
        drawerColor={dark ? '#1e293b' : '#e2e8f0'}
        textColor={dark ? '#f1f5f9' : '#0f172a'}
        actionColor="#dc2626"
        height={progress ? 92 : 76}
        radius={12}
        onAction={(action) => {
          if (action.id === 'complete') onComplete?.()
          else if (action.id === 'edit') onEdit()
        }}
        onCommit={(action) => {
          if (action.id === 'delete') onDelete()
        }}
        className="border border-slate-200 dark:border-slate-800"
      >
        <button type="button" onClick={() => setViewing(true)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className={cn('truncate text-sm font-medium', done && 'text-slate-400 line-through dark:text-slate-500')}>{task.title}</span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Badge tone={TASK_STATUS_META[task.status].tone}>{TASK_STATUS_META[task.status].label}</Badge>
              {task.project && <Badge tone="indigo">{task.project}</Badge>}
              {taskDateLabel(task.start_date, task.due_date, done) && (
                <span className={cn(overdue && 'font-medium text-red-600 dark:text-red-400')}>
                  {taskDateLabel(task.start_date, task.due_date, done)}
                </span>
              )}
              {ownerName && <span>· {ownerName}</span>}
            </div>
            {progress && <ProgressBar value={progress.done} max={progress.total} className="w-full max-w-[200px]" />}
          </div>
          <Badge tone={TASK_PRIORITY_META[task.priority].tone} className="shrink-0">
            {TASK_PRIORITY_META[task.priority].label}
          </Badge>
        </button>
      </SwipeRow>
      <TaskDetailDialog task={viewing ? task : null} onClose={() => setViewing(false)} />
    </>
  )
}
