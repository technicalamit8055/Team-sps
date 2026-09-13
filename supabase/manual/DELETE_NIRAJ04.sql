-- ============================================================================
-- Delete the Niraj04 orphan. ONE statement, so it cannot be partially run.
--
-- WHY THE LAST ATTEMPT DID NOTHING
-- The Supabase SQL Editor runs the SELECTED text when there is a selection,
-- and the result grid shows only the LAST statement that ran. The row you saw
-- was the section-2 preview, not the section-4 confirmation — so most likely
-- the DO block in section 3 was never executed.
--
-- HOW TO RUN THIS
-- Open a NEW query tab, paste ONLY this file, click Run with nothing selected.
-- Do not select part of it.
-- ============================================================================

DO $$
DECLARE
  v_id UUID;
  v_role TEXT;
BEGIN
  -- Resolve by username from profiles, falling back to the auth email, so it
  -- works whichever of the two rows still exists.
  SELECT u.id INTO v_id
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.username ILIKE 'niraj04'
     OR u.email ILIKE 'niraj04@victory.local'
  LIMIT 1;

  IF v_id IS NULL THEN
    RAISE NOTICE 'No auth user for niraj04. Checking for a leftover profile row...';
    DELETE FROM public.profiles WHERE username ILIKE 'niraj04';
    RAISE NOTICE 'Removed % leftover profile row(s).', 1;
    RETURN;
  END IF;

  -- Refuse to touch an admin or manager. Deleting one of those would lock you
  -- out; niraj04 is a worker, so this guard should never trip here.
  SELECT r.role::text INTO v_role
  FROM public.user_roles r WHERE r.user_id = v_id LIMIT 1;

  IF v_role IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Refusing to delete % which has role %.', v_id, v_role;
  END IF;

  RAISE NOTICE 'Deleting auth user % (role %).', v_id, COALESCE(v_role, 'none');

  -- Explicit and ordered. profiles is deleted directly rather than relying on
  -- a cascade, because 20260911_complete_master_schema.sql recreates the table
  -- without the foreign key the original migration declared — and that profile
  -- row is the one holding the username against create-user.
  DELETE FROM public.master_staff WHERE user_id = v_id;
  DELETE FROM public.user_roles   WHERE user_id = v_id;
  DELETE FROM public.profiles     WHERE id      = v_id;

  -- auth.identities cascades from auth.users, but it is removed first and
  -- tolerantly: on a locked-down project the DELETE can raise, and an error
  -- here would roll back the whole block over a row that does not matter.
  BEGIN
    DELETE FROM auth.identities WHERE user_id = v_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped auth.identities (%). Harmless: it cascades.', SQLERRM;
  END;

  DELETE FROM auth.users WHERE id = v_id;

  RAISE NOTICE 'Done. niraj04 is free.';
END $$;
