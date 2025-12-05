"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRoomConnection,
  VideoView,
  useLocalMedia,
} from "@whereby.com/browser-sdk/react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageCircle,
  Clock,
  FileText,
  Monitor,
  Plus,
  Send,
  AlertCircle,
  Pill,
  Stethoscope,
  X,
  ChevronDown,
  Circle,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Declare Miro BoardsPicker on window
declare global {
  interface Window {
    miroBoardsPicker: any;
  }
}

interface WherebyVideoCallProps {
  roomUrl: string;
  localUser?: any;
  remoteUser?: any;
  localMedia: any;
  role: "doctor" | "patient";
}

export function WherebyVideoCall({
  roomUrl,
  localUser,
  remoteUser,
  role,
  localMedia,
}: WherebyVideoCallProps) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [remoteVideoTrackEnabled, setRemoteVideoTrackEnabled] = useState(true);
  const [remoteAudioTrackEnabled, setRemoteAudioTrackEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [selectedShareType, setSelectedShareType] = useState<
    "screen" | "whiteboard" | null
  >(null);
  const [miroEmbedHtml, setMiroEmbedHtml] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Whereby room connection
  const roomConnection = useRoomConnection(roomUrl, {
    localMedia,
  });

  const { state, actions } = roomConnection;
  const {
    localParticipant,
    remoteParticipants,
    screenshares,
    connectionStatus,
    chatMessages,
  } = state;
  const {
    joinRoom,
    toggleCamera,
    toggleMicrophone,
    startScreenshare,
    stopScreenshare,
    leaveRoom,
    startCloudRecording,
    stopCloudRecording,
    sendChatMessage,
  } = actions;

  // Auto-join the room when component mounts
  useEffect(() => {
    if (!hasJoined && connectionStatus !== "connected") {
      joinRoom()
        .then(() => {
          setHasJoined(true);
          setIsCallActive(true);
        })
        .catch((error) => {
          console.error("Failed to join room:", error);
        });
    }
  }, [hasJoined, joinRoom, connectionStatus, roomUrl]);

  // Update call duration
  useEffect(() => {
    if (isCallActive && connectionStatus === "connected") {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isCallActive, connectionStatus]);

  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === "connected") {
      setIsCallActive(true);
    } else if (
      connectionStatus === "disconnected" ||
      connectionStatus === "left" ||
      connectionStatus === "kicked"
    ) {
      setIsCallActive(false);
      setTimeout(() => {
        const redirectPath =
          role === "doctor" ? "/doctor-dashboard" : "/dashboard";
        window.location.href = redirectPath;
      }, 2000);
    }
  }, [connectionStatus, role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load Miro SDK on component mount
  useEffect(() => {
    console.log("📦 Setting up Miro BoardsPicker loader...");

    if (document.querySelector('script[src*="boardsPicker"]')) {
      console.log("✅ Miro BoardsPicker script already exists in DOM");
      return;
    }

    const script = document.createElement("script");
    // Use the BoardsPicker SDK, not the Web SDK
    script.src = "https://miro.com/app/static/boardsPicker.js";
    script.async = true;
    script.type = "text/javascript";

    script.onload = () => {
      console.log("✅ Miro BoardsPicker script loaded successfully");
      console.log(
        "🎨 window.miroBoardsPicker available:",
        !!window.miroBoardsPicker
      );
    };

    script.onerror = () => {
      console.error("❌ Failed to load Miro BoardsPicker script");
      console.log("📍 Script source was:", script.src);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: Remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
        console.log("🧹 Miro BoardsPicker script removed");
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Monitor remote participant video track state
  useEffect(() => {
    if (remoteParticipants[0]?.stream) {
      const videoTracks = remoteParticipants[0].stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        setRemoteVideoTrackEnabled(videoTrack.enabled);

        const handleTrackChange = () => {
          setRemoteVideoTrackEnabled(videoTrack.enabled);
        };

        videoTrack.addEventListener("enabledchange", handleTrackChange);

        return () => {
          videoTrack.removeEventListener("enabledchange", handleTrackChange);
        };
      }
    }
  }, [remoteParticipants]);

  // Monitor remote participant audio track state
  useEffect(() => {
    if (remoteParticipants[0]?.stream) {
      const audioTracks = remoteParticipants[0].stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        setRemoteAudioTrackEnabled(audioTrack.enabled);

        const handleTrackChange = () => {
          setRemoteAudioTrackEnabled(audioTrack.enabled);
        };

        audioTrack.addEventListener("enabledchange", handleTrackChange);

        return () => {
          audioTrack.removeEventListener("enabledchange", handleTrackChange);
        };
      }
    }
  }, [remoteParticipants]);

  // Helper function to check if video track is actually enabled
  const isVideoTrackEnabled = (
    stream: MediaStream | null | undefined
  ): boolean => {
    if (!stream) return false;
    const videoTracks = stream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].enabled;
  };

  // Helper function to check if remote participant video is actually enabled
  const isRemoteVideoEnabled = (participant: any): boolean => {
    // Check both SDK property and actual track state
    const sdkEnabled = participant?.isVideoEnabled;
    const trackEnabled = isVideoTrackEnabled(participant?.stream);

    // Debug logging
    console.log("Remote video state:", {
      participantId: participant?.id,
      sdkEnabled,
      trackEnabled,
      hasStream: !!participant?.stream,
    });

    return sdkEnabled && trackEnabled;
  };

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim()) {
      sendChatMessage(newMessage);
      setNewMessage("");
    }
  }, [newMessage, sendChatMessage]);

  const toggleVideo = () => {
    const newState = !isCameraEnabled;
    toggleCamera(newState);
    setIsCameraEnabled(newState);
    setIsVideoOn(newState);
  };

  const toggleAudio = () => {
    const newState = !isMicrophoneEnabled;
    toggleMicrophone(newState);
    setIsMicrophoneEnabled(newState);
    setIsAudioOn(newState);
  };

  const endCall = () => {
    leaveRoom();
    setIsCallActive(false);
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenshare();
      } else {
        await startScreenshare();
      }
      setIsScreenSharing(!isScreenSharing);
      setSelectedShareType("screen");
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        await stopCloudRecording();
      } else {
        await startCloudRecording();
      }
      setIsRecording(!isRecording);
    } catch (error) {
      console.error("Error toggling recording:", error);
    }
  };

  const handleShareTypeSelect = async (type: "screen" | "whiteboard") => {
    console.log("🔄 handleShareTypeSelect called with type:", type);
    setSelectedShareType(type);

    if (type === "screen") {
      console.log("📺 Starting screen share...");
      await toggleScreenShare();
    } else if (type === "whiteboard") {
      console.log("🎨 Opening Miro BoardsPicker...");
      await openMiroBoardsPicker();
    }
  };

  const openMiroBoardsPicker = async () => {
    try {
      console.log("🎨 openMiroBoardsPicker: Starting...");
      console.log(
        "🎨 Checking window.miroBoardsPicker:",
        !!window.miroBoardsPicker
      );

      // Check environment variables
      const clientId = process.env.NEXT_PUBLIC_MIRO_CLIENT_ID;
      console.log("🔑 Client ID configured:", !!clientId);

      if (!clientId) {
        throw new Error(
          "NEXT_PUBLIC_MIRO_CLIENT_ID is not configured. Please add it to your .env.local"
        );
      }

      // Get JWT token from your backend
      console.log("🔑 Fetching JWT token from /api/miro-token...");
      const tokenResponse = await fetch("/api/miro-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      console.log("📊 Token response status:", tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("❌ Token endpoint error:", errorData);
        throw new Error(
          `Token endpoint returned ${tokenResponse.status}: ${errorData.message}`
        );
      }

      const { token } = await tokenResponse.json();
      console.log("✅ JWT token received, length:", token.length);

      // Check if BoardsPicker is available
      if (!window.miroBoardsPicker) {
        // Try waiting a bit more for the script to load
        console.log("⏳ Waiting for Miro BoardsPicker to load...");
        let attempts = 0;
        const maxAttempts = 5;

        while (!window.miroBoardsPicker && attempts < maxAttempts) {
          console.log(`⏳ Waiting... (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }

        if (!window.miroBoardsPicker) {
          console.error("❌ Miro BoardsPicker SDK failed to load");
          console.log("💡 Trying to reload the script...");

          // Try to load the script again
          const script = document.createElement("script");
          script.src = "https://miro.com/app/static/boardsPicker.js";
          script.async = true;

          await new Promise((resolve, reject) => {
            script.onload = () => {
              console.log("✅ BoardsPicker loaded on retry");
              resolve(true);
            };
            script.onerror = () => {
              console.error("❌ Failed to reload BoardsPicker");
              reject(new Error("Cannot load Miro BoardsPicker SDK"));
            };
            document.head.appendChild(script);
          });
        }
      }

      console.log("✅ Miro BoardsPicker is ready");

      // Open BoardsPicker
      console.log("🎨 Opening Miro BoardsPicker with token...");
      window.miroBoardsPicker.open({
        clientId: clientId,
        action: "access-link",
        allowCreateAnonymousBoards: true,
        getToken: () => {
          console.log("🔑 getToken callback invoked");
          return Promise.resolve(token);
        },
        success: (data: any) => {
          console.log("✅ Miro board selected:", data);
          setMiroEmbedHtml(data.embedHtml);
        },
        error: (error: any) => {
          console.error("❌ Miro error:", error);
        },
        cancel: () => {
          console.log("⏹️ Miro picker cancelled");
          setSelectedShareType(null);
        },
      });
    } catch (error) {
      console.error("❌ Error opening Miro BoardsPicker:", error);
      setSelectedShareType(null);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  // Show loading while connecting
  if (connectionStatus === "connecting" || !hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Joining your call...</p>
        </div>
      </div>
    );
  }

  // Handle end states
  if (
    connectionStatus === "disconnected" ||
    connectionStatus === "left" ||
    connectionStatus === "kicked"
  ) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mb-4"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <PhoneOff className="w-8 h-8 text-red-600" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Call Ended</h2>
          <p className="text-slate-600 mb-4">
            Consultation Duration: {formatTime(callDuration)}
          </p>
          <div className="bg-slate-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-slate-700">
              Thank you for the consultation. Redirecting...
            </p>
          </div>
          <div className="w-8 h-1 bg-slate-200 rounded mx-auto animate-pulse" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col lg:flex-row">
      {/* Main Video Section */}
      <div
        className={`flex flex-col gap-3 sm:gap-4 min-h-screen transition-all duration-300 ${
          showPatientInfo ? "lg:flex-1" : "flex-1"
        } p-3 sm:p-4 lg:p-6`}
      >
        {/* Top Header with Logo, Connection Status, and Timer */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0"
        >
          {/* Logo */}
          <div className="h-8 sm:h-10">
            <img
              src="/telehealthlogowithtext.svg"
              alt="TeleHealth Logo"
              className="h-8 w-auto flex items-center justify-center"
            />
          </div>

          {/* Connection Status and Timer Group */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Connection Status Indicator */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "reconnecting"
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                }`}
              />
              <span className="text-white text-xs capitalize">
                {connectionStatus}
              </span>
            </div>

            {/* Call Timer */}
            <div className="flex items-center gap-2 bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm w-auto">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
              <span className="font-mono font-semibold text-slate-900 text-xs sm:text-base">
                {formatTime(callDuration)}
              </span>
            </div>
          </div>
        </motion.div>
        {/* Recording Notification Banner */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-600 text-white rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
            >
              <Circle className="w-4 h-4 sm:w-5 sm:h-5 fill-white animate-pulse" />
              <span className="font-semibold text-sm sm:text-base">
                Call Recording in Progress
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Video Feed Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col gap-3 sm:gap-4 min-h-0 max-h-[calc(100vh-200px)]"
        >
          {/* Screen Share Layout */}
          {screenshares[0]?.stream ? (
            <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 flex-1 min-h-0 max-h-full">
              {/* Main Screen Share Area - Takes full width on mobile, larger flex on desktop */}
              <div className="flex-1 relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg sm:rounded-2xl overflow-hidden shadow-lg flex items-center justify-center min-h-0">
                {screenshares[0]?.stream && (
                  <div className="w-full h-full">
                    <VideoView
                      stream={screenshares[0].stream}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Screen Share Indicator */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 sm:gap-2 z-20"
                >
                  <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    Screen Sharing Active
                  </span>
                  <span className="sm:hidden">Sharing</span>
                </motion.div>
              </div>

              {/* Small Video Feeds - Side by side on mobile and tablet, stacked on desktop */}
              <div className="flex flex-row sm:flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-4 flex-shrink-0 justify-center items-center">
                {/* Remote Participant Video */}
                {remoteParticipants[0] ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-20 h-20 sm:w-28 sm:h-28 lg:w-40 lg:h-40 rounded-lg overflow-hidden border-2 shadow-lg flex-shrink-0 ${
                      isRemoteVideoEnabled(remoteParticipants[0])
                        ? "border-white"
                        : "border-blue-500"
                    }`}
                  >
                    <div className="w-full h-full relative">
                      {remoteParticipants[0]?.stream &&
                      isRemoteVideoEnabled(remoteParticipants[0]) ? (
                        <VideoView
                          key={`remote-video-${remoteParticipants[0]?.id}-${remoteParticipants[0]?.isVideoEnabled}`}
                          stream={remoteParticipants[0].stream}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="relative w-full h-full">
                            {/* Background blur covering entire feed */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 backdrop-blur-xl" />

                            {/* Content Container */}
                            <div className="relative w-full h-full flex flex-col items-center justify-center">
                              {/* Profile Picture */}
                              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 relative ring-2 ring-white/30">
                                <AvatarImage src={remoteUser?.profile_image} />
                                <AvatarFallback className="text-sm sm:text-base bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {getInitials(
                                    remoteUser?.first_name,
                                    remoteUser?.last_name
                                  )}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Camera off indicator for remote participant */}
                      {!remoteParticipants[0]?.isVideoEnabled && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute bottom-1 left-1 bg-black/60 text-white p-1 rounded flex items-center gap-1 z-20"
                        >
                          <VideoOff className="w-3 h-3" />
                          <span className="text-xs">Off</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-20 h-20 sm:w-28 sm:h-28 lg:w-40 lg:h-40 rounded-lg overflow-hidden border-2 shadow-lg flex-shrink-0"
                    style={{ borderColor: "#3b82f6" }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="relative w-full h-full">
                        {/* Background blur covering entire feed */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 backdrop-blur-xl" />

                        {/* Content Container */}
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          {/* Profile Picture */}
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 relative ring-2 ring-white/30">
                            <AvatarImage src={remoteUser?.profile_image} />
                            <AvatarFallback className="text-sm sm:text-base bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getInitials(
                                remoteUser?.first_name,
                                remoteUser?.last_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Local Participant Video */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`w-20 h-20 sm:w-28 sm:h-28 lg:w-40 lg:h-40 rounded-lg overflow-hidden border-2 shadow-lg flex-shrink-0 ${
                    isCameraEnabled ? "border-white" : "border-purple-500"
                  }`}
                >
                  <div className="w-full h-full relative">
                    {localParticipant?.stream && isCameraEnabled ? (
                      <VideoView
                        key={`local-video-${localParticipant?.id}-${isCameraEnabled}`}
                        stream={localParticipant.stream!}
                        mirror
                        muted
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Background blur covering entire feed */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20 backdrop-blur-xl" />

                          {/* Content Container */}
                          <div className="relative w-full h-full flex flex-col items-center justify-center">
                            {/* Profile Picture */}
                            <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 relative ring-2 ring-white/30">
                              <AvatarImage src={localUser?.profile_image} />
                              <AvatarFallback className="text-sm sm:text-base bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                                {getInitials(
                                  localUser?.first_name,
                                  localUser?.last_name
                                )}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            /* Normal Video Layout - Remote feed as main, local as inset */
            <div className="flex-1 relative min-h-0 h-full">
              {/* Remote Participant - Main Background */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg"
              >
                {remoteParticipants[0] ? (
                  <div className="w-full h-full">
                    {remoteParticipants[0]?.stream &&
                    isRemoteVideoEnabled(remoteParticipants[0]) ? (
                      <VideoView
                        key={`video-${remoteParticipants[0]?.id}-${remoteParticipants[0]?.isVideoEnabled}`}
                        stream={remoteParticipants[0].stream}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Background blur covering entire feed */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 backdrop-blur-xl" />

                          {/* Content Container */}
                          <div className="relative w-full h-full flex flex-col items-center justify-center">
                            {/* Profile Picture */}
                            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 relative ring-4 ring-white/30">
                              <AvatarImage src={remoteUser?.profile_image} />
                              <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {getInitials(
                                  remoteUser?.first_name,
                                  remoteUser?.last_name
                                )}
                              </AvatarFallback>
                            </Avatar>

                            {/* Name on same line with Dr. prefix */}
                            <div className="mt-4 text-center">
                              <h3 className="text-lg sm:text-xl font-semibold text-blue-600/80">
                                {remoteUser?.role === "Doctor" ? "Dr. " : ""}
                                {remoteUser?.first_name} {remoteUser?.last_name}
                              </h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Camera off indicator for remote participant */}
                    {remoteParticipants[0]?.stream &&
                      !isRemoteVideoEnabled(remoteParticipants[0]) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute bottom-2 left-2 bg-black/60 text-white p-2 rounded-lg flex items-center gap-2 z-20"
                        >
                          <VideoOff className="w-4 h-4" />
                          <span className="text-xs">Video off</span>
                        </motion.div>
                      )}

                    {/* Microphone off indicator for remote participant */}
                    {!remoteParticipants[0]?.isAudioEnabled && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-2 left-24 bg-black/60 text-white p-2 rounded-lg flex items-center gap-2 z-20"
                      >
                        <MicOff className="w-4 h-4" />
                        <span className="text-xs">Mic off</span>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {/* Background blur covering entire feed */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 backdrop-blur-xl" />

                      {/* Content Container */}
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        {/* Profile Picture */}
                        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 relative ring-4 ring-white/30">
                          <AvatarImage src={remoteUser?.profile_image} />
                          <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getInitials(
                              remoteUser?.first_name,
                              remoteUser?.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className="mt-4 text-center">
                          <h3 className="text-lg sm:text-xl font-semibold text-blue-600/80">
                            {remoteUser?.role === "Doctor" ? "Dr. " : ""}
                            {remoteUser?.first_name} {remoteUser?.last_name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Local Participant - Responsive Inset Top-Right */}
                {localParticipant?.stream ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`absolute top-3 right-3 w-28 h-40 sm:w-32 sm:h-48 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-xl overflow-hidden border-2 shadow-lg z-10 ${
                      isCameraEnabled ? "border-white" : "border-purple-500"
                    }`}
                  >
                    {localParticipant?.stream && isCameraEnabled ? (
                      <VideoView
                        key={`local-inset-video-${localParticipant?.id}-${isCameraEnabled}`}
                        stream={localParticipant.stream!}
                        mirror
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Background blur covering entire feed */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20 backdrop-blur-xl" />

                          {/* Content Container */}
                          <div className="relative w-full h-full flex flex-col items-center justify-center">
                            {/* Profile Picture */}
                            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-16 lg:h-16 xl:w-20 xl:h-20 relative ring-2 ring-white/30">
                              <AvatarImage src={localUser?.profile_image} />
                              <AvatarFallback className="text-lg sm:text-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                                {getInitials(
                                  localUser?.first_name,
                                  localUser?.last_name
                                )}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </motion.div>
            </div>
          )}

          {/* Mobile Self Video - Only show when no one is screen sharing AND no video streams available */}
          {!isScreenSharing &&
            !screenshares[0]?.stream &&
            !remoteParticipants[0]?.stream &&
            !localParticipant?.stream && (
              <div className="lg:hidden w-full h-20 sm:h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                {localParticipant?.stream ? (
                  <VideoView
                    stream={localParticipant.stream}
                    mirror
                    muted
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {/* Background blur covering entire feed */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20 backdrop-blur-xl" />

                      {/* Content Container */}
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        {/* Profile Picture */}
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 relative ring-2 ring-white/30">
                          <AvatarImage src={localUser?.profile_image} />
                          <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                            {getInitials(
                              localUser?.first_name,
                              localUser?.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </motion.div>
        {/* Control Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-2 sm:gap-3"
        >
          {/* Primary Controls */}
          <Card className="bg-slate-800 shadow-lg border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {/* Mic Toggle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={isAudioOn ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 text-xs sm:text-base"
                    onClick={() => toggleAudio()}
                    disabled={!isCallActive}
                    aria-label={
                      isAudioOn ? "Mute microphone" : "Unmute microphone"
                    }
                  >
                    {isAudioOn ? (
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </Button>
                </motion.div>

                {/* Video Toggle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={isVideoOn ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0"
                    onClick={() => toggleVideo()}
                    disabled={!isCallActive}
                    aria-label={isVideoOn ? "Stop video" : "Start video"}
                  >
                    {isVideoOn ? (
                      <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </Button>
                </motion.div>

                {/* Screen Share / Whiteboard Dropdown */}
                <DropdownMenu>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={selectedShareType ? "default" : "outline"}
                        size="lg"
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0"
                        disabled={!isCallActive}
                        aria-label="Share content"
                      >
                        <div className="relative">
                          <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
                          <ChevronDown className="w-3 h-3 absolute -bottom-1 -right-1" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                  </motion.div>
                  <DropdownMenuContent align="end" side="top" className="w-40">
                    <DropdownMenuItem
                      onSelect={() => handleShareTypeSelect("screen")}
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      <span>Share Screen</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleShareTypeSelect("whiteboard")}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      <span>Share Miro Board</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Chat Toggle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={showChat ? "default" : "outline"}
                    size="lg"
                    className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 relative"
                    onClick={() => setShowChat(!showChat)}
                    disabled={!isCallActive}
                    aria-label="Toggle chat"
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    {chatMessages.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">
                        {chatMessages.length > 9 ? "9+" : chatMessages.length}
                      </span>
                    )}
                  </Button>
                </motion.div>

                {/* Recording Toggle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="lg"
                    className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 ${
                      isRecording ? "bg-red-600 hover:bg-red-700" : ""
                    }`}
                    onClick={toggleRecording}
                    disabled={!isCallActive}
                    aria-label={
                      isRecording ? "Stop recording" : "Start recording"
                    }
                  >
                    <Circle
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        isRecording ? "fill-white" : ""
                      }`}
                    />
                  </Button>
                </motion.div>

                {/* Patient Info Toggle - Only for Doctors */}
                {role === "doctor" && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={showPatientInfo ? "default" : "outline"}
                      size="lg"
                      className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0"
                      onClick={() => setShowPatientInfo(!showPatientInfo)}
                      disabled={!isCallActive}
                      aria-label={
                        showPatientInfo
                          ? "Hide patient info"
                          : "Show patient info"
                      }
                    >
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                  </motion.div>
                )}

                {/* Screen Share - HIDDEN (replaced by dropdown) */}
                {false && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={isScreenSharing ? "default" : "outline"}
                      size="lg"
                      className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0"
                      onClick={toggleScreenShare}
                      disabled={!isCallActive}
                      aria-label={
                        isScreenSharing ? "Stop sharing screen" : "Share screen"
                      }
                    >
                      <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                  </motion.div>
                )}

                {/* End Call */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-red-600 hover:bg-red-700"
                    onClick={endCall}
                    aria-label="End call"
                  >
                    <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Sidebar - Patient Info Panel */}
      <AnimatePresence>
        {showPatientInfo && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed lg:static inset-0 lg:inset-auto lg:w-80 bg-white lg:bg-white lg:border-l border-slate-200 flex flex-col z-30 shadow-2xl lg:shadow-none rounded-l-2xl lg:rounded-none overflow-y-auto"
          >
            <CardHeader className="border-b border-slate-200 py-3 px-4 flex-row items-center justify-between flex-shrink-0">
              <CardTitle className="text-sm sm:text-base">
                {role === "doctor" ? "Patient" : "Doctor"} Information
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowPatientInfo(false)}
                aria-label="Close patient info"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* User Information Card */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    {role === "doctor" ? "Patient" : "Doctor"} Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage
                        src={
                          role === "doctor"
                            ? remoteUser?.profile_image
                            : localUser?.profile_image
                        }
                      />
                      <AvatarFallback className="bg-blue-500 text-white text-sm sm:text-base">
                        {getInitials(
                          role === "doctor"
                            ? remoteUser?.first_name
                            : localUser?.first_name,
                          role === "doctor"
                            ? remoteUser?.last_name
                            : localUser?.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm sm:text-base">
                        {role === "doctor"
                          ? remoteUser?.first_name
                          : localUser?.first_name}{" "}
                        {role === "doctor"
                          ? remoteUser?.last_name
                          : localUser?.last_name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {role === "doctor"
                          ? "Patient"
                          : `${localUser?.specialization || "Doctor"}`}
                      </p>
                      {role === "patient" && localUser?.years_of_experience && (
                        <p className="text-xs text-slate-600">
                          {localUser.years_of_experience}+ years experience
                        </p>
                      )}
                    </div>
                  </div>
                  {(role === "doctor" ? remoteUser : localUser)?.email && (
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">
                        Email
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 break-all">
                        {(role === "doctor" ? remoteUser : localUser)?.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {role === "doctor" && (
                <>
                  {/* Medical Records Quick Access */}
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Recent Records
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {["ECG Report", "Blood Test", "Previous Notes"].map(
                        (record, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ x: 4 }}
                            className="w-full text-left p-2 rounded hover:bg-slate-50 transition-colors border border-slate-200"
                          >
                            <p className="text-xs sm:text-sm font-medium text-slate-700">
                              {record}
                            </p>
                            <p className="text-xs text-slate-500">
                              2 weeks ago
                            </p>
                          </motion.button>
                        )
                      )}
                    </CardContent>
                  </Card>

                  {/* E-Prescription Area */}
                  <Card className="border-blue-200 bg-blue-50 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-blue-700">
                        <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
                        E-Prescriptions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-slate-700 mb-3">
                        Active prescriptions will appear here
                      </p>
                      <Button className="w-full text-xs sm:text-sm gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        Generate Prescription
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed lg:static inset-0 lg:inset-auto lg:w-80 bg-slate-800 lg:bg-slate-800 lg:border-l border-slate-700 flex flex-col z-40 shadow-2xl lg:shadow-none rounded-t-2xl lg:rounded-none"
          >
            <CardHeader className="border-b border-slate-700 py-3 px-4 flex-row items-center justify-between flex-shrink-0">
              <CardTitle className="text-sm sm:text-base text-white">
                Chat with {role === "doctor" ? "Patient" : "Doctor"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowChat(false)}
                aria-label="Close chat"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-700/50">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs sm:text-sm text-slate-300 text-center">
                    Start a conversation...
                  </p>
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.senderId === localParticipant?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-xs sm:text-sm ${
                        message.senderId === localParticipant?.id
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-slate-200 text-slate-900 rounded-bl-none"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.senderId === localParticipant?.id
                          ? `${localUser?.first_name || "You"} ${
                              localUser?.last_name || ""
                            }`.trim()
                          : remoteUser?.role === "Doctor"
                          ? `Dr. ${remoteUser?.first_name || ""} ${
                              remoteUser?.last_name || ""
                            }`.trim()
                          : `${remoteUser?.first_name || ""} ${
                              remoteUser?.last_name || ""
                            }`.trim()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-700 p-3 sm:p-4 bg-slate-800 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 px-2 sm:px-3 h-8 sm:h-10"
                  size="sm"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
