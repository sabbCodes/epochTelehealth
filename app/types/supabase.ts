// Database types for TypeScript type safety
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          user_type: 'patient' | 'doctor' | 'pharmacy' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          user_type: 'patient' | 'doctor' | 'pharmacy' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          user_type?: 'patient' | 'doctor' | 'pharmacy' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      patient_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          gender: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          profile_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          gender?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          profile_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          profile_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      doctor_profiles: {
        Row: {
          id: string;
          user_profile_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          country: string | null;
          city: string | null;
          gender: 'male' | 'female' | 'other' | null;
          specialization: string;
          license_number: string;
          years_of_experience: number | null;
          education: string | null;
          certifications: string[] | null;
          languages: string[] | null;
          consultation_fee: number | null;
          wallet_address: string | null;
          profile_image: string | null;
          bio: string | null;
          availability_schedule: Json | null;
          created_at: string;
          updated_at: string;
          is_verified: boolean;
        };
        Insert: {
          id?: string;
          user_profile_id: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          country?: string | null;
          city?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          specialization: string;
          license_number: string;
          years_of_experience?: number | null;
          education?: string | null;
          certifications?: string[] | null;
          languages?: string[] | null;
          consultation_fee?: number | null;
          wallet_address?: string | null;
          profile_image?: string | null;
          bio?: string | null;
          availability_schedule?: Json | null;
          created_at?: string;
          updated_at?: string;
          is_verified?: boolean;
        };
        Update: {
          id?: string;
          user_profile_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          country?: string | null;
          city?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          specialization?: string;
          license_number?: string;
          years_of_experience?: number | null;
          education?: string | null;
          certifications?: string[] | null;
          languages?: string[] | null;
          consultation_fee?: number | null;
          wallet_address?: string | null;
          profile_image?: string | null;
          bio?: string | null;
          availability_schedule?: Json | null;
          created_at?: string;
          updated_at?: string;
          is_verified?: boolean;
        };
      };
      // Add other profile tables (pharmacy_profiles, etc.) as needed
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
