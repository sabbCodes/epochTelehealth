-- Add new columns for file uploads
ALTER TABLE public.pharmacy_profiles
ADD COLUMN IF NOT EXISTS license_url TEXT,
ADD COLUMN IF NOT EXISTS registration_url TEXT;

-- Drop the certifications array column if it exists
ALTER TABLE public.pharmacy_profiles
DROP COLUMN IF EXISTS certifications;

-- Update RLS policies to include new columns in the same way as other columns
-- No need to recreate existing policies, just adding a comment for documentation
-- The existing policies will automatically apply to the new columns

-- Add comments for documentation
COMMENT ON COLUMN public.pharmacy_profiles.license_url IS 'URL to the uploaded pharmacy license file';
COMMENT ON COLUMN public.pharmacy_profiles.registration_url IS 'URL to the uploaded business registration file';
