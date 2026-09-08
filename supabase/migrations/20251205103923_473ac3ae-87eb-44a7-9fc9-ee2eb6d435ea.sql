-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'worker', 'citizen');

-- Create user_roles table for role management (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  password_hint TEXT,
  full_name TEXT,
  phone TEXT,
  ward_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create voters table (CRM)
CREATE TABLE public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  ward INTEGER,
  booth TEXT,
  status TEXT DEFAULT 'neutral' CHECK (status IN ('support', 'oppose', 'neutral')),
  assigned_worker_id UUID REFERENCES auth.users(id),
  caste TEXT,
  age INTEGER,
  gender TEXT,
  has_voted BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  ward INTEGER,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create schemes table (government benefits)
CREATE TABLE public.schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  eligibility TEXT,
  ward_numbers INTEGER[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaign_ads table
CREATE TABLE public.campaign_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'poster')),
  ward_numbers INTEGER[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  ward INTEGER,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  ward INTEGER,
  event_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create grievances table (for citizens)
CREATE TABLE public.grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  ward INTEGER,
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view worker/citizen profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager') AND
    id IN (SELECT user_id FROM public.user_roles WHERE role IN ('worker', 'citizen'))
  );

CREATE POLICY "Managers can create worker/citizen profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policies for voters
CREATE POLICY "Admin/Manager/Worker can view voters" ON public.voters
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'worker')
  );

CREATE POLICY "Admin/Manager can manage voters" ON public.voters
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Workers can update assigned voters" ON public.voters
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    assigned_worker_id = auth.uid()
  );

-- RLS Policies for expenses
CREATE POLICY "Admin/Manager can manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Workers can view expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'worker'));

-- RLS Policies for schemes (public read for authenticated)
CREATE POLICY "Authenticated users can view active schemes" ON public.schemes
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage schemes" ON public.schemes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for campaign_ads (public read for authenticated)
CREATE POLICY "Authenticated users can view active ads" ON public.campaign_ads
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage ads" ON public.campaign_ads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tasks
CREATE POLICY "Admin/Manager can manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Workers can view/update their tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    assigned_to = auth.uid()
  );

CREATE POLICY "Workers can update their tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker') AND
    assigned_to = auth.uid()
  );

-- RLS Policies for events
CREATE POLICY "Team can view events" ON public.events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'worker')
  );

CREATE POLICY "Admin/Manager can manage events" ON public.events
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- RLS Policies for grievances
CREATE POLICY "Users can submit grievances" ON public.grievances
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can view their own grievances" ON public.grievances
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

CREATE POLICY "Admin/Manager can manage all grievances" ON public.grievances
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- Trigger for profile timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_voters_updated_at
  BEFORE UPDATE ON public.voters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();