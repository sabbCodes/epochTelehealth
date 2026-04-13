'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

type AdminProfile = Database["public"]["Tables"]["user_profiles"]["Row"] & {
  full_name?: string;
  role?: string;
  department?: string;
  profile_image?: string;
};

interface UseAdminProfileReturn {
  adminProfile: AdminProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

export function useAdminProfile(): UseAdminProfileReturn {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const fetchAdminProfile = async (providedSession: Session | null = null) => {
    let session = providedSession;

    if (!session) {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!currentSession) {
          setAdminProfile(null);
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

      if (!userProfile || userProfile.user_type !== 'admin') {
        setAdminProfile(null);
        setIsAuthenticated(true);
        setError('Admin profile not found');
        return;
      }

      // Admin data is currently mostly in user_profiles, 
      // but we combine it for consistency with other hooks
      const combinedData: AdminProfile = {
        ...userProfile,
        full_name: 'System Administrator',
        role: 'Super Admin',
        department: 'Management',
        profile_image: '/placeholder.svg',
      };
      
      setAdminProfile(combinedData);
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load admin profile');
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const refresh = async () => {
    await fetchAdminProfile();
  };

  return {
    adminProfile,
    loading,
    error,
    isAuthenticated,
    refresh,
  };
}

export function getAdminInitials(name?: string): string {
  if (!name) return 'A';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}
