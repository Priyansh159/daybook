import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { EmployeeCreateValues, EmployeeUpdateValues, ProfileValues } from '@/lib/validation'
import type { EmployeeRow } from '@/types/database'
import { unwrap, unwrapList } from '@/services/supabaseResult'

export async function listEmployees(): Promise<EmployeeRow[]> {
  return unwrapList(await supabase.from('employees').select('*').order('full_name'))
}

export async function getEmployee(id: string): Promise<EmployeeRow> {
  return unwrap(await supabase.from('employees').select('*').eq('id', id).maybeSingle())
}

// Auth user creation needs the service-role key, so it runs in the
// create-employee Edge Function; the browser only sends the admin's JWT.
export async function createEmployee(values: EmployeeCreateValues): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke<{ id: string }>('create-employee', { body: values })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => null)) as { error?: string } | null
      throw new AppError(body?.error ?? 'Could not create the employee.')
    }
    throw error
  }
  if (!data) throw new AppError('Could not create the employee.')
  return data
}

export async function updateEmployee(id: string, values: EmployeeUpdateValues): Promise<EmployeeRow> {
  return unwrap(await supabase.from('employees').update(values).eq('id', id).select('*').single())
}

export async function setEmployeeStatus(id: string, status: EmployeeRow['status']): Promise<void> {
  unwrap(await supabase.from('employees').update({ status }).eq('id', id).select('id').single())
}

export async function updateMyProfile(id: string, values: ProfileValues): Promise<EmployeeRow> {
  return unwrap(await supabase.from('employees').update(values).eq('id', id).select('*').single())
}
