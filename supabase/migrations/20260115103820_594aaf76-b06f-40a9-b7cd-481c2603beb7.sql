-- Create booths table
CREATE TABLE IF NOT EXISTS public.booths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL,
  ward INTEGER,
  name TEXT NOT NULL,
  total_voters INTEGER DEFAULT 0,
  agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create influencers table
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  ward INTEGER,
  influence TEXT CHECK (influence IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('support', 'oppose', 'neutral')) DEFAULT 'neutral',
  phone TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pieces',
  ward INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create activities table for live feed
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('voter', 'expense', 'task', 'event')) NOT NULL,
  user_name TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaign_settings table
CREATE TABLE IF NOT EXISTS public.campaign_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_voters INTEGER DEFAULT 0,
  winning_goal INTEGER DEFAULT 0,
  election_date DATE,
  candidate_name TEXT,
  constituency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_settings ENABLE ROW LEVEL SECURITY;

-- RLS for booths
CREATE POLICY "Team can view booths" ON public.booths FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker'));

CREATE POLICY "Admin/Manager can manage booths" ON public.booths FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS for influencers
CREATE POLICY "Team can view influencers" ON public.influencers FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker'));

CREATE POLICY "Admin/Manager can manage influencers" ON public.influencers FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS for inventory
CREATE POLICY "Team can view inventory" ON public.inventory FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker'));

CREATE POLICY "Admin/Manager can manage inventory" ON public.inventory FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS for activities
CREATE POLICY "Team can view activities" ON public.activities FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker'));

CREATE POLICY "Team can insert activities" ON public.activities FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker'));

-- RLS for campaign_settings
CREATE POLICY "Team can view settings" ON public.campaign_settings FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker'));

CREATE POLICY "Admin can manage settings" ON public.campaign_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.voters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booths;
ALTER PUBLICATION supabase_realtime ADD TABLE public.influencers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_settings;

-- Add updated_at triggers
CREATE TRIGGER update_booths_updated_at BEFORE UPDATE ON public.booths
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON public.influencers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_campaign_settings_updated_at BEFORE UPDATE ON public.campaign_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();