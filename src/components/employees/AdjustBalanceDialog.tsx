import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adjustmentSchema, type AdjustmentValues } from '@/lib/validation'
import type { BalanceKind } from '@/types/database'
import { monthLabel } from '@/utils/date'
import type { YearMonth } from '@/utils/date'
import { useTheme } from '@/hooks/useTheme'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Textarea } from '@/components/ui/Form'
import CometDial from '@/components/micro/CometDial'

type Props = {
  open: boolean
  kind: BalanceKind
  ym: YearMonth
  error?: string | null
  onClose: () => void
  onSubmit: (values: AdjustmentValues) => Promise<void>
}

export function AdjustBalanceDialog({ open, kind, ym, error, onClose, onSubmit }: Props) {
  const { resolved } = useTheme()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentValues>({ resolver: zodResolver(adjustmentSchema), defaultValues: { amount: 0, reason: '' } })

  useEffect(() => {
    if (open) reset({ amount: 0, reason: '' })
  }, [open, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title={`Adjust ${kind === 'LEAVE' ? 'leave' : 'WFH'} balance`}
      description={monthLabel(ym)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="adjust-balance-form" loading={isSubmitting}>
            Apply adjustment
          </Button>
        </>
      }
    >
      <form id="adjust-balance-form" onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Amount" htmlFor="adjust-amount" error={errors.amount?.message} required hint="Drag the dial or focus it and use arrow keys — negative to deduct">
          <div className="flex justify-center py-2">
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CometDial
                  value={field.value}
                  onChange={field.onChange}
                  min={-10}
                  max={10}
                  step={0.5}
                  unit=" days"
                  label="Adjustment amount"
                  size={160}
                  accent="#4f46e5"
                  ink={resolved === 'dark' ? '#f1f5f9' : '#0f172a'}
                />
              )}
            />
          </div>
        </Field>
        <Field label="Reason" htmlFor="adjust-reason" error={errors.reason?.message} required>
          <Textarea id="adjust-reason" {...register('reason')} />
        </Field>
      </form>
    </Dialog>
  )
}
