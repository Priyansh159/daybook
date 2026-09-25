// Supabase Edge Function: create-employee
//
// Creating an Auth user requires the service-role key, which must never
// reach the browser. The React app calls this function with the admin's
// own JWT; the function verifies that JWT belongs to an ADMIN before doing
// anything privileged.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const payloadSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  phone: z.string().trim().max(20).optional().nullable(),
  employeeCode: z.string().trim().min(1).max(32),
  department: z.string().trim().max(80).optional().nullable(),
  designation: z.string().trim().max(80).optional().nullable(),
  // Defaults to today (IST) below when omitted — the admin isn't asked for this at creation time.
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_NOTICE']).default('ACTIVE'),
  initialLeaveBalance: z.number().min(0).max(31).optional().nullable(),
  initialWfhBalance: z.number().min(0).max(31).optional().nullable(),
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function currentIstYearMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  return { year, month }
}

function todayIstDate(): string {
  // en-CA gives yyyy-MM-dd directly.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization' }, 401)
  }

  // Verify the caller using their own JWT (never trust a role from the body).
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await callerClient.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'Invalid session' }, 401)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: caller, error: callerError } = await admin
    .from('employees')
    .select('id, role, status')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle()
  if (callerError || !caller || caller.role !== 'ADMIN' || caller.status !== 'ACTIVE') {
    return json({ error: 'Only active admins can create employees' }, 403)
  }

  let payload: z.infer<typeof payloadSchema>
  try {
    payload = payloadSchema.parse(await req.json())
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message ?? 'Invalid input' : 'Invalid JSON body'
    return json({ error: message }, 400)
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  })
  if (createError || !created.user) {
    const message = createError?.message?.toLowerCase().includes('already')
      ? 'An account with this email already exists'
      : 'Could not create the login account'
    return json({ error: message }, 400)
  }

  const authUserId = created.user.id

  const { data: employee, error: employeeError } = await admin
    .from('employees')
    .insert({
      auth_user_id: authUserId,
      employee_code: payload.employeeCode,
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone ?? null,
      department: payload.department ?? null,
      designation: payload.designation ?? null,
      joining_date: payload.joiningDate ?? todayIstDate(),
      role: payload.role,
      status: payload.status,
    })
    .select('id')
    .single()

  if (employeeError || !employee) {
    // Roll back the orphaned auth user so the email can be reused.
    await admin.auth.admin.deleteUser(authUserId)
    const message = employeeError?.code === '23505'
      ? 'Employee ID or email is already in use'
      : 'Could not create the employee profile'
    return json({ error: message }, 400)
  }

  const { data: settings } = await admin
    .from('app_settings')
    .select('default_monthly_leave, default_monthly_wfh')
    .eq('id', 1)
    .single()

  const { year, month } = currentIstYearMonth()
  await admin.from('leave_balances').insert({
    employee_id: employee.id,
    year,
    month,
    allocated: payload.initialLeaveBalance ?? settings?.default_monthly_leave ?? 2.5,
  })
  await admin.from('wfh_balances').insert({
    employee_id: employee.id,
    year,
    month,
    allocated: payload.initialWfhBalance ?? settings?.default_monthly_wfh ?? 4,
  })

  await admin.from('audit_logs').insert({
    actor_id: caller.id,
    action: 'EMPLOYEE_CREATED',
    entity_type: 'employee',
    entity_id: employee.id,
    metadata: { email: payload.email, role: payload.role },
  })

  return json({ id: employee.id }, 201)
})
