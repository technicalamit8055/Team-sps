-- Create candidate_profile table for the Linktree-style landing page
CREATE TABLE public.candidate_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create social_links table for dynamic link management
CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidate_profile(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- website, facebook, instagram, twitter, youtube, whatsapp
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT, -- icon identifier
  color TEXT, -- gradient/button color
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Public can read active candidate profiles (no auth required for landing page)
CREATE POLICY "Anyone can view active candidate profile"
ON public.candidate_profile
FOR SELECT
USING (is_active = true);

-- Public can read active social links (no auth required for landing page)
CREATE POLICY "Anyone can view active social links"
ON public.social_links
FOR SELECT
USING (is_active = true);

-- Admin can manage candidate profiles
CREATE POLICY "Admin can manage candidate profiles"
ON public.candidate_profile
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can manage social links
CREATE POLICY "Admin can manage social links"
ON public.social_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_candidate_profile_updated_at
BEFORE UPDATE ON public.candidate_profile
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default candidate profile
INSERT INTO public.candidate_profile (name, title, email, phone)
VALUES (
  'श्री विशाल प्रशांत',
  'माननीय विधायक, तरारी विधानसभा',
  'vishalprashantbjp@gmail.com',
  '+91 9430588888'
);

-- Insert default social links
INSERT INTO public.social_links (candidate_id, platform, label, url, color, display_order)
SELECT 
  id,
  unnest(ARRAY['website', 'facebook', 'instagram', 'twitter', 'youtube', 'whatsapp']),
  unnest(ARRAY['आधिकारिक वेबसाइट पर जाएँ', 'Facebook पर फॉलो करें', 'Instagram पर जुड़ें', 'X / Twitter', 'YouTube चैनल', 'सीधा WhatsApp संदेश भेजें']),
  unnest(ARRAY['https://example.com', 'https://facebook.com', 'https://instagram.com', 'https://twitter.com', 'https://youtube.com', 'https://wa.me/919430588888']),
  unnest(ARRAY['saffron', 'facebook', 'instagram', 'twitter', 'youtube', 'whatsapp']),
  unnest(ARRAY[1, 2, 3, 4, 5, 6])
FROM public.candidate_profile
LIMIT 1;