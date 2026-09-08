-- Fix candidate_profile RLS to protect contact information
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view active candidate profile" ON public.candidate_profile;

-- Create a policy that only shows contact info to team members
CREATE POLICY "Team can view full candidate profile" 
ON public.candidate_profile 
FOR SELECT 
USING (
  is_active = true AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'worker')
  )
);

-- Create a view for public access that hides sensitive contact info
CREATE OR REPLACE VIEW public.candidate_profile_public 
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  title,
  avatar_url,
  is_active,
  created_at,
  updated_at
  -- Excludes: email, phone (sensitive contact info)
FROM public.candidate_profile
WHERE is_active = true;