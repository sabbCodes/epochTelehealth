-- Add certifications column to pharmacy_profiles table
ALTER TABLE public.pharmacy_profiles
ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;
