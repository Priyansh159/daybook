import { supabase } from '@/lib/supabase'
import type { EmployeeRow } from '@/types/database'

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function fetchMyProfile(authUserId: string): Promise<EmployeeRow | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) throw error
  return data
}
