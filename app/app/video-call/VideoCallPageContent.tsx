"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalMedia } from "@whereby.com/browser-sdk/react";
import { WherebyVideoCall } from "./WherebyVideoCall";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function VideoCallPageContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams?.get("appointmentId") || "";
  const roleParam =
    (searchParams?.get("role") as "doctor" | "patient") || "patient";

  const [roomUrl, setRoomUrl] = useState<string>("");
  const [localUser, setLocalUser] = useState<any>(null);
  const [remoteUser, setRemoteUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  const localMedia = useLocalMedia({
    video: isVideoOn,
    audio: isAudioOn,
  });

  const { userProfile: currentUser } = useUserProfile();
  const { toast } = useToast();

  // Create/fetch room and user data
  useEffect(() => {
    const setupCall = async () => {
      if (!appointmentId || !currentUser) return;

      try {
        // 1. Fetch user data first
        const localUserData = await fetchUserDetails(currentUser.id, roleParam);
        setLocalUser(localUserData);

        const remoteUserId = await fetchRemoteParticipant(
          appointmentId,
          roleParam
        );
        let remoteUserData = null;

        if (remoteUserId) {
          const remoteUserRole = roleParam === "doctor" ? "patient" : "doctor";
          remoteUserData = await fetchUserDetails(remoteUserId, remoteUserRole);
          setRemoteUser(remoteUserData);
        }

        // 2. Read room URL from schedule (do NOT create a room here)
        const { data: scheduleRow, error: scheduleError } = await supabase
          .from("schedules")
          .select("room_url")
          .eq("id", appointmentId)
          .single();

        if (scheduleError) {
          console.warn("Could not fetch schedule row:", scheduleError);
          throw scheduleError;
        }

        const roomUrl = scheduleRow?.room_url;

        if (!roomUrl) {
          // Room must be pre-created and stored in schedules.room_url
          throw new Error(
            "No room URL found for this appointment. Ensure `schedules.room_url` is populated."
          );
        }

        setRoomUrl(roomUrl);
      } catch (error) {
        console.error("Error setting up call:", error);
        toast({
          title: "Error",
          description: `Failed to set up video call; ${error}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    setupCall();
  }, [appointmentId, currentUser, roleParam, toast]);

  const fetchUserDetails = async (
    userId: string,
    userRole: "doctor" | "patient"
  ) => {
    try {
      const tableName =
        userRole === "doctor" ? "doctor_profiles" : "patient_profiles";

      // First get the profile data using profile id
      const { data: profileData, error: profileError } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // Then get the user profile for email using user_profile_id from profile table
      const userProfileId = profileData?.user_profile_id;
      let email = "";

      if (userProfileId) {
        const { data: userProfileData, error: userError } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("id", userProfileId)
          .single();

        if (userError) {
          console.warn("Error fetching user email:", userError);
        } else {
          email = userProfileData?.email || "";
        }
      }

      return {
        id: userId,
        first_name: profileData?.first_name || "",
        last_name: profileData?.last_name || "",
        profile_image: profileData?.profile_image || "",
        email: email,
        role: userRole === "doctor" ? "Doctor" : "Patient",
        specialization:
          userRole === "doctor" ? profileData?.specialization : undefined,
        years_of_experience:
          userRole === "doctor" ? profileData?.years_of_experience : undefined,
      };
    } catch (error) {
      console.error(`Error fetching ${userRole} details:`, error);
      return null;
    }
  };

  const fetchRemoteParticipant = async (
    apptId: string,
    currentUserRole: string
  ): Promise<string | null> => {
    if (!apptId) return null;

    try {
      const { data: schedule, error: apptError } = await supabase
        .from("schedules")
        .select("doctor_id, patient_id")
        .eq("id", apptId)
        .single();

      if (apptError) throw apptError;
      if (!schedule) return null;

      return currentUserRole === "doctor"
        ? schedule.patient_id
        : schedule.doctor_id;
    } catch (error) {
      console.error("Error fetching remote participant:", error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Setting up your call...</p>
        </div>
      </div>
    );
  }

  if (!roomUrl) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Unable to start call</h2>
          <p className="text-gray-300">Could not create video room.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <WherebyVideoCall
      roomUrl={roomUrl}
      localUser={localUser}
      remoteUser={remoteUser}
      role={roleParam}
      localMedia={localMedia}
    />
  );
}
