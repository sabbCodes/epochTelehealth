"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageCircle,
  Share,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabase";
import { VideoParticipant } from "@/components/video/VideoParticipant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  email?: string;
  role?: string;
};

export default function VideoCallPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams?.get("appointmentId") || "";
  const roleParam = (searchParams?.get("role") as "doctor" | "patient") || "patient";

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActiveOverlay, setIsCallActiveOverlay] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [remoteUser, setRemoteUser] = useState<UserProfile | null>(null);
  const [localUser, setLocalUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { userProfile: currentUser } = useUserProfile();
  const { toast } = useToast();
  const fetchInProgress = useRef(false);

  const {
    localStream,
    remoteStream,
    connectionStatus,
    isCallActive,
    toggleAudio,
    toggleVideo,
    endCall: endCallHook,
    error,
  } = useWebRTC(roleParam as 'doctor' | 'patient', appointmentId);

  useEffect(() => {
    if (isCallActive) {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isCallActive])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const endCall = () => {
    endCallHook();
    setIsCallActiveOverlay(false)

    const redirectPath = roleParam === 'doctor' ? '/doctor-dashboard' : '/dashboard';

    setTimeout(() => {
      window.location.href = redirectPath;
    }, 1000)
  }

  // Fetch user details from the appropriate profile table
  const fetchUserDetails = useCallback(async (userId: string, userRole: 'doctor' | 'patient') => {
    if (!userId || fetchInProgress.current) return null;
    
    fetchInProgress.current = true;
    try {
      const tableName = userRole === 'doctor' ? 'doctor_profiles' : 'patient_profiles';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      // Map the data to our UserProfile type
      return {
        id: userId,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        profile_image: data.profile_image || '',
        email: data.email || '',
        role: userRole === 'doctor' ? 'Doctor' : 'Patient'
      } as UserProfile;
    } catch (error) {
      console.error(`Error fetching ${userRole} details:`, error);
      return null;
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  // Fetch the remote participant's ID based on appointment ID
  const fetchRemoteParticipant = useCallback(async (apptId: string, currentUserRole: string) => {
    if (!apptId) return null;
    
    try {
      // First, get the appointment details
      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select('doctor_id, patient_id')
        .eq('id', apptId)
        .single();

      if (apptError) throw apptError;
      if (!appointment) return null;

      // Determine the remote user ID based on current user's role
      const remoteUserId = currentUserRole === 'doctor' 
        ? appointment.patient_id 
        : appointment.doctor_id;

      return remoteUserId;
    } catch (error) {
      console.error('Error fetching remote participant:', error);
      return null;
    }
  }, []);

  // Set up user data when the component mounts
  useEffect(() => {
    const setupUsers = async () => {
      if (!appointmentId) {
        console.error('No appointment ID provided');
        toast({
          title: 'Error',
          description: 'No appointment ID provided',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      try {
        // Set local user from current user profile
        if (currentUser) {
          const localUserRole = roleParam as 'doctor' | 'patient';
          const localProfile = await fetchUserDetails(currentUser.id, localUserRole);
          
          if (localProfile) {
            setLocalUser({
              ...localProfile,
              first_name: localProfile.first_name || 'You',
              role: roleParam.charAt(0).toUpperCase() + roleParam.slice(1)
            });
          } else {
            setLocalUser({
              id: currentUser.id,
              first_name: currentUser.first_name || 'You',
              last_name: currentUser.last_name || '',
              profile_image: currentUser.profile_image,
              email: currentUser.email || '',
              role: roleParam.charAt(0).toUpperCase() + roleParam.slice(1)
            });
          }

          // Get the remote participant's ID based on the appointment
          const remoteUserId = await fetchRemoteParticipant(appointmentId, roleParam);
          if (remoteUserId) {
            const remoteUserRole = roleParam === 'doctor' ? 'patient' : 'doctor';
            const remoteUserData = await fetchUserDetails(remoteUserId, remoteUserRole);
            
            if (remoteUserData) {
              setRemoteUser(remoteUserData);
            } else {
              console.warn('Could not fetch remote user details, using fallback');
              setRemoteUser({
                id: remoteUserId,
                first_name: roleParam === 'doctor' ? 'Patient' : 'Doctor',
                last_name: '',
                role: roleParam === 'doctor' ? 'Patient' : 'Doctor'
              });
            }
          } else {
            console.warn('Could not determine remote participant, using fallback');
            setRemoteUser({
              id: 'unknown',
              first_name: roleParam === 'doctor' ? 'Patient' : 'Doctor',
              last_name: '',
              role: roleParam === 'doctor' ? 'Patient' : 'Doctor'
            });
          }
        }
      } catch (error) {
        console.error('Error setting up users:', error);
      } finally {
        setLoading(false);
      }
    };

    setupUsers();
  }, [currentUser, fetchUserDetails, roleParam]);

  // Surface errors as toasts instead of in-page banner
  useEffect(() => {
    if (error) {
      toast({ title: "Call error", description: String(error) });
    }
  }, [error, toast]);

  // Optional: notify on connect/disconnect
  useEffect(() => {
    if (connectionStatus === "connected") {
      toast({ title: "Connected", description: "You are now connected." });
    } else if (connectionStatus === "error") {
      toast({ title: "Connection issue", description: "There was a problem with the call." });
    }
  }, [connectionStatus, toast]);

  const statusColor =
    connectionStatus === 'connected'
      ? 'bg-green-500'
      : connectionStatus === 'connecting'
      ? 'bg-yellow-500'
      : connectionStatus === 'error'
      ? 'bg-red-500'
      : 'bg-gray-400';

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

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background Video Areas */}
      <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* Remote Participant Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gray-800 rounded-xl overflow-hidden h-[85vh] lg:h-[80vh]"
        >
          <VideoParticipant
            stream={remoteStream}
            name={`${remoteUser?.first_name || ''} ${remoteUser?.last_name || ''}`.trim() || (roleParam === 'doctor' ? 'Patient' : 'Doctor')}
            role={remoteUser?.role || (roleParam === 'doctor' ? 'Patient' : 'Doctor')}
            profileImage={remoteUser?.profile_image}
            connectionStatus={connectionStatus}
            className="h-full w-full"
          />

          {/* Call Duration */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-white font-mono">{formatTime(callDuration)}</span>
            </div>
          </div>
        </motion.div>

        {/* Local Self Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative bg-gray-800 rounded-xl overflow-hidden lg:block hidden h-[40vh] lg:h-[80vh]"
        >
          <VideoParticipant
            stream={localStream}
            name={localUser?.first_name || 'You'}
            role={localUser?.role || roleParam}
            isLocal
            profileImage={localUser?.profile_image}
            connectionStatus={connectionStatus}
            className="h-full w-full"
          />
        </motion.div>
      </div>

      {/* Mobile Self Video (Picture-in-Picture) */}
      <div className="lg:hidden absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden z-10 border-2 border-white/20">
        <VideoParticipant
          stream={localStream}
          name=""
          role=""
          isLocal
          showInfo={false}
          profileImage={localUser?.profile_image}
          connectionStatus={connectionStatus}
          className="h-full w-full"
        />
      </div>

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-0 left-0 right-0 p-4"
      >
        <Card className="bg-black/50 backdrop-blur-sm border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-4">
              {/* Audio Toggle */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={isAudioOn ? "secondary" : "destructive"}
                  size="lg"
                  className="rounded-full w-12 h-12"
                  onClick={() => {
                    toggleAudio();
                    setIsAudioOn(!isAudioOn);
                  }}
                  disabled={connectionStatus !== "connected" && connectionStatus !== "connecting"}
                >
                  {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
              </motion.div>

              {/* Video Toggle */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={isVideoOn ? "secondary" : "destructive"}
                  size="lg"
                  className="rounded-full w-12 h-12"
                  onClick={() => {
                    toggleVideo();
                    setIsVideoOn(!isVideoOn);
                  }}
                  disabled={connectionStatus !== "connected" && connectionStatus !== "connecting"}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </motion.div>

              {/* End Call */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
                  onClick={endCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </motion.div>

              {/* Chat Toggle */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full w-12 h-12"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </motion.div>

            </div>

            {/* Additional Controls */}
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Button variant="outline" size="sm" className="bg-black/30 border-gray-600 text-white">
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </Button>
              <Button variant="outline" size="sm" className="bg-black/30 border-gray-600 text-white">
                <Share className="w-4 h-4 mr-2" />
                Share Screen
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Connection Status */}
      <div className="absolute top-4 left-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${statusColor}`} />
          <span className="text-white text-sm capitalize">{connectionStatus}</span>
          <span className="text-white/70 text-xs ml-2">Appt: {appointmentId || "(missing)"}</span>
          <span className="text-white/70 text-xs ml-2">Role: {roleParam}</span>
        </div>
      </div>

      {/* Call End Animation */}
      {!isCallActiveOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <div className="text-center text-white">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}>
              <PhoneOff className="w-16 h-16 mx-auto mb-4 text-red-500" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Call Ended</h2>
            <p className="text-gray-300 mb-4">Duration: {formatTime(callDuration)}</p>
            <div className="space-y-2">
              <div className="w-8 h-1 bg-white/30 rounded mx-auto animate-pulse" />
              <p className="text-sm">Redirecting to {roleParam === "doctor" ? "your dashboard" : "payment release page"}...</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
