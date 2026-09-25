import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { employeeUpdateSchema, type EmployeeUpdateInput, type EmployeeUpdateValues } from '@/lib/validation'
import type { EmployeeRow } from '@/types/database'
import { EMPLOYEE_STATUS_META, ROLE_META } from '@/utils/formatters'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input, Select } from '@/components/ui/Form'

type Props = { open: boolean; employee: EmployeeRow; error?: string | null; onClose: () => void; onSubmit: (values: EmployeeUpdateValues) => Promise<void> }

export function EmployeeEditDialog({ open, employee, error, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeUpdateInput, unknown, EmployeeUpdateValues>({ resolver: zodResolver(employeeUpdateSchema) })

  useEffect(() => {
    if (!open) return
    reset({
      full_name: employee.full_name,
      phone: employee.phone ?? '',
      department: employee.department ?? '',
      designation: employee.designation ?? '',
      joining_date: employee.joining_date,
      role: employee.role,
      status: employee.status,
    })
  }, [open, employee, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title={`Edit ${employee.full_name}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="employee-edit-form" loading={isSubmitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="employee-edit-form" onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" htmlFor="edit-full_name" error={errors.full_name?.message} required>
            <Input id="edit-full_name" {...register('full_name')} />
          </Field>
          <Field label="Phone" htmlFor="edit-phone" error={errors.phone?.message}>
            <Input id="edit-phone" type="tel" {...register('phone')} />
          </Field>
          <Field label="Department" htmlFor="edit-department" error={errors.department?.message}>
            <Input id="edit-department" {...register('department')} />
          </Field>
          <Field label="Designation" htmlFor="edit-designation" error={errors.designation?.message}>
            <Input id="edit-designation" {...register('designation')} />
          </Field>
          <Field label="Joining Date" htmlFor="edit-joining_date" error={errors.joining_date?.message} required>
            <Input id="edit-joining_date" type="date" {...register('joining_date')} />
          </Field>
          <Field label="Role" htmlFor="edit-role">
            <Select id="edit-role" {...register('role')}>
              {Object.entries(ROLE_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="edit-status">
            <Select id="edit-status" {...register('status')}>
              {Object.entries(EMPLOYEE_STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Dialog>
  )
}
