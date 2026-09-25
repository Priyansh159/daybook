import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TaskValues } from '@/lib/validation'
import type { TaskRow } from '@/types/database'
import { toUserMessage } from '@/lib/errors'
import { useToast } from '@/hooks/useToast'
import { useCreateTask, useDeleteTask, useUpdateTask } from '@/hooks/useTasks'

const UNDO_WINDOW_MS = 5000

// Dialog + mutation state shared by the dashboard task list and Tasks page.
export function useTaskActions(employeeId: string) {
  const toast = useToast()
  const qc = useQueryClient()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TaskRow | null>(null)
  const [deleting, setDeleting] = useState<TaskRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (task: TaskRow) => {
    setEditing(task)
    setFormOpen(true)
  }
  const closeForm = () => setFormOpen(false)

  const submitForm = async (values: TaskValues) => {
    try {
      if (editing) {
        await updateTask.mutateAsync({ id: editing.id, values })
        toast.success('Task updated')
      } else {
        await createTask.mutateAsync({ employeeId, values })
        toast.success('Task created')
      }
      setFormOpen(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const complete = async (task: TaskRow) => {
    setBusyId(task.id)
    try {
      await updateTask.mutateAsync({ id: task.id, values: { status: 'COMPLETED' } })
      toast.success('Task completed')
    } catch (err) {
      toast.error(toUserMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteTask.mutateAsync(deleting.id)
      toast.success('Task deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  // For gestures that are already their own confirmation (a full swipe),
  // skip the hold-to-delete dialog. The task disappears immediately, but the
  // actual delete is held for a few seconds so "Undo" in the toast can cancel it.
  const deleteDirect = (task: TaskRow) => {
    const previous = qc.getQueriesData<TaskRow[]>({ queryKey: ['tasks'] })
    qc.setQueriesData<TaskRow[]>({ queryKey: ['tasks'] }, (old) => old?.filter((t) => t.id !== task.id))

    const restore = () => previous.forEach(([key, data]) => qc.setQueryData(key, data))

    const timer = setTimeout(() => {
      pendingDeletes.current.delete(task.id)
      deleteTask.mutateAsync(task.id).catch((err: unknown) => {
        restore()
        toast.error(toUserMessage(err))
      })
    }, UNDO_WINDOW_MS)
    pendingDeletes.current.set(task.id, timer)

    toast.success(`"${task.title}" deleted`, {
      duration: UNDO_WINDOW_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          const pending = pendingDeletes.current.get(task.id)
          if (!pending) return
          clearTimeout(pending)
          pendingDeletes.current.delete(task.id)
          restore()
        },
      },
    })
  }

  return {
    formOpen,
    editing,
    deleting,
    busyId,
    deletePending: deleteTask.isPending,
    openCreate,
    openEdit,
    closeForm,
    submitForm,
    complete,
    askDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    confirmDelete,
    deleteDirect,
  }
}
