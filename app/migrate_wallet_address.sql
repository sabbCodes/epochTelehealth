-- Migration: Move wallet_address from user_profiles to patient_profiles

-- Step 1: Add wallet_address column to patient_profiles
ALTER TABLE patient_profiles 
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Step 2: Copy wallet_address data from user_profiles to patient_profiles
UPDATE patient_profiles 
SET wallet_address = up.wallet_address
FROM user_profiles up
WHERE patient_profiles.user_profile_id = up.id
AND up.wallet_address IS NOT NULL;

-- Step 3: Remove wallet_address column from user_profiles
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS wallet_address;
