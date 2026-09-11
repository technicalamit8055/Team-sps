-- ==============================================================================
-- FIX RLS POLICIES: replace the "Public access" USING (true) policies introduced
-- by 20260911_complete_master_schema.sql with real role- and ownership-based
-- policies. That migration enabled RLS on every table but then granted
-- unrestricted read/write to anyone holding the public anon key, undoing all
-- of the role-based policies built up in earlier migrations.
--
-- Prerequisite: this migration must be applied AFTER existing master_staff rows
-- have been linked to real Supabase Auth accounts (see the one-time staff
-- migration script) — otherwise the 3 seeded demo accounts, which currently
-- authenticate via a client-side fallback with no real auth.uid(), will lose
-- all access once these policies take effect.
-- ==============================================================================

-- 1. Link master_staff rows to real Supabase Auth users.
ALTER TABLE public.master_staff
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_master_staff_user_id ON public.master_staff(user_id);

-- 1a. Role-check helper functions. These were defined in an earlier migration
--     (20251205103923_...sql) that — it turns out — was never actually applied
--     to this live project (only 20260911_complete_master_schema.sql was, which
--     created the app_role enum and user_roles table but not these functions).
--     Defined here defensively with CREATE OR REPLACE so this migration is safe
--     to run regardless of what has or hasn't been applied before it.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 2. Helper: workspace (entity) IDs a staff member has any permission for.
--    Used only for coarse "is this worker's own entity" row-ownership checks —
--    fine-grained module permissions (analytics/export/etc.) remain UI-only.
CREATE OR REPLACE FUNCTION public.get_staff_workspace_ids(_user_id UUID)
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_object_keys(workspace_permissions)
  FROM public.master_staff
  WHERE user_id = _user_id
$$;

-- 3. Drop every blanket "Public access <table>" policy from the Sept-11 migration.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'samiti_entities', 'samiti_events', 'samiti_donations', 'samiti_expenses',
    'samiti_cash_handovers', 'master_staff', 'voters', 'expenses', 'tasks',
    'events', 'booths', 'influencers', 'inventory', 'activities',
    'campaign_settings', 'candidate_profile', 'social_links', 'schemes',
    'campaign_ads', 'grievances', 'profiles', 'user_roles', 'voter_conversions',
    'worker_rewards'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access %s" ON public.%I', t, t);
  END LOOP;
END $$;

-- ==============================================================================
-- 4. Restore the pre-regression policies (from 20251205103923_...sql), which
--    the blanket drop-and-recreate loop above superseded but did not restore.
-- ==============================================================================

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Managers can view worker/citizen profiles" ON public.profiles;
CREATE POLICY "Managers can view worker/citizen profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager') AND
    id IN (SELECT user_id FROM public.user_roles WHERE role IN ('worker', 'citizen'))
  );

DROP POLICY IF EXISTS "Managers can create worker/citizen profiles" ON public.profiles;
CREATE POLICY "Managers can create worker/citizen profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admin/Manager/Worker can view voters" ON public.voters;
CREATE POLICY "Admin/Manager/Worker can view voters" ON public.voters
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'worker')
  );

DROP POLICY IF EXISTS "Admin/Manager can manage voters" ON public.voters;
CREATE POLICY "Admin/Manager can manage voters" ON public.voters
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Workers can update assigned voters" ON public.voters;
CREATE POLICY "Workers can update assigned voters" ON public.voters
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    assigned_worker_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admin/Manager can manage expenses" ON public.expenses;
CREATE POLICY "Admin/Manager can manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Workers can view expenses" ON public.expenses;
CREATE POLICY "Workers can view expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'worker'));

