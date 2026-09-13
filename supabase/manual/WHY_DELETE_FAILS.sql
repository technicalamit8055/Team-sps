-- ============================================================================
-- Why does deleting a member report "Database error deleting user"?
--
-- That text is GoTrue's. It is what Supabase Auth returns when the
-- `DELETE FROM auth.users` underneath `auth.admin.deleteUser()` is rejected by
-- Postgres — almost always a foreign key in `public` still pointing at the row.
-- GoTrue does not pass the Postgres detail through, so the app can only show
-- the generic sentence. This query recovers the detail it swallowed.
--
-- Paste the whole file into a new SQL Editor tab and Run with nothing selected.
-- It only reads, so it is safe to run at any time.
-- ============================================================================

-- 1. Every foreign key pointing at auth.users, and what it does on delete.
--    `NO ACTION` / `RESTRICT` is the blocking kind: any surviving row in that
--    table makes the auth delete fail. `CASCADE` and `SET NULL` are fine.
SELECT
  c.conrelid::regclass::text                       AS referencing_table,
  a.attname                                        AS referencing_column,
  c.conname                                        AS constraint_name,
  CASE c.confdeltype
    WHEN 'a' THEN 'NO ACTION  <-- BLOCKS the delete'
    WHEN 'r' THEN 'RESTRICT   <-- BLOCKS the delete'
    WHEN 'c' THEN 'CASCADE    (ok - rows go too)'
    WHEN 'n' THEN 'SET NULL   (ok - rows kept, link cleared)'
    WHEN 'd' THEN 'SET DEFAULT(ok)'
  END                                              AS on_delete_rule
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid
 AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND c.confrelid = 'auth.users'::regclass
ORDER BY
  CASE WHEN c.confdeltype IN ('a', 'r') THEN 0 ELSE 1 END,
  referencing_table;

-- 2. For one specific member: which tables still hold rows that reference them.
--    Put the member's username in the `target` line below, then Run again and
--    read the second grid. Any row with blocking_rows > 0 is a reason the
--    delete fails; `blocked_by` names the rule.
WITH target AS (
  SELECT id
  FROM public.profiles
  WHERE username ILIKE 'niraj04'          -- <<< change this username
  UNION
  SELECT user_id
  FROM public.master_staff
  WHERE username ILIKE 'niraj04'          -- <<< and this one, to the same value
    AND user_id IS NOT NULL
),
fks AS (
  SELECT
    c.conrelid::regclass::text AS tbl,
    a.attname::text            AS col,
    c.confdeltype              AS del
  FROM pg_constraint c
  JOIN pg_attribute a
    ON a.attrelid = c.conrelid
   AND a.attnum = ANY (c.conkey)
  WHERE c.contype = 'f'
    AND c.confrelid = 'auth.users'::regclass
)
SELECT
  f.tbl   AS referencing_table,
  f.col   AS referencing_column,
  CASE f.del
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    ELSE 'SET DEFAULT'
  END     AS blocked_by,
  (
    -- Counting a dynamic table name needs a query per table; xpath over
    -- query_to_xml is the standard way to do that inside a plain SELECT.
    xpath(
      '/row/cnt/text()',
      query_to_xml(
        format(
          'SELECT COUNT(*) AS cnt FROM %s WHERE %I IN (SELECT id FROM (%s) t)',
          f.tbl,
          f.col,
          'SELECT id FROM public.profiles WHERE username ILIKE ''niraj04'''
        ),
        false, true, ''
      )
    )
  )[1]::text::int AS blocking_rows
FROM fks f
WHERE f.del IN ('a', 'r')
ORDER BY blocking_rows DESC, referencing_table;
