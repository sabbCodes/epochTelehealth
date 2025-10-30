'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

type DoctorProfile = Database["public"]["Tables"]["doctor_profiles"]["Row"] & {
  profile_image?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  wallet_address?: string;
  specialization?: string;
  experience_years?: number;
  rating?: number;
  total_reviews?: number;
  consultation_fee?: number;
  total_patients?: number;
  monthly_earnings?: number;
  today_appointments_count?: number;
};

interface UseDoctorProfileReturn {
  doctorProfile: DoctorProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

export function useDoctorProfile(): UseDoctorProfileReturn {
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const fetchDoctorProfile = async (providedSession: Session | null = null) => {
    let session = providedSession;

    // If no session provided, try to get the current session
    if (!session) {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }
        
        if (!currentSession) {
          console.warn('No active session found');
          setDoctorProfile(null);
          setIsAuthenticated(false);
          setError('No active session. Please sign in.');
          setLoading(false);
          return;
        }
        
        session = currentSession;
      } catch (err) {
        console.error('Error in session handling:', err);
        setError('Failed to verify session. Please try again.');
        setLoading(false);
        return;
      }
    }

    if (!session?.user?.id) {
      console.log('No user ID found in session');
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    setLoading(true);
    setError(null);
    const userId = session.user.id;

    try {
      // First get the user profile to verify user type
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userProfileError) throw userProfileError;

      if (!userProfile || userProfile.user_type !== 'doctor') {
        console.log('User is not a doctor');
        setDoctorProfile(null);
        setIsAuthenticated(true);
        setError('Doctor profile not found');
        return;
      }

      // Get the doctor profile with a join to user_profiles for email
      const { data: doctorProfileData, error: doctorProfileError } = await supabase
        .from('doctor_profiles')
        .select(`
          *,
          user_profiles:user_profile_id (email, user_type)
        `)
        .eq('user_profile_id', userId)
        .single();

      if (doctorProfileError) throw doctorProfileError;
      if (!doctorProfileData) throw new Error('Doctor profile not found');

      // Combine the data from both tables
      const combinedData: DoctorProfile = {
        ...doctorProfileData,
        email: doctorProfileData.user_profiles?.email || userProfile.email,
        full_name: `${doctorProfileData.first_name || ''} ${doctorProfileData.last_name || ''}`.trim() || 'Doctor',
        profile_image: doctorProfileData.profile_image || '/placeholder.svg',
        wallet_address: doctorProfileData.wallet_address,
        specialization: doctorProfileData.specialization,
        experience_years: doctorProfileData.years_of_experience,
        // Add other fields as needed
      };
      
      setDoctorProfile(combinedData);
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load doctor profile');
      setDoctorProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  // Refresh function to manually refetch data
  const refresh = async () => {
    await fetchDoctorProfile();
  };

  return {
    doctorProfile,
    loading,
    error,
    isAuthenticated,
    refresh,
  };
}

// Helper function to get initials from a name
export function getDoctorInitials(name?: string): string {
  if (!name) return 'D';
  
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}
