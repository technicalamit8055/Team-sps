-- ==============================================================================
-- ATOMIC, SERVER-AUTHORITATIVE RECEIPT (SERIAL) NUMBERS
-- Multi-Device Collision Prevention Fix
--
-- 📋 निर्देश (Instructions):
-- 1. Supabase Dashboard खोलें -> SQL Editor में जाएं।
-- 2. New Query खोलें, यह पूरा कोड पेस्ट करें।
-- 3. किसी भी लाइन को सेलेक्ट (Highlight) न करें! (खाली जगह पर क्लिक रखें)।
-- 4. "Run" बटन दबाएं।
--
-- यह स्क्रिप्ट पूरी तरह Idempotent और Safe है (इसे कितनी भी बार चला सकते हैं)।
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DEDUPLICATE EXISTING DATA (मौजूदा डुप्लीकेट ठीक करें)
--
-- अगर पहले से कोई डुप्लीकेट (same event_id + same serial_number) है,
-- तो सबसे पुरानी रसीद वही नंबर रखेगी और बाकी को आगे खिसका दिया जाएगा।
-- कोई भी डेटा डिलीट नहीं होगा!
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
losers AS (
  SELECT d.id, d.event_id, d.serial_number, d.created_at
  FROM public.samiti_donations d
  JOIN ranked r ON r.id = d.id AND r.dup_rank > 1
),
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
-- 2. UNIQUE INDEX (डुप्लीकेट रोकने का स्थायी सुरक्षा कवच)
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS samiti_donations_event_serial_key
  ON public.samiti_donations (event_id, serial_number)
  WHERE event_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. THE ALLOCATOR FUNCTION (claim_donation_serial)
--
-- pg_advisory_xact_lock का उपयोग करता है ताकि एक ही इवेंट में 
-- एक साथ 10 काउंटर भी सेव दबाएं तो सबको अलग-अलग क्रमवार नंबर मिले।
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

-- Permissions: Allow authenticated workers and anon to invoke the allocator
GRANT EXECUTE ON FUNCTION public.claim_donation_serial(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_donation_serial(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.claim_donation_serial(TEXT, JSONB) TO service_role;

-- ------------------------------------------------------------------------------
-- 4. VERIFICATION RESULT (जाँच परिणाम)
-- ------------------------------------------------------------------------------
SELECT 
  '✅ claim_donation_serial फ़ंक्शन सफलतापूर्वक बन गया!' AS "स्टेटस",
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'claim_donation_serial') AS "फ़ंक्शन उपलब्ध है (1=हाँ)",
  (SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'samiti_donations_event_serial_key') AS "यूनिक इंडेक्स सक्रिय है (1=हाँ)",
  (SELECT COUNT(*) FROM public.samiti_donations) AS "कुल चंदा रिकॉर्ड",
  (SELECT MAX(serial_number) FROM public.samiti_donations) AS "अंतिम रसीद क्रमांक";