DROP POLICY IF EXISTS "Authenticated users can view active schemes" ON public.schemes;
CREATE POLICY "Authenticated users can view active schemes" ON public.schemes
  FOR SELECT TO authenticated
  USING (is_active = true AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin can manage schemes" ON public.schemes;
CREATE POLICY "Admin can manage schemes" ON public.schemes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view active ads" ON public.campaign_ads;
CREATE POLICY "Authenticated users can view active ads" ON public.campaign_ads
  FOR SELECT TO authenticated
  USING (is_active = true AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin can manage ads" ON public.campaign_ads;
CREATE POLICY "Admin can manage ads" ON public.campaign_ads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin/Manager can manage tasks" ON public.tasks;
CREATE POLICY "Admin/Manager can manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Workers can view/update their tasks" ON public.tasks;
CREATE POLICY "Workers can view/update their tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "Workers can update their tasks" ON public.tasks;
CREATE POLICY "Workers can update their tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "Team can view events" ON public.events;
CREATE POLICY "Team can view events" ON public.events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'worker')
  );

DROP POLICY IF EXISTS "Admin/Manager can manage events" ON public.events;
CREATE POLICY "Admin/Manager can manage events" ON public.events
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Users can submit grievances" ON public.grievances;
CREATE POLICY "Users can submit grievances" ON public.grievances
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Users can view their own grievances" ON public.grievances;
CREATE POLICY "Users can view their own grievances" ON public.grievances
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Admin/Manager can manage all grievances" ON public.grievances;
CREATE POLICY "Admin/Manager can manage all grievances" ON public.grievances
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Workers can view own conversions" ON public.voter_conversions;
CREATE POLICY "Workers can view own conversions" ON public.voter_conversions
  FOR SELECT USING (
    worker_id = auth.uid() AND public.has_role(auth.uid(), 'worker')
  );

DROP POLICY IF EXISTS "Admin/Manager can view all conversions" ON public.voter_conversions;
CREATE POLICY "Admin/Manager can view all conversions" ON public.voter_conversions
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Team can insert conversions" ON public.voter_conversions;
CREATE POLICY "Team can insert conversions" ON public.voter_conversions
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'worker') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Workers can view own rewards" ON public.worker_rewards;
CREATE POLICY "Workers can view own rewards" ON public.worker_rewards
  FOR SELECT USING (
    worker_id = auth.uid() AND public.has_role(auth.uid(), 'worker')
  );

DROP POLICY IF EXISTS "Admin/Manager can view all rewards" ON public.worker_rewards;
CREATE POLICY "Admin/Manager can view all rewards" ON public.worker_rewards
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Admin can manage rewards" ON public.worker_rewards;
CREATE POLICY "Admin can manage rewards" ON public.worker_rewards
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ==============================================================================
-- 5. New policies for the samiti (festival/donation ledger) tables.
-- ==============================================================================

-- Entities & events: any authenticated non-citizen can read; only admin/manager write.
CREATE POLICY "Team can view entities" ON public.samiti_entities
  FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(), 'citizen'));

CREATE POLICY "Admin/Manager can manage entities" ON public.samiti_entities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin/Manager can update entities" ON public.samiti_entities
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin/Manager can delete entities" ON public.samiti_entities
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Team can view events" ON public.samiti_events
  FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(), 'citizen'));

CREATE POLICY "Admin/Manager can manage samiti events" ON public.samiti_events
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- Donations: admin/manager see & manage everything; workers only their own
-- entity's rows, and only rows attributed to their own staff name.
CREATE POLICY "Admin/Manager can manage donations" ON public.samiti_donations
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Workers can view own workspace donations" ON public.samiti_donations
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    event_id IN (
      SELECT id FROM public.samiti_events
      WHERE entity_id IN (SELECT public.get_staff_workspace_ids(auth.uid()))
    ) AND
    EXISTS (
      SELECT 1 FROM public.master_staff ms
      WHERE ms.user_id = auth.uid() AND ms.name = samiti_donations.collector_name
    )
  );

CREATE POLICY "Workers can insert own workspace donations" ON public.samiti_donations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'worker') AND
    event_id IN (
      SELECT id FROM public.samiti_events
      WHERE entity_id IN (SELECT public.get_staff_workspace_ids(auth.uid()))
    ) AND
    EXISTS (
      SELECT 1 FROM public.master_staff ms
      WHERE ms.user_id = auth.uid() AND ms.name = samiti_donations.collector_name
    )
  );

