-- ==============================================================================
-- Workers must be able to READ the full chanda register of the unit they are
-- assigned to, so a collector can verify who has already donated before going
-- out to collect again (and avoid asking the same household twice).
--
-- The previous SELECT policy additionally required
--     master_staff.name = samiti_donations.collector_name
-- which limited a worker to only the rows they personally recorded. That made
-- the register look completely empty for a newly created member and made
-- duplicate collection impossible to detect.
--
-- Read is widened to the worker's assigned workspace(s).
-- Write (INSERT/UPDATE) intentionally stays restricted to their own entries,
-- so a collector still cannot alter someone else's collection record.
--
-- samiti_entities / samiti_events already allow SELECT for any non-citizen
-- ("Team can view entities" / "Team can view events"), so the event_id subquery
-- below resolves correctly for workers without further policy changes.
-- ==============================================================================

DROP POLICY IF EXISTS "Workers can view own workspace donations" ON public.samiti_donations;

CREATE POLICY "Workers can view own workspace donations" ON public.samiti_donations
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    event_id IN (
      SELECT id FROM public.samiti_events
      WHERE entity_id IN (SELECT public.get_staff_workspace_ids(auth.uid()))
    )
  );
