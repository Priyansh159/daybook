import { supabase } from '@/lib/supabase'
import { monthRange, type YearMonth } from '@/utils/date'
import type { LeaveRequestRow, LeaveType, RequestStatus, WfhRecordRow } from '@/types/database'
import { unwrapList, unwrapVoid } from '@/services/supabaseResult'
import { setDailyStatus } from '@/services/attendanceService'

type ListFilter = { employeeId?: string; status?: RequestStatus; month?: YearMonth }

export async function listLeaveRequests(filter: ListFilter = {}): Promise<LeaveRequestRow[]> {
  let query = supabase.from('leave_requests').select('*').order('date', { ascending: false }).limit(500)
  if (filter.employeeId) query = query.eq('employee_id', filter.employeeId)
  if (filter.status) query = query.eq('status', filter.status)
  if (filter.month) {
    const { from, to } = monthRange(filter.month)
    query = query.gte('date', from).lte('date', to)
  }
  return unwrapList(await query)
}

export async function listWfhRecords(filter: ListFilter = {}): Promise<WfhRecordRow[]> {
  let query = supabase.from('wfh_records').select('*').order('date', { ascending: false }).limit(500)
  if (filter.employeeId) query = query.eq('employee_id', filter.employeeId)
  if (filter.status) query = query.eq('status', filter.status)
  if (filter.month) {
    const { from, to } = monthRange(filter.month)
    query = query.gte('date', from).lte('date', to)
  }
  return unwrapList(await query)
}

// Leave and WFH are recorded through the day's status so attendance and
// balances can never disagree (see set_daily_status in 0002_functions.sql).
export function requestLeave(date: string, leaveType: LeaveType, reason: string | null) {
  return setDailyStatus({ date, status: 'LEAVE', note: reason, portion: leaveType })
}

export function requestWfh(date: string, reason: string | null, portion: LeaveType = 'FULL') {
  return setDailyStatus({ date, status: 'WFH', note: reason, portion })
}

export function withdrawDay(date: string) {
  return setDailyStatus({ date, status: 'WORKING', note: null })
}

export async function reviewLeaveRequest(requestId: string, status: Exclude<RequestStatus, 'PENDING'>): Promise<void> {
  unwrapVoid(await supabase.rpc('admin_review_leave_request', { p_request_id: requestId, p_status: status }))
}
