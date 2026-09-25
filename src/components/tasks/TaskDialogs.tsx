import { TaskFormDialog } from '@/components/tasks/TaskFormDialog'
import type { useTaskActions } from '@/components/tasks/useTaskActions'

export function TaskDialogs({ actions }: { actions: ReturnType<typeof useTaskActions> }) {
  return <TaskFormDialog open={actions.formOpen} task={actions.editing} onClose={actions.closeForm} onSubmit={actions.submitForm} />
}
