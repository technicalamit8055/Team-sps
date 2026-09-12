-- Instalment log for donors who clear their pledge over more than one visit.
-- Each element: { id, amount, paymentMode, date, collectorName, note, createdAt }.
-- Nullable/defaulted so existing rows and Excel imports keep working; an empty
-- log means the whole received_amount came in on the row's `date`.
ALTER TABLE public.samiti_donations
  ADD COLUMN IF NOT EXISTS payments jsonb NOT NULL DEFAULT '[]'::jsonb;
