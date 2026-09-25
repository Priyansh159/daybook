import type {
  AttendanceStatus,
  EmployeeStatus,
  LeaveType,
  RequestStatus,
  Role,
  TaskPriority,
  TaskStatus,
} from '@/types/database'

export type Tone = 'gray' | 'blue' | 'indigo' | 'green' | 'amber' | 'red' | 'purple'

type Meta = { label: string; tone: Tone }

export const ATTENDANCE_META: Record<AttendanceStatus, Meta & { dot: string }> = {
  WORKING: { label: 'Working', tone: 'green', dot: 'bg-emerald-500' },
  WFH: { label: 'WFH', tone: 'blue', dot: 'bg-blue-500' },
  LEAVE: { label: 'Leave', tone: 'amber', dot: 'bg-amber-500' },
  HOLIDAY: { label: 'Holiday', tone: 'purple', dot: 'bg-purple-500' },
  WEEK_OFF: { label: 'Week Off', tone: 'gray', dot: 'bg-slate-400' },
}

export const REQUEST_STATUS_META: Record<RequestStatus, Meta> = {
  PENDING: { label: 'Pending', tone: 'amber' },
  APPROVED: { label: 'Approved', tone: 'green' },
  REJECTED: { label: 'Rejected', tone: 'red' },
  CANCELLED: { label: 'Cancelled', tone: 'gray' },
}

export const EMPLOYEE_STATUS_META: Record<EmployeeStatus, Meta> = {
  ACTIVE: { label: 'Active', tone: 'green' },
  INACTIVE: { label: 'Inactive', tone: 'gray' },
  ON_NOTICE: { label: 'On Notice', tone: 'amber' },
}

export const ROLE_META: Record<Role, Meta> = {
  ADMIN: { label: 'Admin', tone: 'indigo' },
  EMPLOYEE: { label: 'Employee', tone: 'gray' },
}

export const TASK_STATUS_META: Record<TaskStatus, Meta> = {
  TODO: { label: 'To Do', tone: 'gray' },
  IN_PROGRESS: { label: 'In Progress', tone: 'blue' },
  BLOCKED: { label: 'Blocked', tone: 'red' },
  COMPLETED: { label: 'Completed', tone: 'green' },
}

export const TASK_PRIORITY_META: Record<TaskPriority, Meta> = {
  LOW: { label: 'Low', tone: 'gray' },
  MEDIUM: { label: 'Medium', tone: 'amber' },
  HIGH: { label: 'High', tone: 'red' },
}

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  FULL: 'Full Day',
  HALF: 'Half Day',
}

export function formatDays(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function formatSigned(value: number): string {
  return `${value > 0 ? '+' : ''}${formatDays(value)}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
