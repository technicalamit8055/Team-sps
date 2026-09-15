-- ==============================================================================
-- Let a member with the Expense Manager module actually record expenses.
--
-- The access matrix has had an "Expense Manager" tick since the module map was
-- introduced, and the app respects it: `ExpenseManager` renders the voucher
-- form for anyone whose `modules.expenses` is true, and `addExpense` has no
-- permission gate of its own. The write then died in the database.
--
-- `20260911185203_fix_rls_policies.sql` gave `samiti_expenses` exactly two
-- policies -- admin/manager get FOR ALL, workers get FOR SELECT -- so a worker
-- could read every voucher in their workspace but never insert or update one.
-- That is why the admin's entry appeared in the member's account (the SELECT
-- policy passes) while the member's own save vanished: `saveExpenseToCloud`
-- logs the RLS rejection with `console.warn` and returns, so the optimistic row
-- sat in local state, showed a success toast, and disappeared on reload.
--
-- The donation policies already model the fix: workers get their own INSERT and
-- UPDATE policies, scoped to the workspaces in their roster row. Expenses need
-- the same, with one extra condition -- the member must hold the `expenses`
-- module for that workspace, so the matrix checkbox is enforced server-side
-- rather than only hidden in the UI.
--
-- Deliberately NOT granted: DELETE, and reducing a figure already on the books.
-- Those stay with admins, matching `editFinalizedAmounts` in `ModuleAccess`.
-- A member can raise `amount_paid` (बकाया जमा) but never lower it.
--
-- Idempotent: safe to re-run.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Does this member hold a given module in a given workspace?
--
-- Mirrors `currentModuleAccess` in SamitiContext: the level's default is the
-- base layer, and an explicit tick in `modules` overrides it. Kept SECURITY
-- DEFINER like `get_staff_workspace_ids` so the policy can read the roster row
-- without `master_staff`'s own policies recursing.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_has_module(
  _user_id UUID,
  _workspace_id TEXT,
  _module TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- An explicit tick (or untick) in the matrix always wins. Compared against
    -- a jsonb literal rather than cast: the value is only ever a JSON boolean,
    -- and this yields NULL (falling through to the level default) for a key the
    -- matrix never wrote, instead of erroring on an unexpected shape.
    CASE WHEN perm -> 'modules' -> _module = 'true'::jsonb THEN true
         WHEN perm -> 'modules' -> _module = 'false'::jsonb THEN false
    END,
    -- Otherwise fall back to the access level's default for this module.
    CASE perm ->> 'accessLevel'
      WHEN 'full_control' THEN true
      WHEN 'editor'       THEN true
      WHEN 'viewer'       THEN true
      ELSE false
    END,
    false
  )
  FROM public.master_staff ms
  CROSS JOIN LATERAL (
    SELECT ms.workspace_permissions -> _workspace_id AS perm
  ) p
  WHERE ms.user_id = _user_id
    AND ms.status = 'active'
    AND ms.workspace_permissions ? _workspace_id
  LIMIT 1
$$;

COMMENT ON FUNCTION public.staff_has_module(UUID, TEXT, TEXT) IS
  'True when the staff member linked to _user_id holds _module in _workspace_id, resolving an explicit matrix tick over the access level default.';

-- ------------------------------------------------------------------------------
-- Workers may create expense vouchers where they hold the Expense Manager
-- module. Scoped through the event, the same way the donation policies are.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Workers can insert workspace expenses" ON public.samiti_expenses;
CREATE POLICY "Workers can insert workspace expenses" ON public.samiti_expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'worker') AND
    EXISTS (
      SELECT 1 FROM public.samiti_events se
      WHERE se.id = samiti_expenses.event_id
        AND public.staff_has_module(auth.uid(), se.entity_id, 'expenses')
    )
  );

-- ------------------------------------------------------------------------------
-- Workers may amend a voucher in the same workspaces.
--
-- Note this policy cannot itself enforce `editFinalizedAmounts`: a WITH CHECK
-- clause only ever sees the incoming row, never the one it replaces, so it has
-- no way to tell a top-up from a reduction. That comparison needs OLD, which
-- means a trigger -- added below.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Workers can update workspace expenses" ON public.samiti_expenses;
CREATE POLICY "Workers can update workspace expenses" ON public.samiti_expenses
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    EXISTS (
      SELECT 1 FROM public.samiti_events se
      WHERE se.id = samiti_expenses.event_id
        AND public.staff_has_module(auth.uid(), se.entity_id, 'expenses')
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'worker') AND
    EXISTS (
      SELECT 1 FROM public.samiti_events se
      WHERE se.id = samiti_expenses.event_id
        AND public.staff_has_module(auth.uid(), se.entity_id, 'expenses')
    )
  );

-- ------------------------------------------------------------------------------
-- Keep `editFinalizedAmounts` honest for real, in the one place that can see
-- both the old and the new row. Until now this rule lived only in
-- `updateExpense` in the client, so it held for the app's own form and for
-- nothing else.
--
-- Admins and managers are untouched: correcting the books is exactly their job.
-- For anyone else the bill total is frozen and the paid figure may only move
-- upward (बकाया जमा), so a mistyped voucher still has to go to an admin.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_expense_finalized_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') THEN
    RETURN NEW;
  END IF;

  IF NEW.total_amount <> OLD.total_amount THEN
    RAISE EXCEPTION
      'Only an admin may change a recorded bill total (voucher %): % -> %',
      OLD.voucher_no, OLD.total_amount, NEW.total_amount
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.amount_paid < OLD.amount_paid THEN
    RAISE EXCEPTION
      'Amount paid may only increase (voucher %): % -> %',
      OLD.voucher_no, OLD.amount_paid, NEW.amount_paid
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_expense_finalized_amounts ON public.samiti_expenses;
CREATE TRIGGER trg_guard_expense_finalized_amounts
  BEFORE UPDATE ON public.samiti_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_expense_finalized_amounts();
