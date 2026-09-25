-- Secure admin bootstrap (§5).
--
-- The app deliberately has no "become admin" button anywhere in the UI —
-- the very first admin must be created by hand, once, directly in Supabase.
--
-- Steps:
--   1. In the Supabase dashboard: Authentication → Users → Add user.
--      Create the admin's login with a real email + password.
--   2. Copy that user's UUID (shown in the Users table).
--   3. Fill in the values below and run this file in the SQL editor
--      (or `supabase db execute -f supabase/seed/000_first_admin.sql`).
--
-- After this, the admin can create every other employee from the app itself
-- (Employees → Add Employee), which calls the create-employee Edge Function.

insert into employees (
  auth_user_id,
  employee_code,
  full_name,
  email,
  role,
  status
) values (
  '00000000-0000-0000-0000-000000000000', -- <- paste the auth.users UUID here
  'EMP-0001',                              -- <- pick the admin's employee code
  'Admin Name',                            -- <- admin's display name
  'admin@example.com',                     -- <- must match the auth user's email
  'ADMIN',
  'ACTIVE'
);
