-- 1. Create voter_conversions table to track status changes
CREATE TABLE public.voter_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES public.voters(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.voter_conversions ENABLE ROW LEVEL SECURITY;

-- Workers can view their own conversions
CREATE POLICY "Workers can view own conversions" ON public.voter_conversions
  FOR SELECT USING (
    worker_id = auth.uid() AND has_role(auth.uid(), 'worker')
  );

-- Admins/Managers can view all conversions  
CREATE POLICY "Admin/Manager can view all conversions" ON public.voter_conversions
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager')
  );

-- Team can insert conversions
CREATE POLICY "Team can insert conversions" ON public.voter_conversions
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'worker') OR
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager')
  );

-- Indexes for performance
CREATE INDEX idx_conversions_worker ON public.voter_conversions(worker_id);
CREATE INDEX idx_conversions_date ON public.voter_conversions(converted_at);
CREATE INDEX idx_conversions_voter ON public.voter_conversions(voter_id);

-- 2. Create worker_rewards table for bonus points and priority logistics
CREATE TABLE public.worker_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('bonus_points', 'priority_logistics', 'special_task')),
  points INTEGER DEFAULT 0,
  description TEXT,
  awarded_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.worker_rewards ENABLE ROW LEVEL SECURITY;

-- Workers can view their own rewards
CREATE POLICY "Workers can view own rewards" ON public.worker_rewards
  FOR SELECT USING (
    worker_id = auth.uid() AND has_role(auth.uid(), 'worker')
  );

-- Admin/Manager can view all rewards
CREATE POLICY "Admin/Manager can view all rewards" ON public.worker_rewards
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- Admin can manage all rewards
CREATE POLICY "Admin can manage rewards" ON public.worker_rewards
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Index
CREATE INDEX idx_rewards_worker ON public.worker_rewards(worker_id);

-- 3. Create a function to get worker leaderboard stats
CREATE OR REPLACE FUNCTION public.get_worker_leaderboard(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  worker_id UUID,
  worker_name TEXT,
  total_conversions BIGINT,
  total_points BIGINT,
  has_priority_logistics BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as worker_id,
    COALESCE(p.full_name, p.username) as worker_name,
    COALESCE(COUNT(vc.id), 0) as total_conversions,
    COALESCE(SUM(vc.points_awarded), 0) + COALESCE(
      (SELECT SUM(points) FROM worker_rewards WHERE worker_id = p.id AND is_active = true), 0
    ) as total_points,
    EXISTS(
      SELECT 1 FROM worker_rewards 
      WHERE worker_id = p.id 
      AND reward_type = 'priority_logistics' 
      AND is_active = true
    ) as has_priority_logistics
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worker'
  LEFT JOIN voter_conversions vc ON vc.worker_id = p.id 
    AND vc.converted_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY p.id, p.full_name, p.username
  ORDER BY total_conversions DESC, total_points DESC
  LIMIT 10
$$;

-- 4. Create a function to get worker's own stats
CREATE OR REPLACE FUNCTION public.get_worker_stats(worker_uuid UUID)
RETURNS TABLE (
  total_conversions BIGINT,
  total_points BIGINT,
  conversions_7_days BIGINT,
  conversions_30_days BIGINT,
  current_rank BIGINT,
  has_priority_logistics BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH worker_totals AS (
    SELECT 
      p.id,
      COALESCE(COUNT(vc.id), 0) as total_conversions,
      COALESCE(SUM(vc.points_awarded), 0) + COALESCE(
        (SELECT SUM(points) FROM worker_rewards WHERE worker_id = p.id AND is_active = true), 0
      ) as total_points
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worker'
    LEFT JOIN voter_conversions vc ON vc.worker_id = p.id
    GROUP BY p.id
  ),
  ranked AS (
    SELECT id, total_conversions, total_points,
      RANK() OVER (ORDER BY total_conversions DESC, total_points DESC) as rank
    FROM worker_totals
  )
  SELECT 
    r.total_conversions,
    r.total_points,
    (SELECT COUNT(*) FROM voter_conversions WHERE worker_id = worker_uuid AND converted_at >= NOW() - INTERVAL '7 days') as conversions_7_days,
    (SELECT COUNT(*) FROM voter_conversions WHERE worker_id = worker_uuid AND converted_at >= NOW() - INTERVAL '30 days') as conversions_30_days,
    r.rank as current_rank,
    EXISTS(
      SELECT 1 FROM worker_rewards 
      WHERE worker_id = worker_uuid 
      AND reward_type = 'priority_logistics' 
      AND is_active = true
    ) as has_priority_logistics
  FROM ranked r
  WHERE r.id = worker_uuid
$$;