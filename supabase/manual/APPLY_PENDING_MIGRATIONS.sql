-- ============================================================================
-- Consolidated catch-up script: everything from 20260912130000 onward.
--
-- Run this ONCE in the Supabase SQL Editor (paste the whole file, press Run).
--
-- Safe to re-run. Every statement is idempotent: columns use ADD COLUMN IF NOT
-- EXISTS, policies are dropped before being recreated, and the cleanup DELETEs
-- only ever match orphaned rows. Applying a migration that is already live is
-- a no-op, so there is no need to work out which ones you already ran.
--
-- Fixes, in order of why you are here:
--   1. master_staff.upi_id missing -> "Could not find the 'upi_id' column of
--      'master_staff' in the schema cache" on every member creation.
--   2. Orphaned auth users from the failed attempts -> false "username already
--      exists", and (worse) unscoped-admin resolution for those accounts.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- STEP 0. Report the damage before changing anything.
-- Read these NOTICEs in the SQL Editor output pane.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  orphan_users INT;
  orphan_profiles INT;
BEGIN
  SELECT COUNT(*) INTO orphan_users
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.master_staff s WHERE s.user_id = u.id);

  SELECT COUNT(*) INTO orphan_profiles
  FROM public.profiles p
  WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

  RAISE NOTICE 'BEFORE: % auth user(s) with no master_staff row.', orphan_users;
  RAISE NOTICE 'BEFORE: % profile row(s) with no auth user.', orphan_profiles;
END $$;


-- ---------------------------------------------------------------------------
-- STEP 1. Missing columns. This is the actual blocker.
-- ---------------------------------------------------------------------------

-- 20260912130000 -- gaon (village) on donations
ALTER TABLE public.samiti_donations
  ADD COLUMN IF NOT EXISTS village text;

-- 20260912140000 -- instalment log on donations
ALTER TABLE public.samiti_donations
  ADD COLUMN IF NOT EXISTS payments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 20260913120000 -- instalment log + updated_at on expenses
ALTER TABLE public.samiti_expenses
  ADD COLUMN IF NOT EXISTS payments jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.samiti_expenses
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 20260913130000 -- per-member UPI id.  <-- the one causing your error
ALTER TABLE public.master_staff
  ADD COLUMN IF NOT EXISTS upi_id TEXT;


-- ---------------------------------------------------------------------------
-- STEP 2. Retire the separate "tablet" role (20260913140000).
-- A tablet is now an ordinary collector with chooseCollectorName on.
-- ---------------------------------------------------------------------------
UPDATE public.master_staff AS s
SET workspace_permissions = (
  SELECT jsonb_object_agg(
    ws.key,
    CASE
      WHEN ws.value->>'accessLevel' = 'tablet' THEN
        jsonb_set(
          jsonb_set(ws.value, '{accessLevel}', '"collector"'::jsonb),
          '{modules,chooseCollectorName}',
          'true'::jsonb,
          true
        )
      ELSE ws.value
    END
  )
  FROM jsonb_each(s.workspace_permissions) AS ws(key, value)
)
WHERE workspace_permissions::text LIKE '%"tablet"%';

UPDATE public.master_staff
SET primary_role = 'collector'
WHERE primary_role = 'tablet';


-- ---------------------------------------------------------------------------
-- STEP 3. Revoke logins left behind by the old roster-only delete,
-- AND by the failed creation attempts you just hit (20260913150000).
-- ---------------------------------------------------------------------------

-- Profiles with no auth user behind them. These hold a username hostage:
-- create-user rejects any username that already has a profile, which is
-- exactly the false "username already exists" you saw.
DELETE FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- Stale role rows would grant their role to whoever next holds that user id.
DELETE FROM public.user_roles r
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = r.user_id
);

-- Roster rows whose auth user is gone: dead weight in the staff list.
DELETE FROM public.master_staff s
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = s.user_id
  );

-- Keep the two in step from here on. A trigger rather than an FK because
-- user_id is nullable and pre-backfill rows may hold unresolvable ids.
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  DELETE FROM public.master_staff WHERE user_id = OLD.id;
  RETURN OLD;
END;
$fn$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();


-- ---------------------------------------------------------------------------
-- STEP 4. Let managers write the staff roster (20260913160000).
-- create-user already lets a manager create worker accounts; without this the
-- roster INSERT was silently rejected, leaving a login that sees nothing.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin can manage staff" ON public.master_staff;
DROP POLICY IF EXISTS "Admin can update staff" ON public.master_staff;
DROP POLICY IF EXISTS "Admin can delete staff" ON public.master_staff;
DROP POLICY IF EXISTS "Admin/Manager can insert staff" ON public.master_staff;
DROP POLICY IF EXISTS "Admin/Manager can update staff" ON public.master_staff;
DROP POLICY IF EXISTS "Admin/Manager can delete staff" ON public.master_staff;

CREATE POLICY "Admin/Manager can insert staff" ON public.master_staff
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'manager') AND
      primary_role NOT IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin/Manager can update staff" ON public.master_staff
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'manager') AND
      primary_role NOT IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'manager') AND
      primary_role NOT IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin/Manager can delete staff" ON public.master_staff
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'manager') AND
      primary_role NOT IN ('admin', 'manager')
    )
  );


-- ---------------------------------------------------------------------------
-- STEP 5. Force PostgREST to reload. Without this the API keeps serving the
-- cached schema and you will STILL see "could not find the 'upi_id' column"
-- for several minutes after the column exists.
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';


-- ---------------------------------------------------------------------------
-- STEP 6. Report what is left.
--
-- Admin and manager accounts are EXCLUDED on purpose. They are *supposed* to
-- have no roster row — `fetchStaffCollectorInfo` reads a missing row for those
-- two roles as "genuine admin/manager, stays unscoped", and gates Master OS on
-- the Supabase role instead. Listing them here would point at your own login as
-- if it were damage, and deleting it would lock you out of the project.
--
-- What remains below is a worker/citizen login with no roster row: it can sign
-- in but resolves to NO_ACCESS_INFO, so it sees nothing and holds its username
-- hostage against re-creating the member.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  remaining INT;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM auth.users u
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  WHERE COALESCE(r.role::text, 'worker') NOT IN ('admin', 'manager')
    AND NOT EXISTS (SELECT 1 FROM public.master_staff s WHERE s.user_id = u.id);

  RAISE NOTICE 'AFTER: % orphaned worker login(s) with no master_staff row. Review them with the SELECT below.', remaining;
END $$;

SELECT
  u.id           AS auth_user_id,
  u.email        AS login_email,
  p.username     AS username,
  r.role         AS role,
  u.created_at   AS created_at
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE COALESCE(r.role::text, 'worker') NOT IN ('admin', 'manager')
  AND NOT EXISTS (SELECT 1 FROM public.master_staff s WHERE s.user_id = u.id)
ORDER BY u.created_at DESC;
