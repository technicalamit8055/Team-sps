-- Instalment log for vendor bills settled over more than one payment.
-- Each element: { id, amount, paymentMode, date, paidBy, note, createdAt }.
-- Mirrors samiti_donations.payments. Nullable/defaulted so existing vouchers
-- keep working; an empty log means the whole amount_paid went out on the
-- row's `expense_date`.
ALTER TABLE public.samiti_expenses
  ADD COLUMN IF NOT EXISTS payments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Vouchers are edited now (bill revisions and बकाया जमा instalments), so the
-- row needs a modification timestamp of its own.
ALTER TABLE public.samiti_expenses
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
