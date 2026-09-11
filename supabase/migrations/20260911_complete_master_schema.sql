-- ==============================================================================
-- COMPLETE MASTER DATABASE SCHEMA (TEAM SPS / VICTORY OS / SAMITI MANAGEMENT)
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/ylbczxvtiyzughykhbtj/sql)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'worker', 'citizen');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. USER ROLES & PROFILES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hint TEXT,
  full_name TEXT,
  phone TEXT,
  ward_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. ELECTION / VICTORY OS TABLES
CREATE TABLE IF NOT EXISTS public.campaign_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT,
  constituency TEXT,
  election_date DATE,
  total_voters INTEGER,
  winning_goal INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.candidate_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidate_profile(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  ward INTEGER,
  agent TEXT,
  total_voters INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  ward INTEGER,
  booth TEXT,
  status TEXT DEFAULT 'neutral',
  assigned_worker_id UUID,
  caste TEXT,
  age INTEGER,
  gender TEXT,
  has_voted BOOLEAN DEFAULT false,
  house_no TEXT,
  address_1 TEXT,
  address_2 TEXT,
  address_3 TEXT,
  epic_no TEXT,
  name_hindi TEXT,
  name_english TEXT,
  guardian_name_hindi TEXT,
  guardian_name_english TEXT,
  relation_type TEXT,
  sl_no INTEGER,
  voter_status TEXT DEFAULT 'neutral',
  impact_level TEXT,
  is_alive BOOLEAN DEFAULT true,
  main_man_family TEXT,
  linked_user_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.voter_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES public.voters(id) ON DELETE CASCADE,
  worker_id UUID,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worker_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL,
  reward_type TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  description TEXT,
  awarded_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  ward INTEGER,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  ward INTEGER,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  ward INTEGER,
  event_date TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  ward INTEGER,
  influence TEXT,
  status TEXT DEFAULT 'neutral',
  type TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity INTEGER,
  unit TEXT,
  ward INTEGER,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  eligibility TEXT,
  ward_numbers INTEGER[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  ward_numbers INTEGER[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  ward INTEGER,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  user_id UUID,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. SAMITI MANAGEMENT OS (MULTI-TENANT FESTIVAL & CHANDA SYSTEM)

CREATE TABLE IF NOT EXISTS public.samiti_entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  upi_id TEXT,
  tagline TEXT,
  location TEXT,
  established_year INTEGER,
  registration_no TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.samiti_events (
  id TEXT PRIMARY KEY,
  entity_id TEXT REFERENCES public.samiti_entities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  target_budget NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.samiti_donations (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.samiti_events(id) ON DELETE CASCADE,
  serial_number INTEGER NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  identity TEXT,
  caste TEXT,
  address1 TEXT,
  address2 TEXT,
  phone TEXT,
  accepted_amount NUMERIC NOT NULL DEFAULT 0,
  received_amount NUMERIC NOT NULL DEFAULT 0,
  balance_amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'CASH',
  collector_name TEXT,
  is_handover_done BOOLEAN DEFAULT false,
  date DATE NOT NULL,
  remarks TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.samiti_expenses (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.samiti_events(id) ON DELETE CASCADE,
  voucher_no TEXT NOT NULL,
  category TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_phone TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  balance_due NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'CASH',
  expense_date DATE NOT NULL,
  paid_by TEXT,
  bill_receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.samiti_cash_handovers (
  id TEXT PRIMARY KEY DEFAULT ('hnd-' || gen_random_uuid()),
  event_id TEXT REFERENCES public.samiti_events(id) ON DELETE CASCADE,
  volunteer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  handed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.master_staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  primary_role TEXT NOT NULL,
  designation TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  avatar_color TEXT DEFAULT 'bg-indigo-600',
  workspace_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. INDEXES FOR LIGHTNING FAST QUERIES
CREATE INDEX IF NOT EXISTS idx_donations_event ON public.samiti_donations(event_id);
CREATE INDEX IF NOT EXISTS idx_donations_serial ON public.samiti_donations(event_id, serial_number);
CREATE INDEX IF NOT EXISTS idx_donations_collector ON public.samiti_donations(collector_name);
CREATE INDEX IF NOT EXISTS idx_expenses_event ON public.samiti_expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_voters_ward ON public.voters(ward);
CREATE INDEX IF NOT EXISTS idx_voters_booth ON public.voters(booth);
CREATE INDEX IF NOT EXISTS idx_voters_phone ON public.voters(phone);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) & OPEN POLICIES FOR APP ACCESS
ALTER TABLE public.samiti_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samiti_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samiti_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samiti_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samiti_cash_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_rewards ENABLE ROW LEVEL SECURITY;

-- Allow all operations for application users (authenticated & anon app keys)
DO $$ 
DECLARE
  t text;
  tables text[] := ARRAY[
    'samiti_entities', 'samiti_events', 'samiti_donations', 'samiti_expenses',
    'samiti_cash_handovers', 'master_staff', 'voters', 'expenses', 'tasks',
    'events', 'booths', 'influencers', 'inventory', 'activities',
    'campaign_settings', 'candidate_profile', 'social_links', 'schemes',
    'campaign_ads', 'grievances', 'profiles', 'user_roles', 'voter_conversions',
    'worker_rewards'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Public access %s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- 8. REALTIME SUBSCRIPTIONS
ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.samiti_entities,
  public.samiti_events,
  public.samiti_donations,
  public.samiti_expenses,
  public.samiti_cash_handovers,
  public.master_staff,
  public.voters,
  public.expenses,
  public.tasks,
  public.events,
  public.booths,
  public.influencers,
  public.activities;

-- 9. INITIAL SEED DATA (FESTIVALS, CAMPAIGN & INITIAL RECORDS)
-- Clean up any obsolete demo entities if present
DELETE FROM public.samiti_entities WHERE id NOT IN ('ent-durga-narayanpur', 'ent-election-2026');
DELETE FROM public.samiti_events WHERE entity_id NOT IN ('ent-durga-narayanpur', 'ent-election-2026');

INSERT INTO public.samiti_entities (id, name, type, upi_id, tagline, location, established_year)
VALUES
  ('ent-durga-narayanpur', 'श्री दुर्गा पूजा समिति, नारायणपुर', 'festival_samiti', 'durgapuja.narayanpur@upi', 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।', 'मुख्य चौक, नारायणपुर', 1985),
  ('ent-election-2026', '🗳️ चुनाव अभियान प्रबंधन (Victory OS Election Command)', 'election', 'campaign.victory@upi', 'मिशन विजय 2026 • बूथ प्रबंधन, मतदाता CRM, वॉर रूम एवं रणनीतिकार AI', 'नारायणपुर विधानसभा क्षेत्र', 2026)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  upi_id = EXCLUDED.upi_id,
  tagline = EXCLUDED.tagline,
  location = EXCLUDED.location;

INSERT INTO public.samiti_events (id, entity_id, title, fiscal_year, target_budget, start_date, end_date, is_active)
VALUES
  ('evt-durga-2026', 'ent-durga-narayanpur', 'श्री दुर्गा पूजा महोत्सव 2026 (भव्य 41वाँ वार्षिकोत्सव)', '2026-27', 550000, '2026-10-15', '2026-10-24', true),
  ('evt-election-2026', 'ent-election-2026', 'विधानसभा चुनाव अभियान 2026 (War Room & Voter CRM)', '2026-27', 2500000, '2026-09-01', '2026-11-30', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.samiti_donations (id, event_id, serial_number, category, name, identity, caste, address1, address2, phone, accepted_amount, received_amount, balance_amount, payment_mode, collector_name, is_handover_done, date, remarks)
VALUES
  ('don-1', 'evt-durga-2026', 1, 'SHO', 'राजेश कुमार गुप्ता', 'प्रो०: गुप्ता वस्त्र भंडार', 'वैश्य', 'दुकान नं० 14, मुख्य बाजार', 'नारायणपुर चौराहा', '9835012345', 11000, 11000, 0, 'ONL', 'अमित कुमार (सचिव)', true, '2026-09-01', 'गूगल पे द्वारा प्राप्त'),
  ('don-2', 'evt-durga-2026', 2, 'VIL', 'रामनरेश सिंह', 'आत्मज: स्वर्गीय रामखेलावन सिंह', 'क्षत्रिय', 'वार्ड नं० 4, सिंह टोला', 'पोस्ट- नारायणपुर', '9470123456', 5100, 3100, 2000, 'CASH', 'सुनील वर्मा', true, '2026-09-02', 'सप्तमी को ₹2000 शेष देंगे'),
  ('don-3', 'evt-durga-2026', 3, 'EMP', 'डॉ० विकास रंजन', 'चिकित्सा पदाधिकारी, प्राथमिक स्वास्थ्य केंद्र', 'ब्राह्मण', 'क्वार्टर नं० 2, पीएचसी परिसर', 'नारायणपुर', '9123456789', 5100, 5100, 0, 'ONL', 'प्रमोद यादव', true, '2026-09-02', 'फोनपे द्वारा अंतरित'),
  ('don-4', 'evt-durga-2026', 4, 'SHO', 'महेश मिष्ठान्न भंडार (महेश शाह)', 'दुकानदार संघ उपाध्यक्ष', 'साहू', 'स्टेशन रोड', 'नारायणपुर', '9801234567', 15000, 5000, 10000, 'CASH', 'अमित कुमार (सचिव)', false, '2026-09-03', 'भोग प्रसाद सामग्री भी देंगे + शेष ₹10,000 नवमी को'),
  ('don-5', 'evt-durga-2026', 5, 'VIL', 'संजय कुमार महतो', 'पुत्र: सुखदेव महतो', 'कुर्मी', 'ग्राम- नारायणपुर पूर्वी', 'थाना- सदर', '9934567890', 2100, 2100, 0, 'CASH', 'दीपक कुमार', true, '2026-09-03', 'ससम्मान रसीद दी गई'),
  ('don-6', 'evt-durga-2026', 6, 'OTH', 'प्रवीण आनंद (NRI/बेंगलुरु)', 'सॉफ्टवेयर इंजीनियर (मूल निवासी)', 'कायस्थ', 'आनंद निवास', 'नारायणपुर', '9876543210', 21000, 21000, 0, 'ONL', 'अमित कुमार (सचिव)', true, '2026-09-04', 'सीधे बैंक खाते में UPI ट्रान्सफर')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.samiti_expenses (id, event_id, voucher_no, category, vendor_name, vendor_phone, total_amount, amount_paid, balance_due, payment_mode, expense_date, paid_by, notes)
VALUES
  ('exp-1', 'evt-durga-2026', 'VCH-001', 'idol_murti', 'मूर्तिकार विजय पाल एवं बंधु', '9835112233', 65000, 35000, 30000, 'CASH', '2026-08-25', 'कोषाध्यक्ष (मनोज कुमार)', 'भव्य 15 फीट माँ दुर्गा व महिषासुर मर्दिनी प्रतिमा अग्रिम'),
  ('exp-2', 'evt-durga-2026', 'VCH-002', 'pandal_tent', 'भवानी टेंट हाउस & डेकोरेटर्स', '9470223344', 145000, 50000, 95000, 'ONL', '2026-09-01', 'सचिव (अमित कुमार)', 'अक्षरधाम मंदिर प्रारूप भव्य वाटरप्रूफ पंडाल निर्माण हेतु अग्रिम'),
  ('exp-3', 'evt-durga-2026', 'VCH-003', 'sound_light', 'माँ अम्बे म्यूजिकल & लाइट डेकोरेशन', '9123334455', 55000, 20000, 35000, 'CASH', '2026-09-02', 'कोषाध्यक्ष (मनोज कुमार)', 'जेबीएल साउंड सिस्टम, तोरण द्वार लाइट व हैलोजन फिटिंग'),
  ('exp-4', 'evt-durga-2026', 'VCH-004', 'puja_samagri', 'श्री राम पूजन भंडार', '9801445566', 22000, 22000, 0, 'ONL', '2026-09-04', 'सचिव (अमित कुमार)', 'हवन सामग्री, शुध्द देसी घी, चंदन, धूप, रोली आदि पूर्ण भुगतान')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.master_staff (id, name, phone, username, primary_role, designation, status, joined_date, avatar_color, workspace_permissions)
VALUES
  ('staff-1', 'अमित कुमार', '9835012345', 'amit_admin', 'admin', 'मुख्य प्रशासक एवं महासचिव', 'active', '2024-01-15', 'bg-indigo-600', '{"ent-election-2026": {"workspaceId": "ent-election-2026", "accessLevel": "full_control", "modules": {"votersCRM": true, "donationsLedger": true, "expenses": true, "analytics": true, "karyakartaMgmt": true, "exportData": true}}, "ent-durga-narayanpur": {"workspaceId": "ent-durga-narayanpur", "accessLevel": "full_control", "modules": {"votersCRM": true, "donationsLedger": true, "expenses": true, "analytics": true, "karyakartaMgmt": true, "exportData": true}}}'::jsonb),
  ('staff-2', 'मनोज कुमार', '9835112233', 'manoj_treasurer', 'accountant', 'कोषाध्यक्ष (कैशियर)', 'active', '2024-02-10', 'bg-emerald-600', '{"ent-durga-narayanpur": {"workspaceId": "ent-durga-narayanpur", "accessLevel": "full_control", "modules": {"votersCRM": false, "donationsLedger": true, "expenses": true, "analytics": true, "karyakartaMgmt": false, "exportData": true}}}'::jsonb),
  ('staff-5', 'सुनील वर्मा', '9470123456', 'sunil_collector', 'collector', 'फील्ड संग्रहकर्ता (चंदा संग्रह)', 'active', '2024-05-20', 'bg-amber-600', '{"ent-durga-narayanpur": {"workspaceId": "ent-durga-narayanpur", "accessLevel": "collector", "modules": {"votersCRM": false, "donationsLedger": true, "expenses": false, "analytics": false, "karyakartaMgmt": false, "exportData": false}}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.campaign_settings (candidate_name, constituency, election_date, total_voters, winning_goal)
VALUES ('श्री राजेश कुमार', 'नारायणपुर विधानसभा', CURRENT_DATE + INTERVAL '45 days', 8500, 4500)
ON CONFLICT DO NOTHING;
