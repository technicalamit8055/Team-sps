-- ============================================================================
-- Fix: "Database error deleting user" when removing a member.
--
-- This is a copy of
-- supabase/migrations/20260913180000_fix_auth_user_delete_fks.sql, for the
-- live project, which is updated through the dashboard rather than the
-- migration CLI. The two must stay identical.
--
-- Supabase dashboard -> SQL Editor -> new tab -> paste the whole file ->
-- Run with NOTHING selected. Then read the Messages/Notices pane: it prints
-- one line per constraint it rewrote. "Success. No rows returned" is the
-- expected Results output for a DO block and does not mean nothing happened.
--
-- Idempotent: re-running it finds no blocking constraints left and rewrites
-- nothing.
-- ============================================================================


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

-- ============================================================================
-- Verification. Run this after the block above (it is a plain SELECT, so the
-- grid you get IS the answer — no Messages pane to read).
--
-- Expect: one row saying CLEAR. Any row naming a table means that constraint
-- is still blocking and the member still cannot be deleted.
-- ============================================================================
SELECT
  CASE WHEN COUNT(*) = 0
    THEN 'CLEAR - no foreign key blocks deleting a login. Try the admin panel again.'
    ELSE 'STILL BLOCKING - ' || COUNT(*)::text || ' constraint(s) below were not rewritten.'
  END AS verdict,
  COALESCE(string_agg(tbl || '.' || col, ', '), '-') AS still_blocking
FROM (
  SELECT
    c.conrelid::regclass::text AS tbl,
    a.attname::text            AS col
  FROM pg_constraint c
  JOIN pg_attribute a
    ON a.attrelid = c.conrelid
   AND a.attnum = ANY (c.conkey)
  WHERE c.contype = 'f'
    AND c.confrelid = 'auth.users'::regclass
    AND c.connamespace = 'public'::regnamespace
    AND c.confdeltype IN ('a', 'r')
) AS blocking;
