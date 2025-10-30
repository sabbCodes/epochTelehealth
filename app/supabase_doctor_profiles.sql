-- Create doctor_profiles table
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    city TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    specialization TEXT NOT NULL,
    license_number TEXT NOT NULL,
    years_of_experience INTEGER,
    education TEXT,
    certifications TEXT[],
    languages TEXT[],
    consultation_fee DECIMAL(10,2),
    wallet_address TEXT,
    profile_image TEXT,
    bio TEXT,
    availability_schedule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_profile_id ON public.doctor_profiles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialization ON public.doctor_profiles(specialization);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_license_number ON public.doctor_profiles(license_number);

-- Enable Row Level Security
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own doctor profile" ON public.doctor_profiles
    FOR SELECT USING (
        user_profile_id IN (
            SELECT id FROM public.user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Users can update their own doctor profile" ON public.doctor_profiles
    FOR UPDATE USING (
        user_profile_id IN (
            SELECT id FROM public.user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Users can insert their own doctor profile" ON public.doctor_profiles
    FOR INSERT WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Allow public read access for doctor listings (patients need to see doctor info)
CREATE POLICY "Public can view doctor profiles for listings" ON public.doctor_profiles
    FOR SELECT USING (true);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_doctor_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_doctor_profiles_updated_at_column 
    BEFORE UPDATE ON public.doctor_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_doctor_profiles_updated_at_column();