CREATE POLICY "Workers can update own donations" ON public.samiti_donations
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    EXISTS (
      SELECT 1 FROM public.master_staff ms
      WHERE ms.user_id = auth.uid() AND ms.name = samiti_donations.collector_name
    )
  );

-- Expenses & cash handovers: admin/manager manage; workers read-only for their workspace.
CREATE POLICY "Admin/Manager can manage samiti expenses" ON public.samiti_expenses
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Workers can view own workspace expenses" ON public.samiti_expenses
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    event_id IN (
      SELECT id FROM public.samiti_events
      WHERE entity_id IN (SELECT public.get_staff_workspace_ids(auth.uid()))
    )
  );

CREATE POLICY "Admin/Manager can manage cash handovers" ON public.samiti_cash_handovers
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Workers can view own workspace handovers" ON public.samiti_cash_handovers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    event_id IN (
      SELECT id FROM public.samiti_events
      WHERE entity_id IN (SELECT public.get_staff_workspace_ids(auth.uid()))
    )
  );

-- Staff directory: admin/manager see everyone; a staff member can see their own
-- row. Only admins may create/modify/delete staff records (closes the hole
-- where any reachable user could grant themselves admin/full_control).
CREATE POLICY "Admin/Manager can view staff" ON public.master_staff
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    user_id = auth.uid()
  );

CREATE POLICY "Admin can manage staff" ON public.master_staff
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update staff" ON public.master_staff
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete staff" ON public.master_staff
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==============================================================================
-- 6. Remaining tables with no prior bespoke policy: admin/manager manage;
--    read scoped appropriately per table's purpose.
-- ==============================================================================

CREATE POLICY "Admin/Manager can manage booths" ON public.booths
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Team can view booths" ON public.booths
  FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(), 'citizen'));

CREATE POLICY "Admin/Manager can manage influencers" ON public.influencers
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Team can view influencers" ON public.influencers
  FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(), 'citizen'));

CREATE POLICY "Admin/Manager can manage inventory" ON public.inventory
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Team can view inventory" ON public.inventory
  FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(), 'citizen'));

CREATE POLICY "Admin/Manager can manage activities" ON public.activities
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Team can view activities" ON public.activities
  FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(), 'citizen'));

CREATE POLICY "Admin can manage campaign settings" ON public.campaign_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Team can view campaign settings" ON public.campaign_settings
  FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(), 'citizen'));

-- candidate_profile / social_links: the public landing page (LandingPage.tsx)
-- reads these WITHOUT authentication by design (it's a public contact/linktree
-- page), so anonymous SELECT of active rows must remain allowed. Only the
-- exploit path (anonymous INSERT/UPDATE/DELETE) is closed here.
CREATE POLICY "Public can view active candidate profile" ON public.candidate_profile
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin/Manager can manage candidate profile" ON public.candidate_profile
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin/Manager can update candidate profile" ON public.candidate_profile
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin/Manager can delete candidate profile" ON public.candidate_profile
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Public can view active social links" ON public.social_links
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin/Manager can manage social links" ON public.social_links
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin/Manager can update social links" ON public.social_links
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin/Manager can delete social links" ON public.social_links
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- ==============================================================================
-- 7. Defense-in-depth: reject negative/invalid ledger amounts at the DB level,
--    independent of client-side validation.
-- ==============================================================================

ALTER TABLE public.samiti_donations
  DROP CONSTRAINT IF EXISTS chk_donation_amounts_nonneg;
ALTER TABLE public.samiti_donations
  ADD CONSTRAINT chk_donation_amounts_nonneg
  CHECK (accepted_amount >= 0 AND received_amount >= 0 AND balance_amount >= 0);

ALTER TABLE public.samiti_expenses
  DROP CONSTRAINT IF EXISTS chk_expense_amounts_nonneg;
ALTER TABLE public.samiti_expenses
  ADD CONSTRAINT chk_expense_amounts_nonneg
  CHECK (total_amount >= 0 AND amount_paid >= 0 AND balance_due >= 0);
