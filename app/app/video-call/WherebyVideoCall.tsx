"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useRoomConnection,
  VideoView
} from "@whereby.com/browser-sdk/react";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  MessageCircle, Clock, FileText, Monitor, 
  Plus, Send, Activity, X, ChevronRight, 
  Settings, Layout, ShieldCheck, HeartPulse
} from "lucide-react";
import { VideoParticipant } from '@/components/video/VideoParticipant';
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  role?: string;
}

interface WherebyVideoCallProps {
  roomUrl: string;
  localUser: UserProfile;
  remoteUser: UserProfile;
  role: "doctor" | "patient";
}

export function WherebyVideoCall({
  roomUrl,
  localUser,
  remoteUser,
  role,
}: WherebyVideoCallProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showClinicalPanel, setShowClinicalPanel] = useState(role === "doctor");
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();


  // Core SDK Hooks - Memoize options to prevent re-initialization loops
  // Tutorial Pattern: Pass media options directly to useRoomConnection
  // This likely handles auto-connection and media management internally
  const roomConnectionOptions = React.useMemo(() => ({
    localMediaOptions: {
      audio: true,
      video: true,
    },
    displayName: localUser ? `${localUser.first_name || ''} ${localUser.last_name || ''}`.trim() : "Guest"
  }), [localUser?.first_name, localUser?.last_name]);

  const { state, actions } = useRoomConnection(roomUrl, roomConnectionOptions);

  const {
    localParticipant,
    remoteParticipants,
    connectionStatus,
    chatMessages,
    screenshares
  } = state;

  const {
    toggleCamera,
    toggleMicrophone,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    startScreenshare,
    stopScreenshare
  } = actions;

  // Connection logic - ensure we join the room when ready, preventing double joins
  // Ref to track joining state prevents race conditions
  const isJoiningRoom = useRef(false);

  // Effect 1: Handle joining (initial or rejoin on disconnect)
  useEffect(() => {
    // Join if we are 'ready' (initialized) or 'disconnected' (retry) and haven't joined yet
    if ((connectionStatus === "ready" || connectionStatus === "disconnected") && !isJoiningRoom.current) {
      console.log(`[WherebyVideoCall] Attempting to join room (${connectionStatus})...`);
      isJoiningRoom.current = true;
      
      // Add a small delay for retries to prevent rapid loops
      const delay = connectionStatus === "disconnected" ? 2000 : 0;
      
      setTimeout(() => {
        joinRoom()
          .then(() => {
            console.log("[WherebyVideoCall] Successfully joined room");
          })
          .catch((error) => {
            console.error("[WherebyVideoCall] Failed to join room:", error);
            isJoiningRoom.current = false;
          });
      }, delay);
    }
  }, [connectionStatus, joinRoom]);

  // Effect 2: Handle cleanup on unmount
  // We use a ref for leaveRoom to ensure we don't trigger cleanup if the function reference changes
  const leaveRoomRef = useRef(leaveRoom);
  
  // Keep ref updated
  useEffect(() => {
    leaveRoomRef.current = leaveRoom;
  }, [leaveRoom]);

  useEffect(() => {
    return () => {
      // Ensure we leave the room ONLY when component unmounts
      console.log("[WherebyVideoCall] Component unmounting, leaving room...");
      try {
        if (leaveRoomRef.current) {
          leaveRoomRef.current();
        }
      } catch (e) {
        console.error("[WherebyVideoCall] Error leaving room:", e);
      }
    };
  }, []); // Empty dependency array ensures this ONLY runs on unmount

  // Timer logic
  useEffect(() => {
    if (connectionStatus === "connected") {
      const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  // Backup status check removed, relying on SDK state


  // Log connection status changes
  useEffect(() => {
    console.log("[WherebyVideoCall] Room URL:", roomUrl);
    console.log("[WherebyVideoCall] Connection status:", connectionStatus);
    console.log("[WherebyVideoCall] Remote participants:", remoteParticipants.length);
  }, [connectionStatus, remoteParticipants.length, roomUrl]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendChatMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleEndCall = () => {
    leaveRoom();
    // In a real app, redirect here
    window.location.href = role === "doctor" ? "/doctor-dashboard" : "/dashboard";
  };

  const isRemoteActive = remoteParticipants.length > 0;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar - Clinical Data / Patient Records (Only for Doctors) */}
      <AnimatePresence>
        {showClinicalPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col z-20"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Activity className="text-blue-500" size={20} />
                  </div>
                  <h2 className="font-bold text-lg">Clinical Panel</h2>
                </div>
                <button onClick={() => setShowClinicalPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {/* Patient Overview */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Patient Details</h3>
                  <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                    <p className="text-sm font-medium">{remoteUser.first_name} {remoteUser.last_name}</p>
                    <p className="text-xs text-slate-400 mt-1">Age: 34 • Weight: 72kg • Type A+</p>
                  </div>
                </div>

                {/* Vitals Mockup */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Vitals</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                      <p className="text-[10px] text-emerald-500 font-bold">HR</p>
                      <p className="text-lg font-bold">72 <span className="text-xs font-normal">BPM</span></p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                      <p className="text-[10px] text-blue-500 font-bold">O2</p>
                      <p className="text-lg font-bold">98 <span className="text-xs font-normal">%</span></p>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Insight */}
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-20">
                    <ShieldCheck size={40} className="text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-2">
                    <Layout size={12} />
                    Consultation Helper
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "Patient mentioned mild chest discomfort during stairs exercise last week. Check blood pressure correlation."
                  </p>
                </div>

                <div className="pt-4 mt-auto">
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]">
                    <Plus size={18} />
                    Add Prescription
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col relative h-full">
        
        {/* Top Floating Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-30 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            {!showClinicalPanel && role === "doctor" && (
              <button 
                onClick={() => setShowClinicalPanel(true)}
                className="p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700 hover:border-blue-500 transition-all group"
              >
                <ChevronRight className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium font-mono">{formatTime(callDuration)}</span>
              <div className="w-px h-4 bg-slate-700" />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-500" />
                Secure P2P
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button className="p-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
              <Settings size={20} />
            </button>
            <div className="px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl flex items-center gap-3">
              <img src="/telehealthlogo.svg" alt="Epoch Telehealth" className="h-6 w-auto" />
              <span className="text-sm font-bold tracking-tight">Epoch <span className="text-blue-500">Telehealth</span></span>
            </div>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <div className="w-full h-full">
            {/* 
              Priority: 
              1. Screenshare (if any)
              2. Remote Participant (if no screenshare)
              3. Local Participant (if no remote and no screenshare? - logic below) 
            */}
            {/* 
              Priority: 
              1. Screenshare (if any) -> Split View
              2. Standard Grid (if no screenshare) -> Full Remote
            */}
            {screenshares && screenshares.length > 0 ? (
              <div className="w-full h-full flex flex-col md:flex-row relative">
                 {/* Main Area: Screenshare */}
                 <div className="flex-[3] relative bg-slate-900">
                   {screenshares[0].stream && (
                      <VideoView 
                        stream={screenshares[0].stream} 
                        className="w-full h-full object-contain" 
                      />
                   )}
                    {/* Overlay who is sharing - Moved down to avoid top bar overlap */}
                    <div className="absolute top-24 left-6 px-3 py-1.5 glass-effect rounded-full text-xs font-medium text-white flex items-center gap-2 z-10">
                      <Monitor size={14} />
                      {(() => {
                        const sharerId = screenshares[0].participantId;
                        if (sharerId === localParticipant?.id) return "You are presenting";
                        // In 1-on-1, if it's not me, it's the remote user
                        return `${remoteUser.first_name || "Remote user"} is presenting`;
                      })()}
                    </div>
                 </div>

                 {/* Side Area: Stacked Participants (Remote + Local) */}
                 {/* Reduced contrast: bg-slate-950 -> bg-[#0f172a] (slate-900) but slightly different or reliance on main bg being darker/lighter? 
                     User said: "change in background color ... is too high, make it just slightly different".
                     Current main: bg-slate-900. Side: bg-slate-950.
                     Let's make side bg-slate-925 (custom hex closer to 900). 
                     Slate 900: #0f172a. Slate 950: #020617. 
                     Let's use #0b1121.
                 */}
                 <div className="flex-1 flex flex-row md:flex-col items-center justify-center gap-4 p-4 min-h-[200px] md:min-h-0 bg-[#0b1121]">
                    
                    {/* Remote Participant */}
                    <div className="w-[45%] md:w-full max-w-[320px] aspect-video relative rounded-xl overflow-hidden shadow-lg border border-slate-800">
                      <VideoParticipant 
                        key={remoteParticipants[0]?.id || 'remote-placeholder'}
                        participant={remoteParticipants[0]} 
                        user={remoteUser} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Local Participant */}
                    <div className="w-[45%] md:w-full max-w-[320px] aspect-video relative rounded-xl overflow-hidden shadow-lg border border-slate-800">
                      <VideoParticipant 
                        key={localParticipant?.id ? `local-${localParticipant.id}` : 'local-placeholder'}
                        participant={localParticipant} 
                        user={localUser} 
                        isLocal={true}
                        className="w-full h-full object-cover"
                      />
                    </div>
                 </div>
              </div>
            ) : (
              <VideoParticipant 
                key={remoteParticipants[0]?.id || 'remote-placeholder'}
                participant={remoteParticipants[0]} 
                user={remoteUser} 
                className="w-full h-full"
              />
            )}
          </div>

          {/* Local Participant Inset - Bottom Right (Hidden in Split View) */}
          {/* We only render this floatable window if we are NOT in screenshare mode */}
          {(!screenshares || screenshares.length === 0) && (
            <motion.div 
              drag
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              className="absolute bottom-24 right-6 w-40 h-56 sm:w-48 sm:h-64 md:w-64 md:h-40 lg:w-72 lg:h-48 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl z-40 bg-slate-900"
            >
              <VideoParticipant 
                key={localParticipant?.id ? `local-${localParticipant.id}` : 'local-placeholder'}
                participant={localParticipant} 
                user={localUser} 
                isLocal={true}
              />
            </motion.div>
          )}
        </div>

        {/* Controls Dock */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
          <div className="glass-effect rounded-2xl p-2 px-3 flex items-center gap-3 shadow-2xl border border-slate-700/50">
            <button 
              onClick={() => toggleMicrophone()}
              disabled={!localParticipant?.id}
              className={`p-4 rounded-xl transition-all ${!localParticipant?.id ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' : !localParticipant?.isAudioEnabled ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {localParticipant?.isAudioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
            
            <button 
              onClick={() => toggleCamera()}
              disabled={!localParticipant?.id}
              className={`p-4 rounded-xl transition-all ${!localParticipant?.id ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' : !localParticipant?.isVideoEnabled ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {localParticipant?.isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>

            <button 
              onClick={() => {
                const isLocalSharing = screenshares?.some(s => s.participantId === localParticipant?.id);
                // Check if someone ELSE is sharing (screenshares exist AND it's not me)
                const isSomeoneElseSharing = screenshares && screenshares.length > 0 && !isLocalSharing;
                
                if (isLocalSharing) {
                  stopScreenshare();
                } else if (isSomeoneElseSharing) {
                   toast({
                     title: "Presentation in progress",
                     description: "Please wait for the current presenter to stop sharing before starting your presentation.",
                     variant: "destructive",
                   });
                } else {
                  startScreenshare();
                }
              }}
              className={`p-4 rounded-xl transition-all ${
                screenshares?.some(s => s.participantId === localParticipant?.id) 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } ${
                (screenshares && screenshares.length > 0 && !screenshares.some(s => s.participantId === localParticipant?.id)) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              title={
                screenshares && screenshares.length > 0 && !screenshares.some(s => s.participantId === localParticipant?.id)
                  ? "Someone else is presenting" 
                  : "Share Screen"
              }
            >
              <Monitor size={22} />
            </button>

            <button 
              onClick={() => setShowChat(!showChat)}
              className={`p-4 rounded-xl transition-all relative ${showChat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <MessageCircle size={22} />
              {chatMessages.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-900" />
              )}
            </button>

            <div className="w-px h-8 bg-slate-700 mx-1" />

            <button 
              onClick={handleEndCall}
              className="p-4 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all active:scale-[0.95] flex items-center gap-2"
            >
              <PhoneOff size={22} />
              <span className="font-bold hidden sm:inline">End Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="h-full w-80 sm:w-96 border-l border-slate-800 bg-slate-900/80 backdrop-blur-lg flex flex-col z-30"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <h2 className="font-bold">Consultation Chat</h2>
              <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-3">
                  <MessageCircle size={40} />
                  <p className="text-sm">Start a secure session chat...</p>
                </div>
              ) : (
                chatMessages.map((msg: any, i) => {
                  const isMe = msg.senderId === localParticipant?.id;
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">
                        {isMe ? 'You' : remoteUser.first_name} • 12:44 PM
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-slate-900 border-t border-slate-800">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="w-full bg-slate-800 border-none rounded-xl py-3.5 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-2 p-2 text-blue-500 hover:text-blue-400"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-3 flex items-center justify-center gap-1 uppercase tracking-widest font-bold">
                <ShieldCheck size={10} />
                End-to-End Encrypted
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
