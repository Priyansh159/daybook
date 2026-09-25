import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import type { TaskValues } from '@/lib/validation'
import type { TaskStatus } from '@/types/database'
import { createTask, deleteTask, listTasks, updateTask } from '@/services/taskService'

export function useTasks(filter: { employeeId?: string } = {}) {
  return useQuery({ queryKey: qk.tasks(filter), queryFn: () => listTasks(filter) })
}

function useInvalidateTasks() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: ['tasks'] })
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: string; values: TaskValues }) => createTask(employeeId, values),
    onSuccess: invalidate,
  })
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TaskValues> & { status?: TaskStatus } }) => updateTask(id, values),
    onSuccess: invalidate,
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({ mutationFn: (id: string) => deleteTask(id), onSuccess: invalidate })
}
