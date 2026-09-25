import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leaveRequestSchema, type LeaveRequestInput, type LeaveRequestValues } from '@/lib/validation'
import { todayIso } from '@/utils/date'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input, Textarea } from '@/components/ui/Form'
import RubberSegment from '@/components/micro/RubberSegment'

type Props = { open: boolean; error?: string | null; onClose: () => void; onSubmit: (values: LeaveRequestValues) => Promise<void> }

const LEAVE_TYPE_ITEMS = [
  { value: 'FULL', label: 'Full Day' },
  { value: 'HALF', label: 'Half Day' },
]

export function LeaveRequestDialog({ open, error, onClose, onSubmit }: Props) {
  const settings = useSettings()
  const { resolved } = useTheme()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestInput, unknown, LeaveRequestValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { date: todayIso(), leaveType: 'FULL', reason: '' },
  })

  useEffect(() => {
    if (open) reset({ date: todayIso(), leaveType: 'FULL', reason: '' })
  }, [open, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title="Request leave"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="leave-request-form" loading={isSubmitting}>
            Submit
          </Button>
        </>
      }
    >
      <form id="leave-request-form" onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Date" htmlFor="leave-date" error={errors.date?.message} required>
          <Input id="leave-date" type="date" aria-invalid={Boolean(errors.date)} {...register('date')} />
        </Field>
        {settings.data?.allow_half_day_leave && (
          <Field label="Type" htmlFor="leave-type">
            <Controller
              name="leaveType"
              control={control}
              render={({ field }) => (
                <RubberSegment
                  aria-label="Leave duration"
                  items={LEAVE_TYPE_ITEMS}
                  value={field.value}
                  onChange={field.onChange}
                  trackColor={resolved === 'dark' ? '#1e293b' : '#e2e8f0'}
                  thumbColor={resolved === 'dark' ? '#4f46e5' : '#ffffff'}
                  textColor={resolved === 'dark' ? '#94a3b8' : '#475569'}
                  activeTextColor={resolved === 'dark' ? '#ffffff' : '#1e1b4b'}
                />
              )}
            />
          </Field>
        )}
        <Field label="Reason" htmlFor="leave-reason" error={errors.reason?.message} hint="Optional">
          <Textarea id="leave-reason" {...register('reason')} />
        </Field>
      </form>
    </Dialog>
  )
}
