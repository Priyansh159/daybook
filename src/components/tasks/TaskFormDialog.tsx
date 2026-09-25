import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, type TaskInput, type TaskValues } from '@/lib/validation'
import type { TaskRow } from '@/types/database'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'

type Props = {
  open: boolean
  task: TaskRow | null
  onClose: () => void
  onSubmit: (values: TaskValues) => Promise<void>
}

const emptyValues: TaskInput = {
  title: '',
  description: '',
  project: '',
  priority: 'MEDIUM',
  status: 'TODO',
  start_date: '',
  due_date: '',
}

export function TaskFormDialog({ open, task, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput, unknown, TaskValues>({ resolver: zodResolver(taskSchema), defaultValues: emptyValues })

  useEffect(() => {
    if (!open) return
    reset(
      task
        ? {
            title: task.title,
            description: task.description ?? '',
            project: task.project ?? '',
            priority: task.priority,
            status: task.status,
            start_date: task.start_date ?? '',
            due_date: task.due_date ?? '',
          }
        : emptyValues,
    )
  }, [open, task, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title={task ? 'Edit task' : 'New task'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={isSubmitting}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Title" htmlFor="task-title" error={errors.title?.message} required>
          <Input id="task-title" aria-invalid={Boolean(errors.title)} {...register('title')} />
        </Field>
        <Field label="Project" htmlFor="task-project" error={errors.project?.message} hint="Optional — tag this task with a project or topic">
          <Input id="task-project" placeholder="e.g. Smriti 3.0" aria-invalid={Boolean(errors.project)} {...register('project')} />
        </Field>
        <Field label="Description" htmlFor="task-description" error={errors.description?.message}>
          <Textarea id="task-description" rows={7} className="resize-y" {...register('description')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority" htmlFor="task-priority">
            <Select id="task-priority" {...register('priority')}>
              {Object.entries(TASK_PRIORITY_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="task-status">
            <Select id="task-status" {...register('status')}>
              {Object.entries(TASK_STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="task-start" error={errors.start_date?.message} hint="Optional — for tasks spanning a range">
            <Input id="task-start" type="date" aria-invalid={Boolean(errors.start_date)} {...register('start_date')} />
          </Field>
          <Field label="Due date" htmlFor="task-due" error={errors.due_date?.message}>
            <Input id="task-due" type="date" {...register('due_date')} />
          </Field>
        </div>
      </form>
    </Dialog>
  )
}
