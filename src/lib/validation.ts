import { z } from 'zod'
import { isRichTextEmpty, sanitizeTaskHtml } from '@/utils/richText'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((v) => (v === '' ? null : v))
    .nullable()

const phone = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\+?[0-9\s-]{7,15}$/.test(v), 'Enter a valid phone number')
  .transform((v) => (v === '' ? null : v))
  .nullable()

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const employeeCreateSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
  employeeCode: z.string().trim().min(1, 'Employee ID is required').max(32),
  designation: optionalText(80),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_NOTICE']),
  initialLeaveBalance: z.number({ message: 'Enter a number' }).min(0).max(31),
  initialWfhBalance: z.number({ message: 'Enter a number' }).min(0).max(31),
})
export type EmployeeCreateInput = z.input<typeof employeeCreateSchema>
export type EmployeeCreateValues = z.output<typeof employeeCreateSchema>

export const employeeUpdateSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(120),
  phone,
  department: optionalText(80),
  designation: optionalText(80),
  joining_date: isoDate,
  role: z.enum(['ADMIN', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_NOTICE']),
})
export type EmployeeUpdateInput = z.input<typeof employeeUpdateSchema>
export type EmployeeUpdateValues = z.output<typeof employeeUpdateSchema>

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(120),
  phone,
  avatar_url: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https:\/\//.test(v), 'Use an https:// image URL')
    .transform((v) => (v === '' ? null : v))
    .nullable(),
})
export type ProfileInput = z.input<typeof profileSchema>
export type ProfileValues = z.output<typeof profileSchema>

const optionalIsoDate = z
  .string()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Enter a valid date')
  .transform((v) => (v === '' ? null : v))
  .nullable()

// Description is rich text (HTML from the task editor), so it isn't trimmed
// like plain text — whitespace inside formatting is meaningful — and the
// length cap is generous to leave room for markup overhead.
const richTextDescription = z
  .string()
  .max(20000, 'Description is too long')
  .transform((v) => (isRichTextEmpty(v) ? null : sanitizeTaskHtml(v)))
  .nullable()

export const taskSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: richTextDescription,
    project: optionalText(120),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']),
    start_date: optionalIsoDate,
    due_date: optionalIsoDate,
  })
  .refine((v) => !v.start_date || !v.due_date || v.start_date <= v.due_date, {
    message: 'Start date must be on or before the due date',
    path: ['start_date'],
  })
export type TaskInput = z.input<typeof taskSchema>
export type TaskValues = z.output<typeof taskSchema>

export const adjustmentSchema = z.object({
  amount: z
    .number({ message: 'Enter a number' })
    .refine((v) => v !== 0, 'Amount cannot be zero')
    .refine((v) => Number.isInteger(v * 2), 'Use steps of 0.5')
    .refine((v) => Math.abs(v) <= 31, 'Amount is too large'),
  reason: z.string().trim().min(3, 'Give a short reason').max(500),
})
export type AdjustmentValues = z.infer<typeof adjustmentSchema>

export const leaveRequestSchema = z.object({
  date: isoDate,
  leaveType: z.enum(['FULL', 'HALF']),
  reason: optionalText(500),
})
export type LeaveRequestInput = z.input<typeof leaveRequestSchema>
export type LeaveRequestValues = z.output<typeof leaveRequestSchema>

export const wfhRequestSchema = z.object({
  date: isoDate,
  reason: optionalText(500),
})
export type WfhRequestInput = z.input<typeof wfhRequestSchema>
export type WfhRequestValues = z.output<typeof wfhRequestSchema>

export const settingsSchema = z.object({
  default_monthly_leave: z.number({ message: 'Enter a number' }).min(0).max(31),
  default_monthly_wfh: z.number({ message: 'Enter a number' }).min(0).max(31),
  allow_half_day_leave: z.boolean(),
  allow_half_day_wfh: z.boolean(),
})
export type SettingsValues = z.infer<typeof settingsSchema>
