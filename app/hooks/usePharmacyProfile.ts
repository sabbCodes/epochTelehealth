'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

// Define localized types if not in Database interface
type PharmacyProfile = {
  id: string;
  user_profile_id: string;
  pharmacy_name: string;
  contact_person_first_name: string;
  contact_person_last_name: string;
  license_number: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  profile_image: string | null;
  wallet_address: string | null;
  is_verified: boolean;
  operating_hours: any;
  email?: string;
};

interface UsePharmacyProfileReturn {
  pharmacyProfile: PharmacyProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

export function usePharmacyProfile(): UsePharmacyProfileReturn {
  const [pharmacyProfile, setPharmacyProfile] = useState<PharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const fetchPharmacyProfile = async (providedSession: Session | null = null) => {
    let session = providedSession;

    if (!session) {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!currentSession) {
          setPharmacyProfile(null);
          setIsAuthenticated(false);
          setError('No active session.');
          setLoading(false);
          return;
        }
        session = currentSession;
      } catch (err) {
        setError('Failed to verify session.');
        setLoading(false);
        return;
      }
    }

    if (!session?.user?.id) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    setLoading(true);
    setError(null);
    const userId = session.user.id;

    try {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userProfileError) throw userProfileError;

      if (!userProfile || userProfile.user_type !== 'pharmacy') {
        setPharmacyProfile(null);
        setIsAuthenticated(true);
        setError('Pharmacy profile not found');
        return;
      }

      const { data: pharmData, error: pharmError } = await supabase
        .from('pharmacy_profiles')
        .select('*')
        .eq('user_profile_id', userId)
        .single();

      if (pharmError && pharmError.code !== 'PGRST116') throw pharmError;

      if (pharmData) {
        setPharmacyProfile({
          ...pharmData,
          email: userProfile.email,
        });
      } else {
        // Fallback for profile creation stage
        setPharmacyProfile({
            id: '',
            user_profile_id: userId,
            pharmacy_name: 'New Pharmacy',
            contact_person_first_name: '',
            contact_person_last_name: '',
            license_number: '',
            phone: '',
            country: '',
            city: '',
            address: '',
            profile_image: null,
            wallet_address: null,
            is_verified: false,
            operating_hours: {},
            email: userProfile.email,
        });
      }
      
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load pharmacy profile');
      setPharmacyProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyProfile();
  }, []);

  const refresh = async () => {
    await fetchPharmacyProfile();
  };

  return {
    pharmacyProfile,
    loading,
    error,
    isAuthenticated,
    refresh,
  };
}

export function getPharmacyInitials(name?: string): string {
  if (!name) return 'P';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}
