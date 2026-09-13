-- ============================================================================
-- Catch-up script: the shared-device संग्रहकर्ता fix (20260913170000).
--
-- Run this ONCE in the Supabase SQL Editor (paste the whole file, press Run).
--
-- WHY YOU ARE HERE
-- ----------------
-- On a shared pandal device (a collector account with the
-- `chooseCollectorName` permission), picking a co-member's name from the
-- संग्रहकर्ता list and saving fails with:
--
--     new row violates row-level security policy for table "samiti_donations"
--
-- The live INSERT policy still requires the receipt to be credited to the
-- signed-in account holder:
--     master_staff.user_id = auth.uid() AND master_staff.name = collector_name
--
-- APPLY_PENDING_MIGRATIONS.sql stopped at 20260913160000, so the widening
-- that teaches the database about shared devices was never applied. The
-- dropdown offers the name; the database rejects it. This closes that gap.
--
-- Safe to re-run: functions use CREATE OR REPLACE and policies are dropped
-- before being recreated. Applying it when it is already live is a no-op.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- STEP 0. Report what the policy looks like BEFORE changing anything.
-- Read this NOTICE in the SQL Editor output pane.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  already_fixed BOOLEAN;
  shared_devices INT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'samiti_donations'
      AND policyname = 'Workers can insert own workspace donations'
      AND with_check LIKE '%can_choose_collector_name%'
  ) INTO already_fixed;

  SELECT COUNT(*) INTO shared_devices
  FROM public.master_staff ms
  WHERE ms.workspace_permissions::text LIKE '%"chooseCollectorName": true%'
     OR ms.workspace_permissions::text LIKE '%"chooseCollectorName":true%';

  IF already_fixed THEN
    RAISE NOTICE 'BEFORE: insert policy ALREADY carries the shared-device rule. This run is a no-op.';
  ELSE
    RAISE NOTICE 'BEFORE: insert policy is the OLD one (own name only). This is the cause of the RLS error.';
  END IF;

  RAISE NOTICE 'BEFORE: % account(s) currently hold the chooseCollectorName permission.', shared_devices;
END $$;


-- ---------------------------------------------------------------------------
-- STEP 1. Let a collector read the roster of their own unit(s).
--
-- Without this the dropdown offers exactly one name (the account holder's),
-- because a worker's SELECT on master_staff was limited to user_id = auth.uid().
--
-- SECURITY DEFINER so the lookup is not itself filtered by the policy being
-- defined, which would recurse.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.shares_staff_workspace(_user_id UUID, _staff_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.master_staff me
    JOIN public.master_staff other ON other.id = _staff_id
    WHERE me.user_id = _user_id
      AND me.workspace_permissions ?| ARRAY(
        SELECT jsonb_object_keys(other.workspace_permissions)
      )
  )
$$;

DROP POLICY IF EXISTS "Admin/Manager can view staff" ON public.master_staff;
DROP POLICY IF EXISTS "Staff can view own unit roster" ON public.master_staff;

CREATE POLICY "Staff can view own unit roster" ON public.master_staff
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    user_id = auth.uid() OR
    public.shares_staff_workspace(auth.uid(), id)
  );


-- ---------------------------------------------------------------------------
-- STEP 2. Let a shared device SAVE a receipt under the name it just picked.
--
-- Gated on `chooseCollectorName`, which is what marks an account as a shared
-- pandal device. An ordinary collector account is unaffected: their entries
-- stay locked to their own name, exactly as before.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_choose_collector_name(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.master_staff ms,
         jsonb_each(ms.workspace_permissions) AS perm(ws_id, ws)
    WHERE ms.user_id = _user_id
      AND (ws -> 'modules' ->> 'chooseCollectorName')::boolean IS TRUE
  )
$$;

-- Is `_name` a registered, active member of a unit the caller belongs to?
-- Keeps the guarantee that a receipt always credits a real roster member --
-- a shared device may pick any co-member, but never an arbitrary string.
CREATE OR REPLACE FUNCTION public.is_collector_name_in_my_unit(_user_id UUID, _name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.master_staff other
    WHERE other.name = _name
      AND other.status = 'active'
      AND public.shares_staff_workspace(_user_id, other.id)
  )
$$;

DROP POLICY IF EXISTS "Workers can insert own workspace donations" ON public.samiti_donations;

CREATE POLICY "Workers can insert own workspace donations" ON public.samiti_donations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'worker') AND
    event_id IN (
      SELECT id FROM public.samiti_events
      WHERE entity_id IN (SELECT public.get_staff_workspace_ids(auth.uid()))
    ) AND
    (
      -- Own name: the ordinary collector account.
      EXISTS (
        SELECT 1 FROM public.master_staff ms
        WHERE ms.user_id = auth.uid() AND ms.name = samiti_donations.collector_name
      )
      OR
      -- Shared device: any active co-member of the caller's unit.
      (
        public.can_choose_collector_name(auth.uid()) AND
        public.is_collector_name_in_my_unit(auth.uid(), samiti_donations.collector_name)
      )
    )
  );

-- UPDATE stays as it is: a shared device may record a receipt for a co-member,
-- but editing someone else's entry afterwards remains off-limits.


-- ---------------------------------------------------------------------------
-- STEP 3. Verify. Both rows below must report OK.
-- ---------------------------------------------------------------------------
SELECT
  'donations insert policy' AS check_name,
  CASE WHEN with_check LIKE '%can_choose_collector_name%'
       THEN 'OK - shared devices may credit co-members'
       ELSE 'FAILED - still the old own-name-only rule'
  END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'samiti_donations'
  AND policyname = 'Workers can insert own workspace donations'

UNION ALL

SELECT
  'staff roster select policy' AS check_name,
  CASE WHEN qual LIKE '%shares_staff_workspace%'
       THEN 'OK - collectors can read their unit roster'
       ELSE 'FAILED - roster still limited to own row'
  END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'master_staff'
  AND policyname = 'Staff can view own unit roster';
