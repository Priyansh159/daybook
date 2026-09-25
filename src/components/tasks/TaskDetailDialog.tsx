import type { TaskRow } from '@/types/database'
import { formatDateTime, formatShortDate } from '@/utils/date'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'

export function TaskDetailDialog({ task, onClose }: { task: TaskRow | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(task)} onClose={onClose} title={task?.title ?? ''} size="md">
      {task && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={TASK_STATUS_META[task.status].tone}>{TASK_STATUS_META[task.status].label}</Badge>
            <Badge tone={TASK_PRIORITY_META[task.priority].tone}>{TASK_PRIORITY_META[task.priority].label} priority</Badge>
            {task.project && <Badge tone="indigo">{task.project}</Badge>}
          </div>

          {task.description && (
            <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{task.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            {task.start_date && (
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">Start date</dt>
                <dd className="mt-0.5 text-slate-900 dark:text-slate-100">{formatShortDate(task.start_date)}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Due date</dt>
              <dd className="mt-0.5 text-slate-900 dark:text-slate-100">{task.due_date ? formatShortDate(task.due_date) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Created</dt>
              <dd className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDateTime(task.created_at)}</dd>
            </div>
            {task.completed_at && (
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">Completed</dt>
                <dd className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDateTime(task.completed_at)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </Dialog>
  )
}
