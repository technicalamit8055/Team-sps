-- Clean up logins left behind by the old roster-only delete.
--
-- Until now, removing a member from the admin panel deleted only their
-- `master_staff` row. The Supabase Auth user, profile and role row survived, so
-- the account kept working: the credentials still signed in, and because
-- `fetchStaffCollectorInfo` reads a missing roster row as "this is a genuine
-- admin", the removed member came back *unscoped* rather than restricted.
--
-- Deletion now goes through the `delete-user` edge function, which tears down
-- the auth user together with the roster row. This migration deals with the
-- accounts already orphaned by the old path.

-- 1. Drop profiles that no longer have an auth user behind them. These would
--    otherwise keep the username occupied, blocking re-creation of the member
--    (create-user rejects a username that already has a profile).
DELETE FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- 2. Same for role rows: a stale row would grant its role to whoever ends up
--    holding that user id.
DELETE FROM public.user_roles r
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = r.user_id
);

-- 3. Roster rows whose linked auth user is gone. The account cannot sign in
--    any more, so the row is dead weight that only clutters the staff list.
DELETE FROM public.master_staff s
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = s.user_id
  );

-- 4. Keep the two in step from here on: if an auth user is ever deleted
--    directly (Supabase dashboard, SQL, or a future code path that forgets the
--    roster), the roster row goes with it instead of lingering as an account
--    that looks live in the admin panel.
--
--    Written as a trigger rather than a foreign key: `user_id` is nullable and
--    pre-backfill rows may hold ids that no longer resolve, so adding an FK
--    could fail validation on existing data.
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.master_staff WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();
