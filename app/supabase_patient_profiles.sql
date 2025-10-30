-- Create patient_profiles table for detailed patient information
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_profile_id UUID NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    country VARCHAR(100),
    city VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    occupation VARCHAR(100),
    tribe VARCHAR(100),
    marital_status VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT patient_profiles_user_profile_id_fkey 
        FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_profile_id ON patient_profiles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_email ON patient_profiles(first_name, last_name);

-- Enable Row Level Security (RLS)
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can view own patient profile" ON patient_profiles
    FOR SELECT USING (
        user_profile_id IN (
            SELECT id FROM user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own patient profile" ON patient_profiles
    FOR UPDATE USING (
        user_profile_id IN (
            SELECT id FROM user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policy to allow users to insert their own data
CREATE POLICY "Users can insert own patient profile" ON patient_profiles
    FOR INSERT WITH CHECK (
        user_profile_id IN (
            SELECT id FROM user_profiles WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_patient_profiles_updated_at 
    BEFORE UPDATE ON patient_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_patient_profiles_updated_at_column();
