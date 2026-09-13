-- ============================================================================
-- Did the delete actually work?
--
-- A DO block always reports "Success. No rows returned" — that only means it
-- did not raise, not that it found and removed anything. This returns a real
-- result grid, so there is nothing to interpret.
--
-- Paste this whole file into a new tab and Run with nothing selected.
-- It is a single SELECT, so the grid you get IS the answer.
-- ============================================================================

SELECT
  CASE
    WHEN auth_rows = 0 AND profile_rows = 0
      THEN 'CLEAR - niraj04 is free. Go create the member.'
    WHEN auth_rows > 0 AND profile_rows > 0
      THEN 'STILL THERE - both auth user and profile remain. The DO block did not match it.'
    WHEN auth_rows > 0
      THEN 'PARTIAL - auth user remains, profile is gone.'
    ELSE
      'PARTIAL - profile row remains. This is the one that blocks create-user.'
  END                                  AS verdict,
  auth_rows                            AS auth_users_named_niraj04,
  profile_rows                         AS profiles_named_niraj04,
  orphan_rows                          AS other_orphaned_worker_logins,
  admin_rows                           AS your_admin_logins_must_be_at_least_1
FROM (
  SELECT
    (SELECT COUNT(*) FROM auth.users
       WHERE email ILIKE 'niraj04%')                                AS auth_rows,
    (SELECT COUNT(*) FROM public.profiles
       WHERE username ILIKE 'niraj04')                              AS profile_rows,
    (SELECT COUNT(*)
       FROM auth.users u
       LEFT JOIN public.user_roles r ON r.user_id = u.id
      WHERE COALESCE(r.role::text, 'worker') NOT IN ('admin', 'manager')
        AND NOT EXISTS (
              SELECT 1 FROM public.master_staff s WHERE s.user_id = u.id
            ))                                                      AS orphan_rows,
    (SELECT COUNT(*) FROM public.user_roles
       WHERE role::text IN ('admin', 'manager'))                    AS admin_rows
) AS counts;
