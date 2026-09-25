import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCurrentEmployee } from '@/hooks/useAuth'
import { useUpdateMyProfile } from '@/hooks/useEmployee'
import { useToast } from '@/hooks/useToast'
import { toUserMessage } from '@/lib/errors'
import { profileSchema, type ProfileInput, type ProfileValues } from '@/lib/validation'
import { EMPLOYEE_STATUS_META, ROLE_META, initials } from '@/utils/formatters'
import { formatShortDate } from '@/utils/date'
import { PageHeader } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input } from '@/components/ui/Form'

export default function Profile() {
  const employee = useCurrentEmployee()
  const toast = useToast()
  const updateProfile = useUpdateMyProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: employee.full_name,
      phone: employee.phone ?? '',
      avatar_url: employee.avatar_url ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await updateProfile.mutateAsync({ id: employee.id, values })
      reset({ full_name: updated.full_name, phone: updated.phone ?? '', avatar_url: updated.avatar_url ?? '' })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  })

  return (
    <div>
      <PageHeader title="Profile" description="Your account details" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            {employee.avatar_url ? (
              <img src={employee.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                {initials(employee.full_name)}
              </div>
            )}
            <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{employee.full_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{employee.email}</p>
            <div className="mt-3 flex gap-2">
              <Badge tone={ROLE_META[employee.role].tone}>{ROLE_META[employee.role].label}</Badge>
              <Badge tone={EMPLOYEE_STATUS_META[employee.status].tone}>{EMPLOYEE_STATUS_META[employee.status].label}</Badge>
            </div>
          </div>
          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Employee ID</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{employee.employee_code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Department</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{employee.department ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Designation</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{employee.designation ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Joined</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{formatShortDate(employee.joining_date)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Edit profile" description="Only these fields can be changed here" className="lg:col-span-2">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message} required>
              <Input id="full_name" aria-invalid={Boolean(errors.full_name)} {...register('full_name')} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" type="tel" {...register('phone')} />
            </Field>
            <Field label="Avatar URL" htmlFor="avatar_url" error={errors.avatar_url?.message} hint="A public https:// image link">
              <Input id="avatar_url" type="url" {...register('avatar_url')} />
            </Field>
            <FormError message={updateProfile.isError ? toUserMessage(updateProfile.error) : null} />
            <div className="flex justify-end">
              <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
