"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { Session } from "@supabase/supabase-js";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"] & {
  profile_image?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  wallet_address?: string;
};

interface UseUserProfileReturn {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useUserProfile(): UseUserProfileReturn {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const fetchInProgress = useRef<boolean>(false);
  const authListener = useRef<{ unsubscribe: () => void } | null>(null);

  const fetchUserProfile = async (session: Session | null = null) => {
    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    console.log(
      "fetchUserProfile called with session:",
      session ? "session exists" : "no session"
    );

    fetchInProgress.current = true;

    try {
      setLoading(true);
      setError(null);

      // If no session provided, try to get the current session
      if (!session) {
        console.log("No session provided, trying to get current session...");
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setError("Failed to retrieve session");
          setLoading(false);
          return null;
        }

        if (!currentSession) {
          console.warn("No active session found");
          setUserProfile(null);
          setIsAuthenticated(false);
          setError("No active session. Please sign in.");
          setLoading(false);
          return null;
        }

        session = currentSession;
      }

      console.log("Starting to fetch user profile...");
      setLoading(true);
      setError(null);

      // Get the current user
      console.log("Fetching user from auth...");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log("User fetch result:", { user, userError });

      if (userError || !user) {
        const errorMsg = userError?.message || "No user object returned";
        console.warn("No user found in session:", errorMsg);
        setUserProfile(null);
        setIsAuthenticated(false);
        setError("User not found in session.");
        setLoading(false);
        return null;
      }

      // Get the base user profile
      console.log("Fetching base user profile for user ID:", user.id);

      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("Base profile query result:", { userProfile, profileError });

      if (profileError || !userProfile) {
        console.error("Error fetching user profile:", profileError);
        throw new Error(profileError?.message || "Failed to load user profile");
      }

      // If we got this far, we have a valid session and user profile
      setIsAuthenticated(true);

      // Get the detailed profile based on user type
      if (userProfile.user_type) {
        const profileTable = `${userProfile.user_type}_profiles`;
        console.log(`Looking for detailed profile in table: ${profileTable}`);

        const { data: detailedProfile, error: detailedError } = await supabase
          .from(profileTable)
          .select("*")
          .eq("user_profile_id", userProfile.id)
          .maybeSingle();

        if (detailedError) {
          console.warn(
            `Error fetching ${userProfile.user_type} profile:`,
            detailedError
          );
        }

        // Merge the detailed profile with the base profile
        const mergedProfile = {
          ...userProfile,
          ...(detailedProfile || {}),
          user_type: userProfile.user_type,
          email: user.email,
        };

        setUserProfile(mergedProfile);
      } else {
        // If no user_type is set, just use the base profile
        setUserProfile({
          ...userProfile,
          email: user.email,
        });
      }

      return userProfile;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load user profile"
      );
      setUserProfile(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };

  // Handle initial session check and auth state changes
  useEffect(() => {
    let mounted = true;
    let debounceTimer: NodeJS.Timeout;

    const initialize = async () => {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log("Initial session found, fetching profile...");
        await fetchUserProfile(session);
      } else {
        console.log("No initial session found");
        setLoading(false);
        setIsAuthenticated(false);
      }
    };

    // Debounced version of fetchUserProfile
    const debouncedFetchProfile = (session: Session) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (mounted) {
          fetchUserProfile(session);
        }
      }, 100); // 100ms debounce
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);

        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setUserProfile(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          debouncedFetchProfile(session);
        }
      }
    );

    // Store the subscription for cleanup
    authListener.current = subscription;

    // Initialize the hook
    initialize();

    // Cleanup function
    return () => {
      mounted = false;
      clearTimeout(debounceTimer);
      if (authListener.current) {
        authListener.current.unsubscribe();
      }
    };
  }, []);

  return { userProfile, loading, error, isAuthenticated };
}

// Helper function to get initials from a name
export function getInitials(name?: string): string {
  if (!name) return "U";

  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
