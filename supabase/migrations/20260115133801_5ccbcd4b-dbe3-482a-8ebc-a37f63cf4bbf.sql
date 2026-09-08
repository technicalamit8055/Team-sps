-- Drop the partial unique index (redundant once we have a constraint)
DROP INDEX IF EXISTS idx_voters_epic_unique;

-- Add proper UNIQUE constraint on epic_no
ALTER TABLE public.voters 
ADD CONSTRAINT voters_epic_no_unique UNIQUE (epic_no);