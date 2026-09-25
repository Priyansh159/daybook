-- Widen balance adjustment from admin-only to self-service: every employee
-- can add/subtract their own leave or WFH balance directly (no request to
-- anyone). Admins can still adjust *anyone's* balance. The audit trail
-- (balance_adjustments, created_by) is unchanged — it just now also records
-- an employee adjusting their own row instead of only an admin's action.
drop function if exists admin_adjust_balance(uuid, int, int, text, numeric, text);

create function adjust_balance(
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
  if not (is_admin() or p_employee_id = current_employee_id()) then
    raise exception 'You can only adjust your own balance';
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
