'use client';

import { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface VideoParticipantProps {
  stream: MediaStream | null;
  name: string;
  role: string;
  isLocal?: boolean;
  profileImage?: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  className?: string;
  showInfo?: boolean;
  muted?: boolean;
}

export function VideoParticipant({
  stream,
  name,
  role,
  isLocal = false,
  profileImage,
  connectionStatus,
  className = '',
  showInfo = true,
  muted = false,
}: VideoParticipantProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = stream?.getVideoTracks().some(track => track.readyState === 'live');
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Update video source when stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.muted = muted;
      video.play().catch(e => console.error('Error playing video:', e));
    }

    return () => {
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
  }, [stream, muted]);

  const statusColor = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
  }[connectionStatus];

  return (
    <div className={cn(
      'relative w-full h-full bg-gray-800 rounded-xl overflow-hidden',
      className
    )}>
      {/* Video element */}
      <video
        ref={videoRef}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          hasVideo ? 'opacity-100' : 'opacity-0 absolute',
          isLocal && 'transform scale-x-[-1]' // Mirror local video
        )}
        autoPlay
        playsInline
        muted={isLocal || muted}
      />

      {/* Fallback UI when no video */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-4">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {initials || (isLocal ? 'You' : 'U')}
                </span>
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-800 ${statusColor}`} />
          </div>
          
          <div className="mt-4 text-center">
            <h3 className="text-xl font-semibold text-white">{name}</h3>
            <p className="text-gray-300 text-sm">{role}</p>
          </div>
        </div>
      )}

      {/* Info overlay */}
      {showInfo && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
            <p className="text-white text-sm">
              {name} {isLocal && '(You)'}
            </p>
            <div className="flex items-center mt-1">
              <span className={`w-2 h-2 rounded-full ${statusColor} mr-1`} />
              <span className="text-xs text-gray-300 capitalize">
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
