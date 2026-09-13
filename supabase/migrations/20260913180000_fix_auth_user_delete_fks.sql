-- ==============================================================================
-- Make deleting a member possible.
--
-- Deleting a member from the admin panel failed with "Database error deleting
-- user" for anyone who had ever entered data. That sentence is GoTrue's generic
-- wrapper: the `DELETE FROM auth.users` behind `auth.admin.deleteUser()` was
-- rejected by Postgres, and the real reason — a foreign key violation — is not
-- passed back to the caller, so the edge function had nothing better to report.
--
-- The cause is that the foreign keys into `auth.users` were declared with no
-- `ON DELETE` clause, which means `NO ACTION`: the delete is refused while any
-- referencing row survives. So a worker who had recorded a single donation,
-- expense, task or voter could never be removed, while one who had done nothing
-- yet deleted cleanly — which is why this looked intermittent.
--
-- The fix is per column, according to what the reference means:
--
--   * Authorship and assignment columns (`created_by`, `assigned_to`,
--     `submitted_by`, `worker_id`, ...) become ON DELETE SET NULL. The history
--     is the samiti's record, not the member's: a donation they collected still
--     happened and must keep its amount, date and receipt number. Only the
--     attribution is cleared. Deleting the rows instead would silently rewrite
--     the accounts every time someone left.
--
--   * The account's own rows (`profiles`, `user_roles`) become ON DELETE
--     CASCADE. These exist only to describe the login, so they are meaningless
--     once it is gone — and a leftover `profiles` row keeps the username
--     occupied, which is what made re-creating a deleted member report
--     "यूज़रनेम पहले से मौजूद है".
--
--   * `master_staff.user_id` becomes ON DELETE SET NULL rather than CASCADE.
--     The roster row is deleted explicitly by the edge function, in its own
--     step that reports its own failure. Cascading it here would also delete
--     the roster entry as a side effect of any future auth cleanup, which is
--     not something a login teardown should decide on its own.
--
-- Idempotent: each constraint is dropped by name if present and recreated, so
-- this is safe to re-run and safe on a project where only some of it applied.
-- ==============================================================================

-- Rewrite every foreign key that points at auth.users and would block a delete.
-- Doing this by introspection rather than as a list of hand-written ALTERs
-- matters here: this project has been provisioned from two different migration
-- paths (the per-feature migrations and 20260911_complete_master_schema.sql),
-- so which of these constraints actually exist, and under which generated
-- names, differs between environments. Anything already CASCADE or SET NULL is
-- left untouched.
DO $$
DECLARE
  fk RECORD;
  new_action TEXT;
BEGIN
  FOR fk IN
    SELECT
      c.conname                  AS constraint_name,
      c.conrelid::regclass::text AS table_name,
      a.attname::text            AS column_name
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f'
      AND c.confrelid = 'auth.users'::regclass
      AND c.confdeltype IN ('a', 'r')        -- NO ACTION / RESTRICT: the blocking ones
      AND array_length(c.conkey, 1) = 1      -- single-column FKs only
      -- Only our own tables. auth/storage/realtime manage their own keys and
      -- must not be rewritten from here.
      AND c.connamespace = 'public'::regnamespace
  LOOP
    -- The login's own describing rows go with it; everything else keeps its
    -- data and loses only the attribution.
    IF fk.table_name IN ('public.profiles', 'public.user_roles') THEN
      new_action := 'CASCADE';
    ELSE
      new_action := 'SET NULL';

      -- SET NULL cannot fire into a NOT NULL column — the delete would fail
      -- with the same opaque "Database error deleting user" this migration is
      -- meant to remove. Two of these columns were declared NOT NULL
      -- (`expenses.created_by`, `grievances.submitted_by`), so the constraint
      -- is relaxed wherever it is present. The attribution being unknown is
      -- exactly the state we are encoding, so it has to be representable.
      IF EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE attrelid = fk.table_name::regclass
          AND attname = fk.column_name
          AND attnotnull
      ) THEN
        EXECUTE format(
          'ALTER TABLE %s ALTER COLUMN %I DROP NOT NULL',
          fk.table_name, fk.column_name
        );
        RAISE NOTICE 'Dropped NOT NULL on %(%) so SET NULL can fire',
          fk.table_name, fk.column_name;
      END IF;
    END IF;

    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      fk.table_name, fk.constraint_name
    );

    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I)
         REFERENCES auth.users(id) ON DELETE %s',
      fk.table_name, fk.constraint_name, fk.column_name, new_action
    );

    RAISE NOTICE 'Rewrote % on %(%) -> ON DELETE %',
      fk.constraint_name, fk.table_name, fk.column_name, new_action;
  END LOOP;
END $$;
