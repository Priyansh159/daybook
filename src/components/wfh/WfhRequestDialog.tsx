import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { wfhRequestSchema, type WfhRequestInput, type WfhRequestValues } from '@/lib/validation'
import { todayIso } from '@/utils/date'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input, Textarea } from '@/components/ui/Form'

type Props = { open: boolean; error?: string | null; onClose: () => void; onSubmit: (values: WfhRequestValues) => Promise<void> }

export function WfhRequestDialog({ open, error, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WfhRequestInput, unknown, WfhRequestValues>({
    resolver: zodResolver(wfhRequestSchema),
    defaultValues: { date: todayIso(), reason: '' },
  })

  useEffect(() => {
    if (open) reset({ date: todayIso(), reason: '' })
  }, [open, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title="Request WFH"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="wfh-request-form" loading={isSubmitting}>
            Submit
          </Button>
        </>
      }
    >
      <form id="wfh-request-form" onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Date" htmlFor="wfh-date" error={errors.date?.message} required>
          <Input id="wfh-date" type="date" aria-invalid={Boolean(errors.date)} {...register('date')} />
        </Field>
        <Field label="Reason" htmlFor="wfh-reason" error={errors.reason?.message} hint="Optional">
          <Textarea id="wfh-reason" {...register('reason')} />
        </Field>
      </form>
    </Dialog>
  )
}
