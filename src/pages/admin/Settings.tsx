import { useEffect, useState, type FormEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import SquishSwitch from '@/components/micro/SquishSwitch'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAddHoliday, useDeleteHoliday, useHolidays, useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'
import { settingsSchema, type SettingsValues } from '@/lib/validation'
import { toUserMessage } from '@/lib/errors'
import { formatShortDate, todayIso } from '@/utils/date'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input } from '@/components/ui/Form'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'
import FuseButton from '@/components/micro/FuseButton'

export default function Settings() {
  const toast = useToast()
  const { resolved } = useTheme()
  const switchColors =
    resolved === 'dark'
      ? { trackColor: '#334155', trackOnColor: '#6366f1', textColor: '#e2e8f0' }
      : { trackColor: '#e2e8f0', trackOnColor: '#4f46e5', textColor: '#334155' }
  const settings = useSettings()
  const updateSettings = useUpdateSettings()
  const holidays = useHolidays()
  const addHoliday = useAddHoliday()
  const deleteHoliday = useDeleteHoliday()

  const [newDate, setNewDate] = useState(todayIso())
  const [newName, setNewName] = useState('')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema) })

  useEffect(() => {
    if (settings.data) reset(settings.data)
  }, [settings.data, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateSettings.mutateAsync(values)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  })

  const submitHoliday = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await addHoliday.mutateAsync({ date: newDate, name: newName.trim() })
      setNewName('')
      toast.success('Holiday added')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const removeHoliday = async (id: string) => {
    try {
      await deleteHoliday.mutateAsync(id)
      toast.success('Holiday removed')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Defaults applied to every employee" />

      <Card title="Default allocations">
        {settings.isPending ? (
          <SkeletonRows rows={3} />
        ) : settings.error ? (
          <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Monthly Leave" htmlFor="default_monthly_leave" error={errors.default_monthly_leave?.message}>
                <Input id="default_monthly_leave" type="number" step="0.5" min="0" {...register('default_monthly_leave', { valueAsNumber: true })} />
              </Field>
              <Field label="Monthly WFH" htmlFor="default_monthly_wfh" error={errors.default_monthly_wfh?.message}>
                <Input id="default_monthly_wfh" type="number" step="0.5" min="0" {...register('default_monthly_wfh', { valueAsNumber: true })} />
              </Field>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
              <Controller
                name="allow_half_day_leave"
                control={control}
                render={({ field }) => (
                  <SquishSwitch label="Allow half-day leave" checked={field.value} onChange={field.onChange} width={52} height={28} {...switchColors} />
                )}
              />
              <Controller
                name="allow_half_day_wfh"
                control={control}
                render={({ field }) => (
                  <SquishSwitch label="Allow half-day WFH" checked={field.value} onChange={field.onChange} width={52} height={28} {...switchColors} />
                )}
              />
            </div>
            <FormError message={updateSettings.isError ? toUserMessage(updateSettings.error) : null} />
            <div className="flex justify-end">
              <Button type="submit" loading={updateSettings.isPending} disabled={!isDirty}>
                Save settings
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card title="Holidays">
        <form onSubmit={(e) => void submitHoliday(e)} className="mb-4 flex flex-wrap items-end gap-3">
          <Field label="Date" htmlFor="holiday-date">
            <Input id="holiday-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </Field>
          <Field label="Name" htmlFor="holiday-name" className="flex-1 min-w-[10rem]">
            <Input id="holiday-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Diwali" />
          </Field>
          <Button type="submit" loading={addHoliday.isPending}>
            Add
          </Button>
        </form>

        {holidays.isPending ? (
          <SkeletonRows rows={3} />
        ) : holidays.data?.length === 0 ? (
          <EmptyState title="No holidays added yet." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {holidays.data?.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {formatShortDate(h.date)} — {h.name}
                </span>
                <FuseButton
                  label="Delete"
                  undoLabel="Undo"
                  doneLabel="Deleted"
                  size="sm"
                  background={resolved === 'dark' ? '#1e293b' : '#f1f5f9'}
                  color={resolved === 'dark' ? '#f1f5f9' : '#0f172a'}
                  commitOn="fuseEnd"
                  undoWindow={4000}
                  onFuseEnd={() => void removeHoliday(h.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
