"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  const [patientProfileId, setPatientProfileId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string>("");

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
          // When the current user is a doctor, remoteUserId is the patient_profiles.id
          if (roleParam === "doctor") {
            setPatientProfileId(remoteUserId);
          }
        }

        // 2. Read room URL from schedule (do NOT create a room here)
        const { data: scheduleRow, error: scheduleError } = await supabase
          .from("schedules")
          .select("room_url, doctor_id, patient_id")
          .eq("id", appointmentId)
          .single();

        if (scheduleError) {
          console.warn("Could not fetch schedule row:", scheduleError);
          throw scheduleError;
        }

        if (scheduleRow.doctor_id !== currentUser.id && scheduleRow.patient_id !== currentUser.id) {
          setAuthError("Unauthorized Access: You are not the assigned doctor or patient for this consultation.");
          throw new Error("Unauthorized Access.");
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

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-slate-200 bg-slate-900 border border-red-500/30 p-8 rounded-2xl shadow-2xl max-w-md mx-4">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">{authError}</p>
          <Button onClick={() => window.location.href = '/dashboard'} className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-none font-bold">
            Return to Dashboard
          </Button>
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
      appointmentId={appointmentId}
      patientProfileId={patientProfileId}
    />
  );
}
