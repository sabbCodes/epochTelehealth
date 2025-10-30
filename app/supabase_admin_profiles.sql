-- Create admin_profiles table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
    permissions JSONB,
    department TEXT,
    wallet_address TEXT,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_profile_id ON public.admin_profiles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles(role);

-- Enable Row Level Security
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can access admin profiles
CREATE POLICY "Admins can view admin profiles" ON public.admin_profiles
    FOR SELECT USING (
        user_profile_id IN (
            SELECT id FROM public.user_profiles 
            WHERE email = auth.jwt() ->> 'email' 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update admin profiles" ON public.admin_profiles
    FOR UPDATE USING (
        user_profile_id IN (
            SELECT id FROM public.user_profiles 
            WHERE email = auth.jwt() ->> 'email' 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert admin profiles" ON public.admin_profiles
    FOR INSERT WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profiles 
            WHERE email = auth.jwt() ->> 'email' 
            AND user_type = 'admin'
        )
    );

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_admin_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_admin_profiles_updated_at_column 
    BEFORE UPDATE ON public.admin_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_admin_profiles_updated_at_column();
