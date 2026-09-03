-- 020_employee_accounts.sql

-- 1. Extend Employees Table
ALTER TABLE public.employees 
    ADD COLUMN gender TEXT,
    ADD COLUMN location TEXT;

-- 2. Link Profiles to Employees & Add Permissions
ALTER TABLE public.profiles
    ADD COLUMN employee_id UUID UNIQUE REFERENCES public.employees(id) ON DELETE SET NULL,
    ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;

-- 3. Set up Avatars Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Avatars
-- Note: storage.objects has bucket_id and owner (UUID)

-- Public read access
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Authenticated users can upload avatars
CREATE POLICY "Users can upload avatars."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Authenticated users can update avatars
CREATE POLICY "Users can update avatars."
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Authenticated users can delete avatars
CREATE POLICY "Users can delete avatars."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
