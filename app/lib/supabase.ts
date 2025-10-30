import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types for our user profile
export interface UserProfile {
  id: string;
  email: string;
  user_type: "patient" | "doctor" | "pharmacy" | "admin";
  wallet_address?: string;
  wallet_public_key?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
};

// Helper function to create user profile
export const createUserProfile = async (
  profile: Omit<UserProfile, "created_at" | "updated_at">
) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .insert([profile])
    .select()
    .single();

  return { data, error };
};

// Helper function to update wallet info
export const updateUserWallet = async (
  userId: string,
  walletAddress: string,
  walletPublicKey: string
) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      wallet_address: walletAddress,
      wallet_public_key: walletPublicKey,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  return { data, error };
};
