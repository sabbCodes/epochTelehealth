-- Add is_verified column to doctor_profiles table
ALTER TABLE public.doctor_profiles 
ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;

-- Add comment for the column
COMMENT ON COLUMN public.doctor_profiles.is_verified IS 'Indicates if the doctor''s profile has been verified by an admin';

-- Create an index for faster querying of unverified doctors
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_is_verified ON public.doctor_profiles (is_verified);

-- Update RLS policies if needed
DROP POLICY IF EXISTS "Enable read access for all users" ON public.doctor_profiles;

-- Recreate the select policy to include the new column
CREATE POLICY "Enable read access for all users" 
ON public.doctor_profiles 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- Update insert/update policies if needed
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.doctor_profiles;

CREATE POLICY "Enable insert for authenticated users only" 
ON public.doctor_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Add update policy for admins to update verification status
DROP POLICY IF EXISTS "Enable update for admins" ON public.doctor_profiles;

CREATE POLICY "Enable update for admins" 
ON public.doctor_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.role() = 'authenticated' AND auth.uid() = id)
WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    -- Users can update their own profile except verification status
    (auth.uid() = id AND is_verified = (SELECT is_verified FROM doctor_profiles WHERE id = auth.uid()))
    OR
    -- Admins can update verification status
    (auth.jwt() ->> 'role' = 'service_role')
  )
);
