-- Row Level Security (§28). Every application table gets RLS enabled and
-- explicit role-based policies — never `using (true)`.

alter table employees enable row level security;
alter table app_settings enable row level security;
alter table leave_balances enable row level security;
alter table wfh_balances enable row level security;
alter table leave_requests enable row level security;
alter table wfh_records enable row level security;
alter table balance_adjustments enable row level security;
alter table attendance enable row level security;
alter table tasks enable row level security;
alter table holidays enable row level security;
alter table audit_logs enable row level security;

-- ---------------------------------------------------------------- employees
create policy "employees_select_own_or_admin"
  on employees for select
  using (auth_user_id = auth.uid() or is_admin());

create policy "employees_update_own_or_admin"
  on employees for update
  using (id = current_employee_id() or is_admin());
  -- column-level restriction is enforced by the enforce_employee_update_permissions trigger

create policy "employees_insert_admin_only"
  on employees for insert
  with check (is_admin());

create policy "employees_delete_admin_only"
  on employees for delete
  using (is_admin());

-- ------------------------------------------------------------- app_settings
create policy "app_settings_select_authenticated"
  on app_settings for select
  to authenticated
  using (true);

create policy "app_settings_update_admin_only"
  on app_settings for update
  using (is_admin());

-- ----------------------------------------------------------- leave_balances
create policy "leave_balances_select_own_or_admin"
  on leave_balances for select
  using (is_admin() or employee_id = current_employee_id());

-- No insert/update/delete policies: writes are revoked from `authenticated`
-- entirely (0002_functions.sql) and only happen via SECURITY DEFINER RPCs.

-- ------------------------------------------------------------- wfh_balances
create policy "wfh_balances_select_own_or_admin"
  on wfh_balances for select
  using (is_admin() or employee_id = current_employee_id());

-- ------------------------------------------------------------ leave_requests
create policy "leave_requests_select_own_or_admin"
  on leave_requests for select
  using (is_admin() or employee_id = current_employee_id());

-- --------------------------------------------------------------- wfh_records
create policy "wfh_records_select_own_or_admin"
  on wfh_records for select
  using (is_admin() or employee_id = current_employee_id());

-- ---------------------------------------------------------- balance_adjustments
create policy "balance_adjustments_select_own_or_admin"
  on balance_adjustments for select
  using (is_admin() or employee_id = current_employee_id());

-- -------------------------------------------------------------- attendance
create policy "attendance_select_own_or_admin"
  on attendance for select
  using (is_admin() or employee_id = current_employee_id());

-- ------------------------------------------------------------------- tasks
-- Tasks are the one table an employee writes directly (§17, §48).
create policy "tasks_select_own_or_admin"
  on tasks for select
  using (is_admin() or employee_id = current_employee_id());

create policy "tasks_insert_own"
  on tasks for insert
  with check (employee_id = current_employee_id());

create policy "tasks_update_own_or_admin"
  on tasks for update
  using (is_admin() or employee_id = current_employee_id());

create policy "tasks_delete_own_or_admin"
  on tasks for delete
  using (is_admin() or employee_id = current_employee_id());

-- ----------------------------------------------------------------- holidays
create policy "holidays_select_authenticated"
  on holidays for select
  to authenticated
  using (true);

create policy "holidays_write_admin_only"
  on holidays for all
  using (is_admin())
  with check (is_admin());

-- --------------------------------------------------------------- audit_logs
create policy "audit_logs_select_admin_only"
  on audit_logs for select
  using (is_admin());
