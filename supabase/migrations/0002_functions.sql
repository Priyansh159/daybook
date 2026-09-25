-- HRMS business-logic functions.
-- Every write that touches a balance goes through one of these
-- SECURITY DEFINER functions instead of a raw table INSERT/UPDATE, so the
-- calculation rules (§46, §47) can never be bypassed from the client.

-- =========================================================================
-- is_admin / current_employee_id: reused by RLS policies and functions.
-- Both ignore INACTIVE accounts, so a deactivated user loses access to all
-- data at the database level (§50) — they can still read their own
-- employees row, which is how the app knows to show "account inactive".
-- =========================================================================
create function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from employees e
    where e.auth_user_id = auth.uid() and e.role = 'ADMIN' and e.status <> 'INACTIVE'
  );
$$;

create function current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id from employees e where e.auth_user_id = auth.uid() and e.status <> 'INACTIVE';
$$;

-- =========================================================================
-- Column-level protection on employees (§49): a non-admin may only ever
-- change full_name / phone / avatar_url on their own row (RLS already
-- limits *which* row; this trigger limits *which columns*).
-- =========================================================================
create function enforce_employee_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    if new.role is distinct from old.role
      or new.employee_code is distinct from old.employee_code
      or new.email is distinct from old.email
      or new.department is distinct from old.department
      or new.designation is distinct from old.designation
      or new.joining_date is distinct from old.joining_date
      or new.status is distinct from old.status
      or new.auth_user_id is distinct from old.auth_user_id
    then
      raise exception 'You are not allowed to modify this field';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_employee_update_permissions
  before update on employees
  for each row execute function enforce_employee_update_permissions();

-- Audit log whenever an admin changes an employee's status (§35).
create function log_employee_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      current_employee_id(),
      'EMPLOYEE_STATUS_CHANGED',
      'employee',
      new.id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger log_employee_status_change
  after update on employees
  for each row execute function log_employee_status_change();

-- =========================================================================
-- Monthly balance initialization (§9, §40): called on dashboard load.
-- =========================================================================
create function get_or_init_leave_balance(p_employee_id uuid, p_year int, p_month int)
returns leave_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row leave_balances;
  v_default numeric(5, 1);
begin
  if not (is_admin() or p_employee_id = current_employee_id()) then
    raise exception 'Not authorized to view this balance';
  end if;

  select * into v_row from leave_balances
    where employee_id = p_employee_id and year = p_year and month = p_month
    for update;

  if not found then
    select default_monthly_leave into v_default from app_settings where id = 1;
    insert into leave_balances (employee_id, year, month, allocated)
      values (p_employee_id, p_year, p_month, v_default)
      returning * into v_row;
  end if;

  return v_row;
end;
$$;

create function get_or_init_wfh_balance(p_employee_id uuid, p_year int, p_month int)
returns wfh_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row wfh_balances;
  v_default numeric(5, 1);
begin
  if not (is_admin() or p_employee_id = current_employee_id()) then
    raise exception 'Not authorized to view this balance';
  end if;

  select * into v_row from wfh_balances
    where employee_id = p_employee_id and year = p_year and month = p_month
    for update;

  if not found then
    select default_monthly_wfh into v_default from app_settings where id = 1;
    insert into wfh_balances (employee_id, year, month, allocated)
      values (p_employee_id, p_year, p_month, v_default)
      returning * into v_row;
  end if;

  return v_row;
end;
$$;

-- =========================================================================
-- set_daily_status (§16): the single entry point for an employee marking
-- their day as WORKING / WFH / LEAVE / HOLIDAY / WEEK_OFF. Reverses any
-- previous effect for that date before applying the new one, so switching
-- status never double-counts or leaks balance usage.
-- p_leave_type ('FULL' | 'HALF') is the day portion for both LEAVE and WFH.
-- =========================================================================
create function set_daily_status(
  p_date date,
  p_status text,
  p_note text default null,
  p_leave_type text default 'FULL'
)
returns attendance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid := current_employee_id();
  v_old_status text;
  v_year int := extract(year from p_date);
  v_month int := extract(month from p_date);
  v_duration numeric(3, 1);
  v_allow_half_leave boolean;
  v_allow_half_wfh boolean;
  v_leave_balance leave_balances;
  v_wfh_balance wfh_balances;
  v_result attendance;
