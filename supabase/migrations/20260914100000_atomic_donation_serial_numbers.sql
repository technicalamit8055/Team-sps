-- ==============================================================================
-- ATOMIC, SERVER-AUTHORITATIVE RECEIPT (SERIAL) NUMBERS
--
-- During a festival collection several counters run at once, each on its own
-- tablet. Until now `serial_number` was computed in browser memory as
-- `max(serialNumber) + 1` over whatever rows that device had synced. Two
-- counters saving a receipt inside the same Realtime propagation window both
-- read the same maximum and both wrote, say, #0151 — duplicate numbers on
-- printed slips and on the WhatsApp PDFs, which the treasurer then has to
-- untangle by hand.
--
-- The number is moved to the server, where it is handed out under a
-- transaction-level advisory lock keyed on the event. Concurrent callers
-- serialise on that lock, so every receipt in an event gets a distinct number
-- no matter how many devices are saving at the same instant.
--
-- Three pieces, in order:
--   1. Re-sequence any duplicates already in the table (no rows deleted).
--   2. A UNIQUE index on (event_id, serial_number) — the backstop that makes a
--      duplicate impossible even if some future code path bypasses the
--      function below.
--   3. `claim_donation_serial(...)` — the allocator the app calls.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DEDUPLICATE EXISTING DATA
--
-- Only rows that actually collide are touched. Within a colliding group the
-- earliest-created row keeps the number it was issued (its printed receipt is
-- already in a donor's hands); the later ones are pushed past the end of that
-- event's range, preserving their relative order. Nothing is deleted and no
-- amounts change.
-- ------------------------------------------------------------------------------
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id, serial_number
      ORDER BY created_at NULLS LAST, id
    ) AS dup_rank
  FROM public.samiti_donations
  WHERE event_id IS NOT NULL
),
-- Rows needing a new number: every member of a colliding group except the
-- first (oldest), which keeps its issued number.
losers AS (
  SELECT d.id, d.event_id, d.serial_number, d.created_at
  FROM public.samiti_donations d
  JOIN ranked r ON r.id = d.id AND r.dup_rank > 1
),
-- Highest number currently in use per event; new numbers continue past it.
ceiling AS (
  SELECT event_id, MAX(serial_number) AS max_serial
  FROM public.samiti_donations
  WHERE event_id IS NOT NULL
  GROUP BY event_id
),
reassigned AS (
  SELECT
    l.id,
    c.max_serial + ROW_NUMBER() OVER (
      PARTITION BY l.event_id
      ORDER BY l.serial_number, l.created_at NULLS LAST, l.id
    ) AS new_serial
  FROM losers l
  JOIN ceiling c ON c.event_id = l.event_id
)
UPDATE public.samiti_donations d
SET serial_number = r.new_serial,
    updated_at = now()
FROM reassigned r
WHERE d.id = r.id;

-- ------------------------------------------------------------------------------
-- 2. UNIQUENESS BACKSTOP
--
-- Partial, so any legacy row with a NULL event_id is ignored rather than
-- blocking the migration.
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS samiti_donations_event_serial_key
  ON public.samiti_donations (event_id, serial_number)
  WHERE event_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. THE ALLOCATOR
--
-- `pg_advisory_xact_lock` is taken on a hash of the event id, so two counters
-- saving into the same event queue behind each other for the microseconds the
-- allocate-and-insert takes, while counters working on *different* events never
-- block one another. The lock is transaction-scoped: it is released when the
-- function's implicit transaction ends, including on error, so a crashed client
-- cannot wedge an event.
--
-- Allocating the number and writing the row happen in the same transaction on
-- purpose. A bare "give me a number" call would release the lock before the row
-- landed, letting a second caller read the same maximum — exactly the race this
-- migration exists to close.
--
-- The number is derived from the table rather than a sequence, so it stays
-- correct alongside Excel imports and manual corrections, and leaves no gap
-- behind a failed save.
--
-- The row is passed as jsonb so this function does not need revising every time
-- a column is added to samiti_donations.
--
-- SECURITY INVOKER keeps the existing RLS INSERT policies in force — a worker
-- still writes only their own entries. The advisory lock needs no special
-- privilege.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_donation_serial(p_event_id TEXT, p_donation JSONB)
RETURNS public.samiti_donations
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
DECLARE
  v_serial INTEGER;
  v_row public.samiti_donations;
BEGIN
  IF p_event_id IS NULL THEN
    RAISE EXCEPTION 'event_id is required to allocate a receipt number';
  END IF;

  -- Serialise allocation per event for the remainder of this transaction.
  PERFORM pg_advisory_xact_lock(hashtext('samiti_donation_serial:' || p_event_id));

  SELECT COALESCE(MAX(serial_number), 0) + 1
    INTO v_serial
  FROM public.samiti_donations
  WHERE event_id = p_event_id;

  INSERT INTO public.samiti_donations (
    id, event_id, serial_number, category, name, identity, caste, village,
    address1, address2, phone, accepted_amount, received_amount, balance_amount,
    payment_mode, collector_name, is_handover_done, date, remarks, receipt_url,
    payments, updated_at
  )
  VALUES (
    COALESCE(NULLIF(p_donation->>'id', ''), 'don-' || gen_random_uuid()),
    p_event_id,
    v_serial,
    p_donation->>'category',
    p_donation->>'name',
    NULLIF(p_donation->>'identity', ''),
    NULLIF(p_donation->>'caste', ''),
    NULLIF(p_donation->>'village', ''),
    NULLIF(p_donation->>'address1', ''),
    NULLIF(p_donation->>'address2', ''),
    NULLIF(p_donation->>'phone', ''),
    COALESCE((p_donation->>'accepted_amount')::NUMERIC, 0),
    COALESCE((p_donation->>'received_amount')::NUMERIC, 0),
    COALESCE((p_donation->>'balance_amount')::NUMERIC, 0),
    COALESCE(NULLIF(p_donation->>'payment_mode', ''), 'CASH'),
    NULLIF(p_donation->>'collector_name', ''),
    COALESCE((p_donation->>'is_handover_done')::BOOLEAN, false),
    COALESCE((p_donation->>'date')::DATE, CURRENT_DATE),
    NULLIF(p_donation->>'remarks', ''),
    NULLIF(p_donation->>'receipt_url', ''),
    COALESCE(p_donation->'payments', '[]'::jsonb),
    now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.claim_donation_serial(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_donation_serial(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.claim_donation_serial(TEXT, JSONB) TO service_role;

