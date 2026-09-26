import { useState } from 'react'
import type { TaskRow } from '@/types/database'
import { formatShortDate } from '@/utils/date'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { getChecklistProgress } from '@/utils/richText'
import { toUserMessage } from '@/lib/errors'
import { useToast } from '@/hooks/useToast'
import { useUpdateTask } from '@/hooks/useTasks'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { RichTextView } from '@/components/tasks/RichText'

export function TaskDetailDialog({ task, onClose }: { task: TaskRow | null; onClose: () => void }) {
  const toast = useToast()
  const updateTask = useUpdateTask()
  // Shows the just-toggled checklist state immediately instead of waiting on
  // the refetch that follows the mutation; cleared once a different task is viewed.
  const [pendingDescription, setPendingDescription] = useState<string | null>(null)
  const [lastTaskId, setLastTaskId] = useState(task?.id ?? null)
  if ((task?.id ?? null) !== lastTaskId) {
    setLastTaskId(task?.id ?? null)
    setPendingDescription(null)
  }

  const handleToggleItem = (id: string, nextHtml: string) => {
    setPendingDescription(nextHtml)
    updateTask.mutate(
      { id, values: { description: nextHtml } },
      {
        onError: (err) => {
          setPendingDescription(null)
          toast.error(toUserMessage(err))
        },
      },
    )
  }

  const currentDescription = pendingDescription ?? task?.description ?? null
  const progress = getChecklistProgress(currentDescription)

  return (
    <Dialog open={Boolean(task)} onClose={onClose} title={task?.title ?? ''} size="md">
      {task && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={TASK_STATUS_META[task.status].tone}>{TASK_STATUS_META[task.status].label}</Badge>
            <Badge tone={TASK_PRIORITY_META[task.priority].tone}>{TASK_PRIORITY_META[task.priority].label} priority</Badge>
            {task.project && <Badge tone="indigo">{task.project}</Badge>}
          </div>

          {progress && <ProgressBar value={progress.done} max={progress.total} label={`${progress.done}/${progress.total} subtasks`} />}

          {currentDescription && (
            <RichTextView html={currentDescription} onToggleItem={(nextHtml) => handleToggleItem(task.id, nextHtml)} />
          )}

          {(task.start_date || task.due_date) && (
            <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              {task.start_date && (
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Start date</dt>
                  <dd className="mt-0.5 text-slate-900 dark:text-slate-100">{formatShortDate(task.start_date)}</dd>
                </div>
              )}
              {task.due_date && (
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Due date</dt>
                  <dd className="mt-0.5 text-slate-900 dark:text-slate-100">{formatShortDate(task.due_date)}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
    </Dialog>
  )
}
