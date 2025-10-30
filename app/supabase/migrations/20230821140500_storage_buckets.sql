-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_images', 'profile_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies for the objects table
-- These policies will be applied to all storage.objects in the profile_images bucket

-- Allow public read access to profile images
CREATE POLICY "Public Access for profile_images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile_images');

-- Allow authenticated users to upload to their own profile folder
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'profile_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'profile_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a function to generate a unique file path for each user
CREATE OR REPLACE FUNCTION get_user_profile_image_path(user_id text, file_name text)
RETURNS text AS $$
BEGIN
  RETURN user_id || '/' || file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
