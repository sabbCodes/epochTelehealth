-- Upgrading doctor_profiles table to support new requirements

ALTER TABLE public.doctor_profiles
  -- Drop the old consultation_fee as we are replacing it with 3 distinct clinical consultation fees
  DROP COLUMN IF EXISTS consultation_fee,
  DROP COLUMN IF EXISTS consultation_fee_45min_video,
  
  -- Add new specialized fee columns
  ADD COLUMN IF NOT EXISTS consultation_fee_30min_chat numeric(10, 2) null,
  ADD COLUMN IF NOT EXISTS consultation_fee_30min_video numeric(10, 2) null,
  ADD COLUMN IF NOT EXISTS consultation_fee_60min_video numeric(10, 2) null,
  
  -- Add new document URL columns
  ADD COLUMN IF NOT EXISTS medical_license_url text null,
  ADD COLUMN IF NOT EXISTS medical_degree_url text null;

-- Make education an array of text
ALTER TABLE public.doctor_profiles
  ALTER COLUMN education TYPE text[] USING string_to_array(education, ',');

-- NOTE: The availability_schedule jsonb null column is already present 
-- and will be populated with the JSON representation of the new detailed schedule.
-- Existing indexes and triggers do not need to be changed for these column additions.
