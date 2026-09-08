-- Create storage bucket for candidate avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow admins to upload avatars
CREATE POLICY "Admins can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));

-- Allow admins to update avatars
CREATE POLICY "Admins can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));

-- Allow admins to delete avatars
CREATE POLICY "Admins can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));