begin
  if v_employee_id is null then
    raise exception 'No active employee profile for the current user';
  end if;
  if p_status not in ('WORKING', 'WFH', 'LEAVE', 'HOLIDAY', 'WEEK_OFF') then
    raise exception 'Invalid status %', p_status;
  end if;

  select status into v_old_status from attendance
    where employee_id = v_employee_id and date = p_date
    for update;

  -- Reverse the previous day's effect on balances, if any.
  if v_old_status = 'LEAVE' then
    update leave_requests set status = 'CANCELLED'
      where employee_id = v_employee_id and date = p_date and status <> 'CANCELLED'
      returning duration into v_duration;
    if v_duration is not null then
      update leave_balances set used = used - v_duration
        where employee_id = v_employee_id and year = v_year and month = v_month;
    end if;
  elsif v_old_status = 'WFH' then
    update wfh_records set status = 'CANCELLED'
      where employee_id = v_employee_id and date = p_date and status <> 'CANCELLED'
      returning duration into v_duration;
    if v_duration is not null then
      update wfh_balances set used = used - v_duration
        where employee_id = v_employee_id and year = v_year and month = v_month;
    end if;
  end if;

  -- Apply the new status.
  if p_status = 'LEAVE' then
    v_duration := case p_leave_type when 'HALF' then 0.5 else 1 end;

    select allow_half_day_leave into v_allow_half_leave from app_settings where id = 1;
    if p_leave_type = 'HALF' and not v_allow_half_leave then
      raise exception 'Half-day leave is not enabled';
    end if;

    perform get_or_init_leave_balance(v_employee_id, v_year, v_month);
    select * into v_leave_balance from leave_balances
      where employee_id = v_employee_id and year = v_year and month = v_month;
    if v_leave_balance.remaining < v_duration then
      raise exception 'Insufficient leave balance for this month';
    end if;

    insert into leave_requests (employee_id, date, leave_type, duration, reason, status)
      values (v_employee_id, p_date, p_leave_type, v_duration, p_note, 'APPROVED')
      on conflict (employee_id, date) where status <> 'CANCELLED'
      do update set leave_type = excluded.leave_type, duration = excluded.duration, reason = excluded.reason;

    update leave_balances set used = used + v_duration
      where employee_id = v_employee_id and year = v_year and month = v_month;

  elsif p_status = 'WFH' then
    v_duration := case p_leave_type when 'HALF' then 0.5 else 1 end;

    select allow_half_day_wfh into v_allow_half_wfh from app_settings where id = 1;
    if p_leave_type = 'HALF' and not v_allow_half_wfh then
      raise exception 'Half-day WFH is not enabled';
    end if;

    perform get_or_init_wfh_balance(v_employee_id, v_year, v_month);
    select * into v_wfh_balance from wfh_balances
      where employee_id = v_employee_id and year = v_year and month = v_month;
    if v_wfh_balance.remaining < v_duration then
      raise exception 'Insufficient WFH balance for this month';
    end if;

    insert into wfh_records (employee_id, date, duration, reason, status)
      values (v_employee_id, p_date, v_duration, p_note, 'APPROVED')
      on conflict (employee_id, date) where status <> 'CANCELLED'
      do update set duration = excluded.duration, reason = excluded.reason;

    update wfh_balances set used = used + v_duration
      where employee_id = v_employee_id and year = v_year and month = v_month;
  end if;

  insert into attendance (employee_id, date, status, note)
    values (v_employee_id, p_date, p_status, p_note)
    on conflict (employee_id, date)
    do update set status = excluded.status, note = excluded.note
    returning * into v_result;

  return v_result;
end;
$$;

-- =========================================================================
-- admin_adjust_balance (§12, §25): the only way adjustment gets written.
-- =========================================================================
create function admin_adjust_balance(
  p_employee_id uuid,
  p_year int,
  p_month int,
  p_kind text,
  p_amount numeric,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only admins can adjust balances';
  end if;
  if p_kind not in ('LEAVE', 'WFH') then
    raise exception 'Invalid kind %', p_kind;
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required for a balance adjustment';
  end if;

  if p_kind = 'LEAVE' then
    perform get_or_init_leave_balance(p_employee_id, p_year, p_month);
    update leave_balances set adjustment = adjustment + p_amount
      where employee_id = p_employee_id and year = p_year and month = p_month;
  else
    perform get_or_init_wfh_balance(p_employee_id, p_year, p_month);
    update wfh_balances set adjustment = adjustment + p_amount
      where employee_id = p_employee_id and year = p_year and month = p_month;
  end if;

  insert into balance_adjustments (employee_id, kind, year, month, amount, reason, created_by)
    values (p_employee_id, p_kind, p_year, p_month, p_amount, p_reason, current_employee_id());

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      current_employee_id(), 'BALANCE_ADJUSTED', 'employee', p_employee_id,
      jsonb_build_object('kind', p_kind, 'year', p_year, 'month', p_month, 'amount', p_amount, 'reason', p_reason)
    );
end;
$$;

-- =========================================================================
-- admin_review_leave_request (§11, §24): approve/reject/cancel with
-- balance + attendance kept in sync.
-- =========================================================================
create function admin_review_leave_request(p_request_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request leave_requests;
begin
  if not is_admin() then
    raise exception 'Only admins can review leave requests';
  end if;
  if p_status not in ('APPROVED', 'REJECTED', 'CANCELLED') then
    raise exception 'Invalid status %', p_status;
  end if;

  select * into v_request from leave_requests where id = p_request_id for update;
  if not found then
    raise exception 'Leave request not found';
  end if;

  if v_request.status = 'APPROVED' and p_status in ('REJECTED', 'CANCELLED') then
    update leave_balances set used = used - v_request.duration
      where employee_id = v_request.employee_id
        and year = extract(year from v_request.date)
        and month = extract(month from v_request.date);
    update attendance set status = 'WORKING'
      where employee_id = v_request.employee_id and date = v_request.date and status = 'LEAVE';
  elsif v_request.status <> 'APPROVED' and p_status = 'APPROVED' then
    update leave_balances set used = used + v_request.duration
      where employee_id = v_request.employee_id
        and year = extract(year from v_request.date)
        and month = extract(month from v_request.date);
    update attendance set status = 'LEAVE'
      where employee_id = v_request.employee_id and date = v_request.date;
  end if;

  update leave_requests set status = p_status where id = p_request_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (current_employee_id(), 'LEAVE_REVIEWED', 'leave_request', p_request_id, jsonb_build_object('status', p_status));
end;
$$;

-- Lock down direct table access; every balance-affecting write must go
-- through the functions above.
revoke insert, update, delete on leave_balances from authenticated;
revoke insert, update, delete on wfh_balances from authenticated;
revoke insert, update, delete on leave_requests from authenticated;
revoke insert, update, delete on wfh_records from authenticated;
revoke insert, update, delete on attendance from authenticated;
revoke insert, update, delete on balance_adjustments from authenticated;
revoke insert, update, delete on audit_logs from authenticated;
