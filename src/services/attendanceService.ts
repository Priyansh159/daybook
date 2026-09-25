import { supabase } from '@/lib/supabase'
import type { AttendanceRow, AttendanceStatus, LeaveType } from '@/types/database'
import { unwrap, unwrapList } from '@/services/supabaseResult'

export async function setDailyStatus(params: {
  date: string
  status: AttendanceStatus
  note: string | null
  portion?: LeaveType
}): Promise<AttendanceRow> {
  return unwrap(
    await supabase.rpc('set_daily_status', {
      p_date: params.date,
      p_status: params.status,
      p_note: params.note,
      p_leave_type: params.portion ?? 'FULL',
    }),
  )
}

export async function listAttendance(filter: { employeeId?: string; from: string; to: string }): Promise<AttendanceRow[]> {
  let query = supabase.from('attendance').select('*').gte('date', filter.from).lte('date', filter.to).order('date')
  if (filter.employeeId) query = query.eq('employee_id', filter.employeeId)
  return unwrapList(await query)
}
