-- Let managers write the staff roster, matching what they may already do.
--
-- `create-user` has always allowed a manager to create worker/citizen accounts,
-- but the `master_staff` INSERT policy required `admin`. A manager creating a
-- member therefore got the login created (the edge function runs as the service
-- role and bypasses RLS) while the roster row was silently rejected.
--
-- That row is not bookkeeping — it is the member's access. Every worker policy
-- resolves permissions through `get_staff_workspace_ids(auth.uid())`, which
-- looks the caller up in `master_staff` by `user_id`. With no row, the account
-- signs in but resolves to zero workspaces: the chanda register, entities and
-- events all read empty, and the member vanishes from the staff list on the
-- next sync.
--
-- Managers are already trusted to create these accounts, so they are allowed to
-- maintain the matching roster rows. Admin-only control is kept for the rows
-- that could escalate privilege.

DROP POLICY IF EXISTS "Admin can manage staff" ON public.master_staff;
DROP POLICY IF EXISTS "Admin can update staff" ON public.master_staff;
DROP POLICY IF EXISTS "Admin can delete staff" ON public.master_staff;

-- INSERT: admins freely; managers only for non-admin/manager members, mirroring
-- the restriction create-user enforces on the login itself.
CREATE POLICY "Admin/Manager can insert staff" ON public.master_staff
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'manager') AND
      primary_role NOT IN ('admin', 'manager')
    )
  );

-- UPDATE: same split. WITH CHECK is set as well as USING, so a manager cannot
-- edit a member they may touch into an admin/manager they may not.
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

-- Repair members already created through the broken path: the login exists and
-- has a profile, but no roster row was ever written, so the account can sign in
-- and see nothing. There is no way to recover their intended unit assignment or
-- permissions from here — that has to be set in the access matrix — so this only
-- reports them. Re-saving the member in the admin panel writes the row.
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id
  WHERE r.role NOT IN ('admin', 'manager')
    AND NOT EXISTS (
      SELECT 1 FROM public.master_staff s WHERE s.user_id = p.id
    );

  IF orphan_count > 0 THEN
    RAISE NOTICE
      'Found % login(s) with no master_staff row. These accounts can sign in but see no data; re-save each member in the admin panel to restore their unit and permissions.',
      orphan_count;
  END IF;
END $$;
