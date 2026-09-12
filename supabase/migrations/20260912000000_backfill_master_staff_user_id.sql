-- ==============================================================================
-- BACKFILL: link pre-existing master_staff rows to their Supabase Auth accounts.
--
-- 20260911185203_fix_rls_policies.sql added master_staff.user_id and made every
-- samiti_donations RLS policy for workers (collectors) require a matching
-- master_staff.user_id = auth.uid() row. That migration's own header warned
-- this must happen only after existing staff were linked to real auth accounts
-- — but no linking step was ever run, so every staff row seeded before this
-- migration (including the donation collector demo account, sunil_collector)
-- has user_id = NULL and is silently locked out of viewing/adding donations.
--
-- create-user (supabase/functions/create-user/index.ts) derives each account's
-- login email from its username: lowercase, strip non-alphanumerics, then
-- "@victory.local". We use that same derivation to join master_staff.username
-- back to auth.users.email for any row still missing a user_id.
-- ==============================================================================

UPDATE public.master_staff ms
SET user_id = au.id
FROM auth.users au
WHERE ms.user_id IS NULL
  AND au.email = lower(regexp_replace(ms.username, '[^a-zA-Z0-9]', '', 'g')) || '@victory.local';
