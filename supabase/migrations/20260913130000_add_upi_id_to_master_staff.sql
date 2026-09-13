-- ==============================================================================
-- Per-member UPI ID.
--
-- Until now the only UPI id in the system was samiti_entities.upi_id — one
-- account for the whole unit, which every collector's QR code pointed at.
-- Collectors who take chanda in the field often need the money to land in
-- their own account first (and hand it over later, which the cash handover
-- ledger already tracks), so each staff member now carries their own optional
-- UPI id set at account creation or from the manage-member panel.
--
-- NULL means "no personal UPI" — callers fall back to the unit's upi_id, so
-- existing rows keep behaving exactly as they do today.
-- ==============================================================================

ALTER TABLE public.master_staff
  ADD COLUMN IF NOT EXISTS upi_id TEXT;
