import { supabase } from '@/lib/supabase'
import type { TaskValues } from '@/lib/validation'
import type { TaskRow, TaskStatus } from '@/types/database'
import { unwrap, unwrapList, unwrapVoid } from '@/services/supabaseResult'

// completed_at is set by the set_task_completed_at trigger, not the client.

export async function listTasks(filter: { employeeId?: string } = {}): Promise<TaskRow[]> {
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(1000)
  if (filter.employeeId) query = query.eq('employee_id', filter.employeeId)
  return unwrapList(await query)
}

export async function createTask(employeeId: string, values: TaskValues): Promise<TaskRow> {
  return unwrap(await supabase.from('tasks').insert({ ...values, employee_id: employeeId }).select('*').single())
}

export async function updateTask(id: string, values: Partial<TaskValues> & { status?: TaskStatus }): Promise<TaskRow> {
  return unwrap(await supabase.from('tasks').update(values).eq('id', id).select('*').single())
}

export async function deleteTask(id: string): Promise<void> {
  unwrapVoid(await supabase.from('tasks').delete().eq('id', id))
}
