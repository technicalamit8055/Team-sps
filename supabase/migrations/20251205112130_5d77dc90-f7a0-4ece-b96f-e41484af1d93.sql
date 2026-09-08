-- Remove the password_hint column that stores plaintext passwords
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hint;