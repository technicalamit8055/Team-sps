-- ==============================================================================
-- Let a collector edit any donation in the unit(s) they are assigned to, not
-- only the receipts credited to their own name.
--
-- "Workers can update own donations" required
--     master_staff.user_id = auth.uid() AND master_staff.name = collector_name
-- so an edit was refused unless the row was credited to the signed-in account
-- holder. Two situations hit that wall routinely:
--
--   * A shared pandal device records a receipt under a co-member's name --
--     permitted on INSERT since 20260913170000 -- and then cannot correct a
--     typo in the donor's name on the very row it just wrote.
--   * A member is renamed on the roster. Existing rows keep the old string, so
--     the equality stops matching and their own history becomes read-only.
--
-- The failure surfaced as
--     new row violates row-level security policy (USING expression)
-- because saveDonationToCloud writes with .upsert(), i.e.
-- INSERT ... ON CONFLICT DO UPDATE, which is checked against this policy.
--
-- Edit rights are now scoped to the workspace instead of the collector name,
-- matching the SELECT policy widened in 20260912120000: a worker may edit
-- exactly the register they can already read. Rows belonging to other units
-- stay untouchable.
-- ==============================================================================

DROP POLICY IF EXISTS "Workers can update own donations" ON public.samiti_donations;

CREATE POLICY "Workers can update unit donations" ON public.samiti_donations
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    event_id IN (
      SELECT id FROM public.samiti_events
      WHERE entity_id IN (SELECT public.get_staff_workspace_ids(auth.uid()))
    )
  )
  -- WITH CHECK is required as well: without it Postgres reuses the USING
  -- expression for the post-update row, and an edit that legitimately moves a
  -- row would be rejected with the same opaque message this migration fixes.
  -- The edited row must still land inside the caller's workspace, so a worker
  -- cannot push a record out of their own unit.
  WITH CHECK (
    public.has_role(auth.uid(), 'worker') AND
    event_id IN (
      SELECT id FROM public.samiti_events
      WHERE entity_id IN (SELECT public.get_staff_workspace_ids(auth.uid()))
    )
  );
