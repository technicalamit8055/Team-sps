-- Fix RLS policies for schemes and campaign_ads to require authentication

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view active schemes" ON schemes;
DROP POLICY IF EXISTS "Authenticated users can view active ads" ON campaign_ads;

-- Create new policies with authentication requirement
CREATE POLICY "Authenticated users can view active schemes" 
ON schemes 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view active ads" 
ON campaign_ads 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);