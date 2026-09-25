import { supabase } from '@/lib/supabase'
import type { YearMonth } from '@/utils/date'
import type { BalanceAdjustmentRow, BalanceKind, BalanceRow } from '@/types/database'
import { unwrap, unwrapList, unwrapVoid } from '@/services/supabaseResult'

const initFn = {
  LEAVE: 'get_or_init_leave_balance',
  WFH: 'get_or_init_wfh_balance',
} as const

const table = {
  LEAVE: 'leave_balances',
  WFH: 'wfh_balances',
} as const

// Creates the month's row from app_settings defaults on first access (§9, §40).
export async function getOrInitBalance(kind: BalanceKind, employeeId: string, ym: YearMonth): Promise<BalanceRow> {
  return unwrap(
    await supabase.rpc(initFn[kind], { p_employee_id: employeeId, p_year: ym.year, p_month: ym.month }),
  )
}

export async function listBalancesForMonth(kind: BalanceKind, ym: YearMonth): Promise<BalanceRow[]> {
  return unwrapList(await supabase.from(table[kind]).select('*').eq('year', ym.year).eq('month', ym.month))
}

export async function listBalancesForEmployee(kind: BalanceKind, employeeId: string, year: number): Promise<BalanceRow[]> {
  return unwrapList(
    await supabase.from(table[kind]).select('*').eq('employee_id', employeeId).eq('year', year).order('month'),
  )
}

export async function adjustBalance(params: {
  kind: BalanceKind
  employeeId: string
  ym: YearMonth
  amount: number
  reason: string
}): Promise<void> {
  unwrapVoid(
    await supabase.rpc('adjust_balance', {
      p_employee_id: params.employeeId,
      p_year: params.ym.year,
      p_month: params.ym.month,
      p_kind: params.kind,
      p_amount: params.amount,
      p_reason: params.reason,
    }),
  )
}

export async function listAdjustments(filter: { kind?: BalanceKind; employeeId?: string }): Promise<BalanceAdjustmentRow[]> {
  let query = supabase.from('balance_adjustments').select('*').order('created_at', { ascending: false }).limit(100)
  if (filter.kind) query = query.eq('kind', filter.kind)
  if (filter.employeeId) query = query.eq('employee_id', filter.employeeId)
  return unwrapList(await query)
}
