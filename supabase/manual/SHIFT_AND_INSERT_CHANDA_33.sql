-- ============================================================================
-- SHIFT SERIAL NUMBERS & INSERT MISSED CHANDA #33
--
-- ⚠️ महत्वपूर्ण निर्देश (READ FIRST):
-- Supabase SQL Editor में किसी भी लाइन को SELECT (HIGHLIGHT) न करें!
-- अगर कोई टेक्स्ट सेलेक्ट होगा, तो केवल वही चलेगा और एरर आएगा।
-- पूरा कोड पेस्ट करें, कहीं भी खाली जगह पर क्लिक करें (ताकि कोई चयन न रहे),
-- और फिर "Run" दबाएं।
-- ============================================================================

DO $$
DECLARE
  -- ✏️ छूटी हुई 33 नंबर रसीद का विवरण:
  v_missing_serial    INTEGER := 33;
  v_donor_name        TEXT    := 'श्री दानदाता (रसीद 33)'; -- बाद में ऐप में भी बदल सकते हैं
  v_identity          TEXT    := '';
  v_category          TEXT    := 'VIL';
  v_village           TEXT    := '';
  v_phone             TEXT    := '';
  v_amount            NUMERIC := 501;
  v_payment_mode      TEXT    := 'CASH';
  v_collector_name    TEXT    := 'ऑफलाइन रजिस्टर';
  v_date              DATE    := CURRENT_DATE;
  v_remarks           TEXT    := 'ऑफलाइन रजिस्टर से छूटी हुई रसीद #33';
  
  v_event_id          TEXT;
  v_shifted_count     INT := 0;
  v_new_id            TEXT := 'don-' || gen_random_uuid();
  v_max_serial        INT;
  v_already_has_33    BOOLEAN;
BEGIN
  -- 1. उन दानों से event_id निकालें जो पहले से मौजूद हैं
  SELECT event_id INTO v_event_id
  FROM public.samiti_donations
  WHERE serial_number >= 33
  LIMIT 1;

  -- अगर 33 से नहीं मिला, तो किसी भी रिकॉर्ड का event_id लें
  IF v_event_id IS NULL THEN
    SELECT event_id INTO v_event_id
    FROM public.samiti_donations
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- अगर टेबल खाली है या event_id नहीं मिला, तो एक्टिव इवेंट लें
  IF v_event_id IS NULL THEN
    SELECT id INTO v_event_id
    FROM public.samiti_events
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- 2. चेक करें कि कितने रिकॉर्ड्स को आगे शिफ्ट करना है
  SELECT COUNT(*), MAX(serial_number)
    INTO v_shifted_count, v_max_serial
  FROM public.samiti_donations
  WHERE (event_id IS NOT DISTINCT FROM v_event_id)
    AND serial_number >= v_missing_serial;

  RAISE NOTICE 'इवेंट ID: % | अधिकतम सीरियल: % | शिफ्ट होने वाले रिकॉर्ड: %', 
    COALESCE(v_event_id, 'NULL'), v_max_serial, v_shifted_count;

  IF v_shifted_count > 0 THEN
    -- चरण 1: 33 और उससे बड़े सीरियल नंबरों को अस्थायी रूप से नेगेटिव (-) करें
    UPDATE public.samiti_donations
    SET serial_number = -serial_number,
        updated_at = now()
    WHERE (event_id IS NOT DISTINCT FROM v_event_id)
      AND serial_number >= v_missing_serial;

    -- चरण 2: नेगेटिव नंबरों को वापस पॉजिटिव में बदलकर +1 जोड़ें
    -- (-33 बन गया 34, -34 बन गया 35, ..., -44 बन गया 45)
    UPDATE public.samiti_donations
    SET serial_number = (-serial_number) + 1,
        updated_at = now()
    WHERE (event_id IS NOT DISTINCT FROM v_event_id)
      AND serial_number <= -v_missing_serial;

    RAISE NOTICE 'सफलतापूर्वक % रिकॉर्ड्स को +1 आगे खिसका दिया गया!', v_shifted_count;
  END IF;

  -- चरण 3: छूटे हुए 33 नंबर का नया रिकॉर्ड दर्ज करें
  INSERT INTO public.samiti_donations (
    id,
    event_id,
    serial_number,
    category,
    name,
    identity,
    village,
    phone,
    accepted_amount,
    received_amount,
    balance_amount,
    payment_mode,
    collector_name,
    is_handover_done,
    date,
    remarks,
    payments,
    created_at,
    updated_at
  )
  VALUES (
    v_new_id,
    v_event_id,
    v_missing_serial,
    v_category,
    v_donor_name,
    NULLIF(v_identity, ''),
    NULLIF(v_village, ''),
    NULLIF(v_phone, ''),
    v_amount,
    v_amount,
    0,
    v_payment_mode,
    v_collector_name,
    false,
    v_date,
    v_remarks,
    jsonb_build_array(
      jsonb_build_object(
        'id', 'pay-' || v_new_id || '-opening',
        'amount', v_amount,
        'paymentMode', v_payment_mode,
        'date', v_date::text,
        'collectorName', v_collector_name,
        'note', 'प्रथम जमा (रसीद 33)',
        'createdAt', now()::text
      )
    ),
    now(),
    now()
  );

  RAISE NOTICE '✅ क्रमांक 33 सफलतापूर्वक दर्ज हो गया है!';
END $$;
