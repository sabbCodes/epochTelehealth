-- Add missing columns to pharmacy_profiles table
ALTER TABLE public.pharmacy_profiles
ADD COLUMN IF NOT EXISTS accepts_insurance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS minimum_order_value numeric(10,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,2) DEFAULT 2.50,
ADD COLUMN IF NOT EXISTS delivery_radius_km integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS operating_hours jsonb DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00", "isOpen": true},
  "tuesday": {"open": "09:00", "close": "18:00", "isOpen": true},
  "wednesday": {"open": "09:00", "close": "18:00", "isOpen": true},
  "thursday": {"open": "09:00", "close": "18:00", "isOpen": true},
  "friday": {"open": "09:00", "close": "18:00", "isOpen": true},
  "saturday": {"open": "09:00", "close": "14:00", "isOpen": true},
  "sunday": {"open": "00:00", "close": "00:00", "isOpen": false}
}'::jsonb,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS year_established integer,
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS contact_person_first_name text,
ADD COLUMN IF NOT EXISTS contact_person_last_name text,
ADD COLUMN IF NOT EXISTS pharmacy_name text,
ADD COLUMN IF NOT EXISTS wallet_address text,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_providers text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '{
  "prescription": true,
  "otc": true,
  "homeDelivery": true,
  "consultation": false,
  "vaccination": false
}'::jsonb;
