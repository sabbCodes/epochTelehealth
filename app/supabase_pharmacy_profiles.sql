-- Create pharmacy_profiles table
CREATE TABLE IF NOT EXISTS public.pharmacy_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    pharmacy_name TEXT NOT NULL,
    contact_person_first_name TEXT NOT NULL,
    contact_person_last_name TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    license_number TEXT NOT NULL,
    operating_hours JSONB,
    services_offered TEXT[],
    delivery_radius_km INTEGER,
    delivery_fee DECIMAL(10,2),
    wallet_address TEXT,
    profile_image TEXT,
    description TEXT,
    certifications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pharmacy_profiles_user_profile_id ON public.pharmacy_profiles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_profiles_license_number ON public.pharmacy_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_pharmacy_profiles_city ON public.pharmacy_profiles(city);

-- Enable Row Level Security
ALTER TABLE public.pharmacy_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pharmacy profile" ON public.pharmacy_profiles
    FOR SELECT USING (
        user_profile_id IN (
            SELECT id FROM public.user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Users can update their own pharmacy profile" ON public.pharmacy_profiles
    FOR UPDATE USING (
        user_profile_id IN (
            SELECT id FROM public.user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Users can insert their own pharmacy profile" ON public.pharmacy_profiles
    FOR INSERT WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Allow public read access for pharmacy listings (patients need to see pharmacy info)
CREATE POLICY "Public can view pharmacy profiles for listings" ON public.pharmacy_profiles
    FOR SELECT USING (true);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_pharmacy_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_pharmacy_profiles_updated_at_column 
    BEFORE UPDATE ON public.pharmacy_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_pharmacy_profiles_updated_at_column();
