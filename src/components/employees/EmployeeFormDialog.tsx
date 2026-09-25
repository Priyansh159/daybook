import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { employeeCreateSchema, type EmployeeCreateInput, type EmployeeCreateValues } from '@/lib/validation'
import { EMPLOYEE_STATUS_META, ROLE_META } from '@/utils/formatters'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input, Select } from '@/components/ui/Form'

type Props = { open: boolean; error?: string | null; onClose: () => void; onSubmit: (values: EmployeeCreateValues) => Promise<void> }

const defaults: EmployeeCreateInput = {
  fullName: '',
  email: '',
  password: '',
  employeeCode: '',
  designation: '',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
  initialLeaveBalance: 2.5,
  initialWfhBalance: 4,
}

export function EmployeeFormDialog({ open, error, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeCreateInput, unknown, EmployeeCreateValues>({ resolver: zodResolver(employeeCreateSchema), defaultValues: defaults })

  useEffect(() => {
    if (open) reset(defaults)
  }, [open, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title="Add Employee"
      description="Creates their login and profile in one step. Phone, department, and joining date can be filled in later from Edit."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" loading={isSubmitting}>
            Create employee
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" htmlFor="fullName" error={errors.fullName?.message} required>
            <Input id="fullName" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} />
          </Field>
          <Field label="Employee ID" htmlFor="employeeCode" error={errors.employeeCode?.message} required>
            <Input id="employeeCode" aria-invalid={Boolean(errors.employeeCode)} {...register('employeeCode')} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
          </Field>
          <Field label="Temporary Password" htmlFor="password" error={errors.password?.message} required hint="At least 8 characters">
            <Input id="password" type="text" autoComplete="off" aria-invalid={Boolean(errors.password)} {...register('password')} />
          </Field>
          <Field label="Designation" htmlFor="designation" error={errors.designation?.message}>
            <Input id="designation" {...register('designation')} />
          </Field>
          <Field label="Role" htmlFor="role">
            <Select id="role" {...register('role')}>
              {Object.entries(ROLE_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" {...register('status')}>
              {Object.entries(EMPLOYEE_STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Initial Leave Balance" htmlFor="initialLeaveBalance" error={errors.initialLeaveBalance?.message}>
              <Input id="initialLeaveBalance" type="number" step="0.5" min="0" {...register('initialLeaveBalance', { valueAsNumber: true })} />
            </Field>
            <Field label="Initial WFH Balance" htmlFor="initialWfhBalance" error={errors.initialWfhBalance?.message}>
              <Input id="initialWfhBalance" type="number" step="0.5" min="0" {...register('initialWfhBalance', { valueAsNumber: true })} />
            </Field>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
