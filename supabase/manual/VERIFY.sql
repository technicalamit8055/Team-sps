-- ============================================================================
-- Verification. Run AFTER DELETE_NIRAJ04.sql, in its own tab.
--
-- Run these ONE AT A TIME (select a block, press Run). The SQL Editor shows
-- only the last statement's grid, which is what made the previous run look
-- like nothing had happened.
-- ============================================================================


-- (A) Is the upi_id column there?  Expect exactly one row: upi_id | text
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'master_staff'
  AND column_name  = 'upi_id';


-- (B) Is niraj04 gone from auth?  Expect 0 rows.
SELECT id, email FROM auth.users WHERE email ILIKE 'niraj04%';


-- (C) Is the username free in profiles?  Expect 0 rows.
--     This is the table create-user checks, so a row here is what produces
--     "username already exists".
SELECT id, username FROM public.profiles WHERE username ILIKE 'niraj04';


-- (D) Any remaining orphaned worker logins?  Expect 0 rows.
--     admin/manager are excluded on purpose: a missing roster row is correct
--     for those two roles.
SELECT
  u.id       AS auth_user_id,
  u.email    AS login_email,
  p.username,
  r.role
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE COALESCE(r.role::text, 'worker') NOT IN ('admin', 'manager')
  AND NOT EXISTS (SELECT 1 FROM public.master_staff s WHERE s.user_id = u.id);


-- (E) Sanity: your admin login must still exist. Expect 1 row.
--     If this is ever empty, stop — do not delete anything further.
SELECT u.email, p.username, r.role
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.role::text IN ('admin', 'manager');
