# Daybook

A personal HRMS: employee profiles, monthly leave and WFH balances, daily
attendance status, and per-employee task management, with an admin console
for managing everyone. Built as a single React app on top of Supabase.

## Features

**Employee**
- Sign in, see today's status, mark the day as Working / WFH / Leave
- Monthly leave and WFH balances with automatic month-to-month allocation
- Request leave (full/half day) or WFH for any date, with cancellation
- Adjust your own leave/WFH balance directly (e.g. a manual correction) — no approval needed, just a reason for the audit trail
- Personal task board (create, edit, complete, delete)
- Monthly calendar and attendance history
- Edit profile (name, phone, avatar)

**Admin**
- Dashboard with org-wide counts (today's status, pending leave, tasks)
- Add employees (creates their login + profile in one step)
- Edit employee details, deactivate/reactivate
- Review leave requests, adjust leave/WFH balances with an audit trail
- View attendance, tasks, and reports across the organization
- Configure default allocations and company holidays

## Architecture

```
React + TypeScript (Vite)
        |
        v
Supabase JS client (anon key only)
        |
        +---- Supabase Auth (email + password)
        |
        +---- PostgreSQL, gated by Row Level Security
        |
        +---- Edge Function (service-role key, server-side only)
```

There is no separate backend server. Every read goes through RLS-scoped
`select`s; every write that affects a balance (leave, WFH, attendance) goes
through a `SECURITY DEFINER` Postgres function, not a raw table write — see
[supabase/migrations/0002_functions.sql](supabase/migrations/0002_functions.sql).
Creating a new employee's login requires the Supabase Auth Admin API, which
needs the service-role key; that call is isolated in the
[`create-employee`](supabase/functions/create-employee/index.ts) Edge
Function, which never runs in the browser.

## Tech stack

React 19, TypeScript (strict), Vite, Tailwind CSS, React Router, TanStack
Query, React Hook Form + Zod, Supabase (Postgres, Auth, RLS, Edge Functions),
Vitest.

## Database design

See [supabase/migrations/0001_schema.sql](supabase/migrations/0001_schema.sql)
for the full schema. Summary:

| Table | Purpose |
|---|---|
| `employees` | HRMS profile, one row per `auth.users` row |
| `app_settings` | Single-row config: default allocations, half-day toggles |
| `leave_balances` / `wfh_balances` | One row per employee per month; `remaining` is a generated column |
| `leave_requests` / `wfh_records` | One row per day taken |
| `balance_adjustments` | Audit trail for every manual correction to either balance (self-service or admin) |
| `attendance` | The day's status: WORKING / WFH / LEAVE / HOLIDAY / WEEK_OFF |
| `tasks` | Employee-owned tasks |
| `holidays`, `audit_logs` | Company holidays; admin action history |

### How monthly leave/WFH works

Nothing is hardcoded in the frontend. When a balance is first read for a
given employee/year/month, `get_or_init_leave_balance` /
`get_or_init_wfh_balance` create that month's row from `app_settings`
defaults (2.5 leave, 4 WFH) if it doesn't exist yet — there's no cron job or
frontend timer. `remaining` is always `allocated + adjustment - used`,
computed by the database so it can never drift.

### How the daily status button works

Marking today as Working / WFH / Leave calls one RPC,
`set_daily_status(date, status, note, leave_type)`. It reverses whatever the
previous status charged to a balance (if any), then applies the new one,
validating that enough balance remains — so switching between statuses never
double-counts or leaks usage, and a request past its balance is rejected by
the database itself, not just the UI.

### How authorization works

Authentication (Supabase Auth: who is signed in) and authorization (what
they can do) are fully separate. The `role` used everywhere in the UI comes
from the `employees` row linked to the signed-in `auth.users` id — never
from anything the client sends. Real enforcement is Row Level Security
(`supabase/migrations/0003_rls.sql`): every table has RLS enabled, employees
can only ever see their own rows (or admins see everything, via the
`is_admin()` helper), and writes to any balance-affecting table are revoked
from the `authenticated` role entirely — they only happen inside the
`SECURITY DEFINER` functions above. A trigger additionally blocks a
non-admin from changing their own `role`, `employee_code`, `status`, or
`joining_date` even through an otherwise-permitted profile update.

## Project setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then in the SQL
editor run the migrations in order:

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_functions.sql
supabase/migrations/0003_rls.sql
```

(Or, with the Supabase CLI linked to your project: `supabase db push`.)

### 3. Environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your project's
API settings. Only the anon key ever goes in this file — never the
service-role key.

### 4. Deploy the Edge Function

The `create-employee` function needs the service-role key, but only on
Supabase's servers:

```bash
supabase functions deploy create-employee
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

(`SUPABASE_URL` and `SUPABASE_ANON_KEY` are already available to Edge
Functions automatically.)

### 5. Create the first admin

There's deliberately no "become admin" button anywhere in the app. To
bootstrap the first one:

1. In the Supabase dashboard: **Authentication → Users → Add user**, create
   the admin's login with a real email + password.
2. Copy that user's UUID.
3. Fill in the values in
   [supabase/seed/000_first_admin.sql](supabase/seed/000_first_admin.sql)
   and run it in the SQL editor.

From then on, that admin can create every other employee from
**Employees → Add Employee** in the app itself.

### 6. Run locally

```bash
npm run dev
```

## Development

```bash
npm run dev         # start the dev server
npm run lint         # oxlint
npx tsc -b           # type-check
npm run test         # unit tests (vitest)
npm run build        # production build
```

Regenerate `src/types/database.ts` from a live project instead of hand-
editing it, once one exists:

```bash
npx supabase gen types typescript --project-id <ref> > src/types/database.ts
```

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment
   variables in the Vercel project settings (build command `npm run build`,
   output directory `dist` — Vite's defaults).
3. [`vercel.json`](vercel.json) rewrites all paths to `index.html` so
   React Router's client-side routes work on refresh/deep link.

## Security notes

- The frontend only ever holds the Supabase anon key. The service-role key
  lives only in the Edge Function's environment on Supabase's servers.
- Every table has Row Level Security enabled with explicit policies — no
  table uses `using (true)`.
- Balance-affecting writes (leave, WFH, attendance) are only possible
  through `SECURITY DEFINER` SQL functions, not direct table access.
- Before relying on this in production, manually verify the checklist below
  against your own Supabase project (this repo was built without a live
  project connected, so these are documented but not run against a real
  database):
  - [ ] Employee A cannot query Employee B's leave/WFH/attendance/tasks
  - [ ] An employee cannot change their own `role`, `status`, or `employee_code`
  - [ ] An employee can call `adjust_balance` for their own `employee_id` but gets rejected for anyone else's
  - [ ] An employee cannot call `admin_review_leave_request` (admin-only)
  - [ ] An unauthenticated request is rejected by every table's RLS policies
  - [ ] A deactivated (`INACTIVE`) employee loses API access, not just UI access
