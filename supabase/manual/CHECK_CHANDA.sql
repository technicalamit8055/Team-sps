-- ============================================================================
-- CHECK CHANDA STATUS
--
-- यह एक सीधा SELECT है (कोई DO ब्लॉक नहीं)।
-- इसे Supabase SQL Editor में एक नए टैब में पेस्ट करें और Run दबाएं।
-- रिजल्ट ग्रिड में आपको तुरंत दिखेगा कि डेटाबेस में क्या स्थिति है।
-- ============================================================================

-- 1. सारांश (Summary): कुल कितने चंदे हैं, 33/44/45 की स्थिति, डुप्लीकेट और Atomic Serial फ़ंक्शन स्टेटस
SELECT
  COUNT(*)                                         AS "कुल दर्ज चंदा (Total)",
  COUNT(*) FILTER (WHERE serial_number = 33)       AS "33 नंबर दर्ज है? (1=हाँ, 0=नहीं)",
  COUNT(*) FILTER (WHERE serial_number = 44)       AS "44 नंबर दर्ज है? (1=हाँ, 0=नहीं)",
  COUNT(*) FILTER (WHERE serial_number = 45)       AS "45 नंबर दर्ज है? (1=हाँ, 0=नहीं)",
  (COUNT(*) - COUNT(DISTINCT serial_number))       AS "डुप्लीकेट रसीदें (0 होनी चाहिए)",
  MIN(serial_number)                               AS "सबसे छोटा क्रमांक",
  MAX(serial_number)                               AS "सबसे बड़ा क्रमांक",
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'claim_donation_serial') AS "Atomic RPC फ़ंक्शन (1=सक्रिय, 0=लागू नहीं)",
  (SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'samiti_donations_event_serial_key') AS "यूनिक इंडेक्स (1=सक्रिय, 0=लागू नहीं)"
FROM public.samiti_donations;

