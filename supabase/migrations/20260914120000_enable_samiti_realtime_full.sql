-- ==============================================================================
-- Publish the samiti tables over Supabase Realtime so every counter sees a
-- donation, edit, instalment or expense the moment another device saves it.
--
-- Two separate things are required, and missing either one produces a silent
-- half-working sync rather than an error:
--
--   1. Membership in the `supabase_realtime` publication. Without it Postgres
--      never writes the row into the replication slot, so the Realtime server
--      has nothing to forward and the client's `.subscribe()` still reports
--      SUBSCRIBED. That combination -- a healthy-looking channel that never
--      delivers -- is why the app appeared to need a manual refresh.
--
--   2. REPLICA IDENTITY FULL. By default Postgres puts only the primary key in
--      the WAL for UPDATE and DELETE. Realtime evaluates the table's RLS
--      policies against the row before deciding who may receive it, and a
--      policy that reads `event_id` (as every samiti policy does) cannot be
--      evaluated against a row containing just `id`. The event is then dropped
--      for authenticated listeners: edits and deletes never arrive, while
--      INSERTs -- which always carry the whole row -- work fine. FULL puts the
--      complete old row in the WAL, which also gives DELETE handlers an
--      `oldRow` with more than a bare id.
--
-- Idempotent: safe to re-run, and safe on a database where some tables were
-- already added to the publication by hand.
-- ==============================================================================

-- A stock Supabase project ships this publication, but a self-hosted or reset
-- database may not. Creating it empty first keeps the ADD TABLE calls below
-- from failing with "publication supabase_realtime does not exist".
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'samiti_donations',
    'samiti_expenses',
    'samiti_cash_handovers',
    'samiti_events',
    'samiti_entities',
    'master_staff'
  ]
  LOOP
    -- Skip tables that do not exist on this database rather than aborting the
    -- whole migration: a fresh branch may not carry every table yet.
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl AND c.relkind = 'r'
    ) THEN
      RAISE NOTICE 'Skipping %: table not present', tbl;
      CONTINUE;
    END IF;

    -- REPLICA IDENTITY FULL is unconditional: ALTER TABLE ... REPLICA IDENTITY
    -- is itself idempotent and cheap (a catalog update, no table rewrite).
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tbl);

    -- ADD TABLE errors with 42710 if the table is already published, and there
    -- is no ADD TABLE IF NOT EXISTS, so test membership first.
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      RAISE NOTICE 'Added % to supabase_realtime', tbl;
    ELSE
      RAISE NOTICE '% already published', tbl;
    END IF;
  END LOOP;
END $$;
