-- Add गाँव (village) to donation records.
-- Nullable so existing rows and imports without a village keep working.
ALTER TABLE public.samiti_donations
  ADD COLUMN IF NOT EXISTS village text;
