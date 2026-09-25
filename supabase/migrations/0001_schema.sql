-- HRMS core schema
create extension if not exists pgcrypto;

-- =========================================================================
-- employees: the HRMS profile linked 1:1 to a Supabase Auth user.
-- Auth (email/password/session) lives entirely in auth.users; this table
-- never stores credentials.
-- =========================================================================
create table employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  employee_code text not null unique,
  full_name text not null,
  email text not null unique,
  phone text,
  department text,
  designation text,
  joining_date date not null default current_date,
  role text not null default 'EMPLOYEE' check (role in ('ADMIN', 'EMPLOYEE')),
  avatar_url text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'ON_NOTICE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index employees_auth_user_id_idx on employees (auth_user_id);
create index employees_status_idx on employees (status);

-- =========================================================================
-- app_settings: single-row configuration (§41). Defaults are read by the
-- balance-initialization functions instead of being hardcoded in the app.
-- =========================================================================
create table app_settings (
  id smallint primary key default 1 check (id = 1),
  default_monthly_leave numeric(5, 1) not null default 2.5,
  default_monthly_wfh numeric(5, 1) not null default 4,
  allow_half_day_leave boolean not null default true,
  allow_half_day_wfh boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (1);

-- =========================================================================
-- leave_balances / wfh_balances: one row per employee per month.
-- remaining is a generated column so it can never drift from its inputs.
-- =========================================================================
create table leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  allocated numeric(5, 1) not null default 0,
  used numeric(5, 1) not null default 0,
  adjustment numeric(5, 1) not null default 0,
  remaining numeric(5, 1) generated always as (allocated + adjustment - used) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, year, month)
);

create table wfh_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  allocated numeric(5, 1) not null default 0,
  used numeric(5, 1) not null default 0,
  adjustment numeric(5, 1) not null default 0,
  remaining numeric(5, 1) generated always as (allocated + adjustment - used) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, year, month)
);

-- =========================================================================
-- leave_requests / wfh_records: one row per day a leave/WFH was taken.
-- A partial unique index (excluding CANCELLED) keeps history while still
-- guaranteeing at most one *active* record per employee per date.
-- =========================================================================
create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  date date not null,
  leave_type text not null check (leave_type in ('FULL', 'HALF')),
  duration numeric(3, 1) not null check (duration in (0.5, 1)),
  reason text,
  status text not null default 'APPROVED' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index leave_requests_active_per_day
  on leave_requests (employee_id, date)
  where status <> 'CANCELLED';

create table wfh_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  date date not null,
  duration numeric(3, 1) not null default 1 check (duration in (0.5, 1)),
  reason text,
  status text not null default 'APPROVED' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index wfh_records_active_per_day
  on wfh_records (employee_id, date)
  where status <> 'CANCELLED';

-- =========================================================================
-- balance_adjustments: audit trail for admin corrections to either leave
-- or WFH balances (§12 leave_adjustments, generalized to avoid duplicating
-- an identical wfh_adjustments table).
-- =========================================================================
create table balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  kind text not null check (kind in ('LEAVE', 'WFH')),
  year int not null,
  month int not null check (month between 1 and 12),
  amount numeric(5, 1) not null,
  reason text not null,
  created_by uuid not null references employees (id),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- attendance: the single daily status record (§15). Unique per employee
-- per date; set_daily_status() is the only supported way to write it.
-- =========================================================================
create table attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  date date not null,
  status text not null check (status in ('WORKING', 'WFH', 'LEAVE', 'HOLIDAY', 'WEEK_OFF')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, date)
);

create index attendance_employee_date_idx on attendance (employee_id, date);

-- =========================================================================
-- tasks: fully owned by the employee (§17).
-- =========================================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  status text not null default 'TODO' check (status in ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_employee_id_idx on tasks (employee_id);

-- =========================================================================
-- holidays, audit_logs
-- =========================================================================
create table holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references employees (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on audit_logs (created_at desc);

-- =========================================================================
-- updated_at maintenance
-- =========================================================================
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on employees
  for each row execute function set_updated_at();
create trigger set_updated_at before update on app_settings
  for each row execute function set_updated_at();
create trigger set_updated_at before update on leave_balances
  for each row execute function set_updated_at();
create trigger set_updated_at before update on wfh_balances
  for each row execute function set_updated_at();
create trigger set_updated_at before update on leave_requests
  for each row execute function set_updated_at();
create trigger set_updated_at before update on wfh_records
  for each row execute function set_updated_at();
create trigger set_updated_at before update on attendance
  for each row execute function set_updated_at();
create trigger set_updated_at before update on tasks
  for each row execute function set_updated_at();

-- completed_at is stamped by the database, never trusted from the client (§48).
create function set_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'COMPLETED' then
    if tg_op = 'INSERT' or old.status is distinct from 'COMPLETED' then
      new.completed_at = now();
    else
      new.completed_at = old.completed_at;
    end if;
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger set_task_completed_at before insert or update on tasks
  for each row execute function set_task_completed_at();
