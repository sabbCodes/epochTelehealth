import { supabase } from './supabase';

export interface DoctorProfile {
  id: string;
  user_profile_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  years_of_experience: number;
  consultation_fee: number | null;
  profile_image: string | null;
  city: string | null;
  country: string | null;
  languages: string[] | null;
  rating?: number;
  reviews_count?: number;
  is_verified?: boolean;
  education?: string[] | null;
  // certifications?: string[] | null;
  bio?: string | null;
  name?: string | null;
  wallet_address?: string | null;
}

export async function fetchDoctorById(id: string): Promise<DoctorProfile | null> {
  try {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select(`
        id,
        user_profile_id,
        first_name,
        last_name,
        specialization,
        years_of_experience,
        consultation_fee,
        profile_image,
        city,
        country,
        languages,
        bio,
        education,
        is_verified,
        wallet_address
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    return null;
  }
}

export async function fetchDoctors({
  searchQuery = '',
  specialty = 'all',
}: {
  searchQuery?: string;
  specialty?: string;
} = {}): Promise<DoctorProfile[]> {
  try {
    let query = supabase
      .from('doctor_profiles')
      .select(`
        id,
        user_profile_id,
        first_name,
        last_name,
        specialization,
        years_of_experience,
        consultation_fee,
        profile_image,
        city,
        country,
        languages,
        bio,
        education,
        is_verified,
        wallet_address
      `)
      .eq('is_verified', true)
      .order('first_name', { ascending: true });

    // Apply search filter
    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,specialization.ilike.%${searchQuery}%`
      );
    }

    // Apply specialty filter
    if (specialty && specialty !== 'all') {
      query = query.eq('specialization', specialty);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }

    // Transform data to match the expected format
    return (data || []).map((doctor) => ({
      ...doctor,
      name: `${doctor.first_name} ${doctor.last_name}`,
      location: [doctor.city, doctor.country].filter(Boolean).join(', '),
      // Add mock rating and reviews for now - in a real app, this would come from a reviews table
      rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5 and 5.0
      reviews_count: Math.floor(Math.random() * 100) + 10, // Random reviews between 10-110
      // Ensure all required fields are included
      bio: doctor.bio || null,
      education: doctor.education || null,
      is_verified: doctor.is_verified || false,
      wallet_address: doctor.wallet_address || null,
    }));
  } catch (error) {
    console.error('Unexpected error fetching doctors:', error);
    return [];
  }
}

// Get unique specialties for the filter dropdown
export async function getDoctorSpecialties(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('specialization')
      .eq('is_verified', true);

    if (error) throw error;

    const specialties = new Set<string>();
    data?.forEach((doc) => {
      if (doc.specialization) {
        specialties.add(doc.specialization);
      }
    });

    return Array.from(specialties).sort();
  } catch (error) {
    console.error('Error fetching specialties:', error);
    return [];
  }
}
