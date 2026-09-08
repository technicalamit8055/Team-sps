-- Aligning table with Narayanpur CSV headers
ALTER TABLE voters 
ADD COLUMN IF NOT EXISTS name_english TEXT,
ADD COLUMN IF NOT EXISTS name_hindi TEXT,
ADD COLUMN IF NOT EXISTS guardian_name_english TEXT,
ADD COLUMN IF NOT EXISTS guardian_name_hindi TEXT,
ADD COLUMN IF NOT EXISTS house_no TEXT,
ADD COLUMN IF NOT EXISTS epic_no TEXT;

-- Create unique index on epic_no for upsert conflict resolution
CREATE UNIQUE INDEX IF NOT EXISTS idx_voters_epic_unique ON voters(epic_no) WHERE epic_no IS NOT NULL;