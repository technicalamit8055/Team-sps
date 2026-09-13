-- ============================================================================
-- Step 3: remove the orphaned worker login left behind by the failed attempts.
--
-- Run AFTER APPLY_PENDING_MIGRATIONS.sql.
--
-- Only worker/citizen logins are touched. Admin and manager accounts are meant
-- to have no master_staff row (fetchStaffCollectorInfo reads a missing row for
-- those roles as "genuine admin, stays unscoped"), so deleting one would lock
-- you out of your own project. The WHERE clause below excludes them.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Confirm the blocker is actually gone before anything else.
--    Expect one row: upi_id | text
-- ---------------------------------------------------------------------------
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'master_staff'
  AND column_name  = 'upi_id';


-- ---------------------------------------------------------------------------
-- 2. Preview exactly what step 3 will delete. Read this before running it.
--    Expect the niraj04 row, and NOT adminteamsps.
-- ---------------------------------------------------------------------------
SELECT
  u.id         AS auth_user_id,
  u.email      AS login_email,
  p.username   AS username,
  r.role       AS role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE COALESCE(r.role::text, 'worker') NOT IN ('admin', 'manager')
  AND NOT EXISTS (SELECT 1 FROM public.master_staff s WHERE s.user_id = u.id)
ORDER BY u.created_at DESC;


-- ---------------------------------------------------------------------------
-- 3. Delete them.
--
-- The ids are collected into a temp table first so all three deletes act on the
-- same fixed set. Once auth.users rows are gone, the "orphan" predicate can no
-- longer identify them.
--
-- profiles is NOT assumed to cascade. The original migration declared
-- `profiles.id REFERENCES auth.users(id) ON DELETE CASCADE`, but
-- 20260911_complete_master_schema.sql recreates it with a plain
-- `gen_random_uuid()` primary key and no foreign key. Because that uses
-- CREATE TABLE IF NOT EXISTS, which definition is live depends on the order
-- this project was built in — so the profile row is deleted explicitly. That
-- is the row holding the username hostage, and leaving it behind would keep
-- reproducing "username already exists".
-- ---------------------------------------------------------------------------
-- Wrapped in a DO block so the id list is a local variable living for the whole
-- operation. A temp table would not survive: the SQL Editor commits after each
-- statement, so an ON COMMIT DROP table is gone before the deletes can use it.
DO $$
DECLARE
  orphan_ids UUID[];
BEGIN
  SELECT array_agg(u.id) INTO orphan_ids
  FROM auth.users u
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  WHERE COALESCE(r.role::text, 'worker') NOT IN ('admin', 'manager')
    AND NOT EXISTS (SELECT 1 FROM public.master_staff s WHERE s.user_id = u.id);

  IF orphan_ids IS NULL THEN
    RAISE NOTICE 'No orphaned worker logins. Nothing to delete.';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting % orphaned login(s).', array_length(orphan_ids, 1);

  DELETE FROM public.master_staff WHERE user_id = ANY(orphan_ids);
  DELETE FROM public.user_roles   WHERE user_id = ANY(orphan_ids);
  DELETE FROM public.profiles     WHERE id      = ANY(orphan_ids);
  DELETE FROM auth.users          WHERE id      = ANY(orphan_ids);
END $$;

-- A profile can also be orphaned on its own — created by a failed attempt whose
-- auth user never existed or was already removed by hand. It still occupies the
-- username, so it goes too.
DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);


-- ---------------------------------------------------------------------------
-- 4. Confirm. Both should return 0 rows.
-- ---------------------------------------------------------------------------
SELECT u.email, p.username
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE COALESCE(r.role::text, 'worker') NOT IN ('admin', 'manager')
  AND NOT EXISTS (SELECT 1 FROM public.master_staff s WHERE s.user_id = u.id);

-- The username must be free in `profiles` too — create-user checks there.
SELECT id, username FROM public.profiles WHERE username ILIKE 'niraj04';
