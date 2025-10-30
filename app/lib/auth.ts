import {
  supabase,
  createUserProfile,
  getUserProfile,
  updateUserWallet,
} from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  user_type?: "patient" | "doctor" | "pharmacy" | "admin";
  wallet_address?: string;
  wallet_public_key?: string;
}

export class AuthService {
  // Sign up with email
  static async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Sign up failed",
      };
    }
  }

  // Sign in with email
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  }

  // Sign in with Google
  static async signInWithGoogle() {
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/signin`
          : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Google sign in failed",
      };
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Sign out failed",
      };
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) return { user: null, error: null };

      // Get user profile
      const { data: profile, error: profileError } = await getUserProfile(
        user.id
      );

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected for new users
        throw profileError;
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        user_type: profile?.user_type,
        wallet_address: profile?.wallet_address,
        wallet_public_key: profile?.wallet_public_key,
      };

      return { user: authUser, error: null };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : "Failed to get user",
      };
    }
  }

  // Create user profile
  static async createUserProfile(
    userId: string,
    email: string,
    userType: "patient" | "doctor" | "pharmacy" | "admin"
  ) {
    try {
      const { data, error } = await createUserProfile({
        id: userId,
        email,
        user_type: userType,
        wallet_address: undefined,
        wallet_public_key: undefined,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to create profile",
      };
    }
  }

  // Update wallet info
  static async updateWallet(
    userId: string,
    walletAddress: string,
    walletPublicKey: string
  ) {
    try {
      const { data, error } = await updateUserWallet(
        userId,
        walletAddress,
        walletPublicKey
      );

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to update wallet",
      };
    }
  }

  // Check if user exists
  static async checkUserExists(email: string) {
    try {
      const {
        data: { users },
        error,
      } = await supabase.auth.admin.listUsers();

      if (error) throw error;

      const user = users?.find((u) => u.email === email);
      return { exists: !!user, user, error: null };
    } catch (error) {
      return {
        exists: false,
        user: null,
        error: error instanceof Error ? error.message : "Failed to check user",
      };
    }
  }

  // Check if user email is verified
  static async checkEmailVerification() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      // Consider the user verified if they have an email and either:
      // 1. They have a confirmed email timestamp, OR
      // 2. They signed in with an OAuth provider (indicated by identities array)
      const isVerified = user?.email && (
        user.email_confirmed_at !== null || 
        (user.identities && user.identities.length > 0)
      );

      return {
        isVerified,
        user,
        error: null,
      };
    } catch (error) {
      return {
        isVerified: false,
        user: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check verification",
      };
    }
  }
}
