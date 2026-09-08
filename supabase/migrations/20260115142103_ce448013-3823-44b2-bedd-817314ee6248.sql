-- Add new columns to voters table for comprehensive voter data
ALTER TABLE public.voters
ADD COLUMN IF NOT EXISTS relation_type TEXT, -- FAT/HUS/MOT
ADD COLUMN IF NOT EXISTS address_1 TEXT,
ADD COLUMN IF NOT EXISTS address_2 TEXT,
ADD COLUMN IF NOT EXISTS address_3 TEXT,
ADD COLUMN IF NOT EXISTS main_man_family TEXT,
ADD COLUMN IF NOT EXISTS impact_level TEXT,
ADD COLUMN IF NOT EXISTS is_alive BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS voter_status TEXT,
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES auth.users(id);

-- Add index on linked_user_id for future citizen login feature
CREATE INDEX IF NOT EXISTS idx_voters_linked_user_id ON public.voters(linked_user_id);

-- Add index on is_alive for filtering
CREATE INDEX IF NOT EXISTS idx_voters_is_alive ON public.voters(is_alive);