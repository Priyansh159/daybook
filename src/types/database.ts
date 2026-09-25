// Hand-written to mirror supabase/migrations. Once a Supabase project is
// linked, this can be regenerated with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type Role = 'ADMIN' | 'EMPLOYEE'
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_NOTICE'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type LeaveType = 'FULL' | 'HALF'
export type AttendanceStatus = 'WORKING' | 'WFH' | 'LEAVE' | 'HOLIDAY' | 'WEEK_OFF'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'
export type BalanceKind = 'LEAVE' | 'WFH'

type Timestamps = { created_at: string; updated_at: string }

export type EmployeeRow = Timestamps & {
  id: string
  auth_user_id: string | null
  employee_code: string
  full_name: string
  email: string
  phone: string | null
  department: string | null
  designation: string | null
  joining_date: string
  role: Role
  avatar_url: string | null
  status: EmployeeStatus
}

export type AppSettingsRow = {
  id: number
  default_monthly_leave: number
  default_monthly_wfh: number
  allow_half_day_leave: boolean
  allow_half_day_wfh: boolean
  updated_at: string
}

export type BalanceRow = Timestamps & {
  id: string
  employee_id: string
  year: number
  month: number
  allocated: number
  used: number
  adjustment: number
  remaining: number
}

export type LeaveRequestRow = Timestamps & {
  id: string
  employee_id: string
  date: string
  leave_type: LeaveType
  duration: number
  reason: string | null
  status: RequestStatus
}

export type WfhRecordRow = Timestamps & {
  id: string
  employee_id: string
  date: string
  duration: number
  reason: string | null
  status: RequestStatus
}

export type BalanceAdjustmentRow = {
  id: string
  employee_id: string
  kind: BalanceKind
  year: number
  month: number
  amount: number
  reason: string
  created_by: string
  created_at: string
}

export type AttendanceRow = Timestamps & {
  id: string
  employee_id: string
  date: string
  status: AttendanceStatus
  note: string | null
}

export type TaskRow = Timestamps & {
  id: string
  employee_id: string
  title: string
  description: string | null
  project: string | null
  priority: TaskPriority
  status: TaskStatus
  start_date: string | null
  due_date: string | null
  completed_at: string | null
}

export type HolidayRow = {
  id: string
  date: string
  name: string
  created_at: string
}

export type AuditLogRow = {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

type Generated = 'id' | 'created_at' | 'updated_at'

type TaskInsert = Omit<
  TaskRow,
  Generated | 'completed_at' | 'description' | 'project' | 'start_date' | 'due_date' | 'priority' | 'status'
> & {
  description?: string | null
  project?: string | null
  start_date?: string | null
  due_date?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  completed_at?: string | null
}

type EmployeeUpdate = Partial<Omit<EmployeeRow, Generated>>

export type Database = {
  public: {
    Tables: {
      employees: Table<EmployeeRow, Omit<EmployeeRow, Generated>, EmployeeUpdate>
      app_settings: Table<AppSettingsRow, Partial<AppSettingsRow>>
      leave_balances: Table<BalanceRow, never, never>
      wfh_balances: Table<BalanceRow, never, never>
      leave_requests: Table<LeaveRequestRow, never, never>
      wfh_records: Table<WfhRecordRow, never, never>
      balance_adjustments: Table<BalanceAdjustmentRow, never, never>
      attendance: Table<AttendanceRow, never, never>
      tasks: Table<TaskRow, TaskInsert>
      holidays: Table<HolidayRow, Omit<HolidayRow, 'id' | 'created_at'>>
      audit_logs: Table<AuditLogRow, never, never>
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      current_employee_id: { Args: Record<string, never>; Returns: string | null }
      get_or_init_leave_balance: {
        Args: { p_employee_id: string; p_year: number; p_month: number }
        Returns: BalanceRow
      }
      get_or_init_wfh_balance: {
        Args: { p_employee_id: string; p_year: number; p_month: number }
        Returns: BalanceRow
      }
      set_daily_status: {
        Args: { p_date: string; p_status: AttendanceStatus; p_note?: string | null; p_leave_type?: LeaveType }
        Returns: AttendanceRow
      }
      adjust_balance: {
        Args: {
          p_employee_id: string
          p_year: number
          p_month: number
          p_kind: BalanceKind
          p_amount: number
          p_reason: string
        }
        Returns: undefined
      }
      admin_review_leave_request: {
        Args: { p_request_id: string; p_status: Exclude<RequestStatus, 'PENDING'> }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
