import React, { useEffect } from 'react';
import { VideoView } from "@whereby.com/browser-sdk/react";
import { MicOff, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  role?: string;
}

interface VideoParticipantProps {
  participant: any;
  user: UserProfile;
  isLocal?: boolean;
  className?: string;
}

export const VideoParticipant: React.FC<VideoParticipantProps> = ({ 
  participant, 
  user, 
  isLocal = false,
  className = ""
}) => {
  const isVideoEnabled = participant?.isVideoEnabled;
  const isAudioEnabled = participant?.isAudioEnabled;
  const stream = participant?.stream;

  // Debug logging
  useEffect(() => {
    console.log(`[VideoParticipant ${isLocal ? 'LOCAL' : 'REMOTE'}] State:`, {
      participantId: participant?.id,
      isVideoEnabled,
      isAudioEnabled,
      hasStream: !!stream,
      userName: user ? `${user.first_name || ''} ${user.last_name || ''}` : 'Unknown'
    });
  }, [participant?.id, isVideoEnabled, isAudioEnabled, stream, isLocal, user?.first_name, user?.last_name]);

  const getInitials = () => {
    if (!user) return "??";
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className={`relative w-full h-full bg-slate-900 overflow-hidden group ${className}`}>
      <AnimatePresence mode="wait">
        {isVideoEnabled && participant ? (
          <motion.div 
            key={`video-${participant?.id}-${isVideoEnabled}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <VideoView 
              stream={stream} 
              mirror={isLocal} 
              className="w-full h-full object-cover" 
            />
          </motion.div>
        ) : (
          <motion.div 
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center relative"
          >
            {/* Professional Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
            
            <div className="relative flex flex-col items-center gap-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-slate-700/50 shadow-2xl relative">
                {user?.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt={user.first_name || 'User'} 
                    className="w-full h-full object-cover grayscale-[20%]"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <User size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
              </div>
              
              <div className="text-center z-10">
                  {!isLocal && (
                  <>
                    <p className="text-white font-semibold text-lg sm:text-xl tracking-tight">
                      {user && (
                        <>
                          {user.role === "Doctor" ? "Dr. " : ""}
                          {user.first_name} {user.last_name}
                        </>
                      )}
                      {!user && "Unknown User"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {participant ? "Camera is turned off" : `Waiting for ${user?.first_name || 'user'} to join...`}
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays - Hide if local and audio is enabled (nothing to show) - Actually USER REQUESTED TO SHOW IT */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 glass-effect rounded-full flex items-center gap-2">
          {!isAudioEnabled && (
            <div className="text-red-500">
              <MicOff size={14} />
            </div>
          )}
          <span className="text-white text-xs font-medium">
            {isLocal ? "You" : (user ? `${user.role === "Doctor" ? "Dr. " : ""}${user.first_name}` : "Unknown User")}
          </span>
        </div>
      </div>
    </div>
  );
};
