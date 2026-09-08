-- Add public read access to active candidate profiles for the landing page
CREATE POLICY "Anyone can view active candidate profile" 
ON public.candidate_profile 
FOR SELECT 
USING (is_active = true);