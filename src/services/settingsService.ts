import { supabase } from '@/lib/supabase'
import type { SettingsValues } from '@/lib/validation'
import type { AppSettingsRow, AuditLogRow, HolidayRow } from '@/types/database'
import { unwrap, unwrapList, unwrapVoid } from '@/services/supabaseResult'

export async function getSettings(): Promise<AppSettingsRow> {
  return unwrap(await supabase.from('app_settings').select('*').eq('id', 1).single())
}

export async function updateSettings(values: SettingsValues): Promise<AppSettingsRow> {
  return unwrap(await supabase.from('app_settings').update(values).eq('id', 1).select('*').single())
}

export async function listHolidays(range?: { from: string; to: string }): Promise<HolidayRow[]> {
  let query = supabase.from('holidays').select('*').order('date')
  if (range) query = query.gte('date', range.from).lte('date', range.to)
  return unwrapList(await query)
}

export async function addHoliday(date: string, name: string): Promise<void> {
  unwrapVoid(await supabase.from('holidays').insert({ date, name }))
}

export async function deleteHoliday(id: string): Promise<void> {
  unwrapVoid(await supabase.from('holidays').delete().eq('id', id))
}

export async function listAuditLogs(filter: { entityId?: string; limit?: number } = {}): Promise<AuditLogRow[]> {
  let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(filter.limit ?? 50)
  if (filter.entityId) query = query.eq('entity_id', filter.entityId)
  return unwrapList(await query)
}
