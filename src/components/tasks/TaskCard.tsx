import { useState } from 'react'
import type { TaskRow } from '@/types/database'
import { todayIso } from '@/utils/date'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { taskDateLabel } from '@/utils/tasks'
import { getChecklistProgress, richTextToPlainText } from '@/utils/richText'
import { cn } from '@/utils/cn'
import { useTheme } from '@/hooks/useTheme'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog'
import SpringCheck from '@/components/micro/SpringCheck'

type Props = {
  task: TaskRow
  ownerName?: string
  busy?: boolean
  onComplete?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function TaskCard({ task, ownerName, busy, onComplete, onEdit, onDelete }: Props) {
  const [viewing, setViewing] = useState(false)
  const { resolved } = useTheme()
  const done = task.status === 'COMPLETED'
  const overdue = !done && task.due_date !== null && task.due_date < todayIso()
  const dark = resolved === 'dark'
  const progress = getChecklistProgress(task.description)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        {onComplete ? (
          <SpringCheck
            label={task.title}
            checked={done}
            onChange={(next) => next && onComplete()}
            disabled={done || busy}
            color={dark ? '#f1f5f9' : '#0f172a'}
            fillColor="#4f46e5"
            checkColor="#ffffff"
            boxSize={20}
            fontSize={14}
          />
        ) : (
          <span className={cn('text-sm font-semibold text-slate-900 dark:text-slate-100', done && 'text-slate-500 line-through dark:text-slate-500')}>
            {task.title}
          </span>
        )}
        <Badge tone={TASK_PRIORITY_META[task.priority].tone}>{TASK_PRIORITY_META[task.priority].label}</Badge>
      </div>
      <button type="button" onClick={() => setViewing(true)} className="mt-1 block w-full text-left" aria-haspopup="dialog">
        {task.description && (
          <p className="line-clamp-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
            {richTextToPlainText(task.description)}
          </p>
        )}
        <span className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">View details</span>
      </button>
      {progress && (
        <ProgressBar value={progress.done} max={progress.total} label={`${progress.done}/${progress.total} subtasks`} className="mt-2" />
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Badge tone={TASK_STATUS_META[task.status].tone}>{TASK_STATUS_META[task.status].label}</Badge>
        {task.project && <Badge tone="indigo">{task.project}</Badge>}
        {taskDateLabel(task.start_date, task.due_date, done) && (
          <span className={cn(overdue && 'font-medium text-red-600 dark:text-red-400')}>{taskDateLabel(task.start_date, task.due_date, done)}</span>
        )}
        {ownerName && <span>· {ownerName}</span>}
      </div>
      {(onEdit || onDelete) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={onEdit} disabled={busy}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
              onClick={onDelete}
              disabled={busy}
            >
              Delete
            </Button>
          )}
        </div>
      )}
      <TaskDetailDialog task={viewing ? task : null} onClose={() => setViewing(false)} />
    </article>
  )
}
