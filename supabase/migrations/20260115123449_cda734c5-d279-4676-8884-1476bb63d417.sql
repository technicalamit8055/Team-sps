-- 1. Add missing columns for Narayanpur data alignment
ALTER TABLE voters ADD COLUMN IF NOT EXISTS sl_no INTEGER;

-- 2. Create optimized index for Ward and Status filtering
CREATE INDEX IF NOT EXISTS idx_voters_ward_status ON voters(ward, status);

-- 3. Create index for search optimization
CREATE INDEX IF NOT EXISTS idx_voters_name_phone ON voters USING gin(to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(phone, '')));