-- ==============================================================================
-- Let a collector read the roster of their own unit(s).
--
-- The `chooseCollectorName` permission exists for a device several members share
-- at the pandal: the संग्रहकर्ता is picked from the registered name list on every
-- receipt. But "Admin/Manager can view staff" limits a worker's SELECT on
-- master_staff to `user_id = auth.uid()` — their own row and nothing else.
--
-- So the permission was granted and the dropdown still offered exactly one name:
-- the account holder's. The shared device could only ever credit itself, which
-- is the situation the permission was meant to end.
--
-- A collector may now read the rows of members who share a workspace with them.
-- That is the same set of people whose names they must be able to credit, and no
-- wider: members of other units stay invisible.
-- ==============================================================================

-- Do the caller and the given roster row share at least one workspace?
-- SECURITY DEFINER so the lookup is not itself filtered by the policy being
-- defined, which would recurse.
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

CREATE POLICY "Staff can view own unit roster" ON public.master_staff
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    user_id = auth.uid() OR
    public.shares_staff_workspace(auth.uid(), id)
  );

-- ==============================================================================
-- Second half of the same fix: let a shared device SAVE a receipt under the
-- name it just picked.
--
-- "Workers can insert own workspace donations" requires
--     master_staff.user_id = auth.uid() AND master_staff.name = collector_name
-- i.e. the receipt must be credited to the signed-in account holder. With the
-- roster now readable, the operator could pick a co-member's name and still be
-- rejected on save. The dropdown and the database have to agree.
--
-- The widening is gated on the `chooseCollectorName` permission, which is what
-- marks an account as a shared pandal device. An ordinary collector account is
-- unaffected: their entries stay locked to their own name, as before.
-- ==============================================================================

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
-- Keeps the guarantee that a receipt always credits a real roster member —
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
