import { useTheme } from '@/hooks/useTheme'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog'
import HoldButton from '@/components/micro/HoldButton'
import type { useTaskActions } from '@/components/tasks/useTaskActions'

export function TaskDialogs({ actions }: { actions: ReturnType<typeof useTaskActions> }) {
  const { resolved } = useTheme()

  return (
    <>
      <TaskFormDialog open={actions.formOpen} task={actions.editing} onClose={actions.closeForm} onSubmit={actions.submitForm} />
      <Dialog open={Boolean(actions.deleting)} onClose={actions.deletePending ? () => undefined : actions.cancelDelete} title="Delete task?" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-900 dark:text-slate-100">{actions.deleting?.title}</span> will be permanently deleted. Hold the
          button below to confirm.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={actions.cancelDelete} disabled={actions.deletePending}>
            Cancel
          </Button>
          <HoldButton
            backgroundColor={resolved === 'dark' ? '#1e293b' : '#f1f5f9'}
            textColor={resolved === 'dark' ? '#f1f5f9' : '#0f172a'}
            fillColor="#dc2626"
            holdTime={1200}
            disabled={actions.deletePending}
            onHold={() => void actions.confirmDelete()}
          >
            Hold to delete
          </HoldButton>
        </div>
      </Dialog>
    </>
  )
}
