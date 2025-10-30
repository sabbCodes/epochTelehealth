import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type UserRole = 'doctor' | 'patient';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  isCallActive: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  endCall: () => void;
  error: string | null;
}

export const useWebRTC = (role: UserRole, appointmentId: string): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isCallActive, setIsCallActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  type SignalMessage = {
    type: 'offer' | 'answer' | 'ice-candidate' | 'end-call';
    sdp?: string;
    candidate?: RTCIceCandidateInit;
    appointmentId: string;
    role: UserRole;
  };
  const messageQueue = useRef<SignalMessage[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const channelReady = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);
  const hasCreatedOfferRef = useRef<boolean>(false);
  const pendingRemoteCandidates = useRef<RTCIceCandidateInit[]>([]);

  const flushQueue = useCallback(() => {
    if (channelRef.current && channelReady.current) {
      while (messageQueue.current.length > 0) {
        const msg = messageQueue.current.shift() as SignalMessage;
        try {
          channelRef.current.send({ type: 'broadcast', event: 'signal', payload: msg });
        } catch {}
      }
    }
  }, []);

  const sendSignal = useCallback((data: Omit<SignalMessage, 'appointmentId' | 'role'>) => {
    const payload: SignalMessage = { ...data, appointmentId, role } as SignalMessage;
    if (channelRef.current && channelReady.current) {
      try {
        channelRef.current.send({ type: 'broadcast', event: 'signal', payload });
      } catch {
        messageQueue.current.push(payload);
      }
    } else {
      messageQueue.current.push(payload);
    }
  }, [appointmentId, role]);

  // initializeRealtime is defined later to avoid use-before-declare issues

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers here if needed
        ]
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnection.current = pc;

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (peerConnection.current) {
            peerConnection.current.addTrack(track, localStreamRef.current!);
          }
        });
      }

      // Set up event handlers for the peer connection
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const rtcCand = event.candidate as RTCIceCandidate;
          const candInit: RTCIceCandidateInit = typeof rtcCand.toJSON === 'function' ? rtcCand.toJSON() : {
            candidate: rtcCand.candidate,
            sdpMid: rtcCand.sdpMid ?? undefined,
            sdpMLineIndex: rtcCand.sdpMLineIndex ?? undefined,
          };
          sendSignal({ type: 'ice-candidate', candidate: candInit });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setConnectionStatus('connected');
        setIsConnected(true);
        setIsCallActive(true);
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || 
            pc.iceConnectionState === 'failed' || 
            pc.iceConnectionState === 'closed') {
          handleEndCall();
        }
      };

      return pc;
    } catch (err) {
      console.error('Error initializing peer connection:', err);
      setError('Failed to initialize call');
      setConnectionStatus('error');
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ sendSignal]);

  // initializeRealtime will be defined after handlers

  // Get user media (camera and microphone)
  const getLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera or microphone');
      setConnectionStatus('error');
      return null;
    }
  }, []);

  // Handle incoming offer
  const handleOffer = useCallback(async (message: SignalMessage) => {
    if (!peerConnection.current) return;

    try {
      // Only set remote offer if we don't already have one
      if (peerConnection.current.remoteDescription) return;
      const remoteDesc: RTCSessionDescriptionInit = { type: 'offer', sdp: message.sdp };
      await peerConnection.current.setRemoteDescription(remoteDesc);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      sendSignal({ type: 'answer', sdp: answer.sdp });
      // Flush any ICE candidates received before remote description was set
      for (const cand of pendingRemoteCandidates.current) {
        try { await peerConnection.current.addIceCandidate(new RTCIceCandidate(cand)); } catch {}
      }
      pendingRemoteCandidates.current = [];
    } catch (err) {
      console.error('Error handling offer:', err);
      setError('Failed to handle call request');
      setConnectionStatus('error');
    }
  }, [sendSignal]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (message: SignalMessage) => {
    if (!peerConnection.current) return;

    try {
      // Only doctor should process answers and only when in have-local-offer state
      if ((peerConnection.current.signalingState as RTCSignalingState) !== 'have-local-offer') {
        return;
      }
      const remoteDesc: RTCSessionDescriptionInit = { type: 'answer', sdp: message.sdp };
      await peerConnection.current.setRemoteDescription(remoteDesc);
      setConnectionStatus('connected');
      setIsConnected(true);
      setIsCallActive(true);
      // Flush queued candidates if any
      for (const cand of pendingRemoteCandidates.current) {
        try { await peerConnection.current.addIceCandidate(new RTCIceCandidate(cand)); } catch {}
      }
      pendingRemoteCandidates.current = [];
    } catch (err) {
      console.error('Error handling answer:', err);
      setError('Failed to establish call');
      setConnectionStatus('error');
    }
  }, []);

  // Handle ICE candidate
  const handleICECandidate = useCallback(async (message: SignalMessage) => {
    if (!peerConnection.current) return;

    try {
      // Queue if remote description not yet set
      if (!peerConnection.current.remoteDescription) {
        if (message.candidate) pendingRemoteCandidates.current.push(message.candidate);
        return;
      }
      if (message.candidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
      // Non-fatal error, just log it
    }
  }, []);

  // Create and send offer
  const createAndSendOffer = useCallback(async () => {
    if (!peerConnection.current) return;

    try {
      // Only create an offer once and only from a stable state
      if (hasCreatedOfferRef.current) return;
      if ((peerConnection.current.signalingState as RTCSignalingState) !== 'stable') {
        // Wait a tick for state to stabilize
        await new Promise((r) => setTimeout(r, 50));
        if ((peerConnection.current?.signalingState as RTCSignalingState) !== 'stable') {
          return; // avoid invalid modification
        }
      }
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnection.current.setLocalDescription(offer);

      sendSignal({ type: 'offer', sdp: offer.sdp });
      hasCreatedOfferRef.current = true;
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to start call');
      setConnectionStatus('error');
    }
  }, [sendSignal]);

  // Toggle audio track
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setLocalStream(new MediaStream([...localStreamRef.current.getTracks()]));
    }
  }, []);

  // Toggle video track
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setLocalStream(new MediaStream([...localStreamRef.current.getTracks()]));
    }
  }, []);

  // Cleanup function
  const handleEndCall = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.ontrack = null;
      peerConnection.current.onicecandidate = null;
      peerConnection.current.oniceconnectionstatechange = null;
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsCallActive(false);
    setConnectionStatus('disconnected');
  }, []);

  // End the call
  const endCall = useCallback(() => {
    handleEndCall();

    sendSignal({ type: 'end-call' });
  }, [handleEndCall, sendSignal]);

  // Initialize Supabase Realtime signaling (defined after handlers)
  const initializeRealtime = useCallback(() => {
    try {
      if (channelRef.current) return;
      const channel: RealtimeChannel = supabase.channel(`webrtc:${appointmentId}`);
      channelRef.current = channel;

      channel.on('broadcast', { event: 'signal' }, async (msg: { payload: SignalMessage }) => {
        try {
          const message = msg.payload;
          if (!message || message.appointmentId !== appointmentId) return;
          if (message.role === role) return; // ignore self
          if (!peerConnection.current) return;
          // Guard by role to avoid wrong-state errors
          if (message.type === 'offer' && role !== 'patient') return;
          if (message.type === 'answer' && role !== 'doctor') return;
          switch (message.type) {
            case 'offer':
              await handleOffer(message);
              break;
            case 'answer':
              await handleAnswer(message);
              break;
            case 'ice-candidate':
              await handleICECandidate(message);
              break;
            case 'end-call':
              handleEndCall();
              break;
          }
        } catch (err) {
          console.error('Error handling Realtime message:', err);
          setError('Failed to process message');
        }
      });

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connecting');
          channelReady.current = true;
          flushQueue();
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
        } else if (status === 'CLOSED') {
          channelReady.current = false;
          setConnectionStatus('disconnected');
        }
      });
    } catch (err) {
      console.error('Error initializing Realtime:', err);
      setError('Failed to connect to signaling');
      setConnectionStatus('error');
    }
  }, [appointmentId, role, handleOffer, handleAnswer, handleICECandidate, handleEndCall, flushQueue]);

  // Initialize call when component mounts
  useEffect(() => {
    const initializeCall = async () => {
      try {
        if (initializedRef.current) return; // prevent double init (StrictMode)
        initializedRef.current = true;
        setConnectionStatus('connecting');
        
        // Initialize Supabase Realtime signaling first
        initializeRealtime();
        
        // Get local media
        const stream = await getLocalMedia();
        if (!stream) return;
        
        // Initialize peer connection
        initializePeerConnection();
        
        // If doctor, wait briefly for ws open and then send offer
        if (role === 'doctor') {
          const waitStart = Date.now();
          while (!channelReady.current && Date.now() - waitStart < 2000) {
            await new Promise((r) => setTimeout(r, 50));
          }
          await createAndSendOffer();
        }
        
      } catch (err) {
        console.error('Error initializing call:', err);
        setError('Failed to initialize call');
        setConnectionStatus('error');
      }
    };

    initializeCall();

    // Cleanup on unmount
    return () => {
      handleEndCall();
      if (channelRef.current) {
        try { channelRef.current.unsubscribe(); } catch {}
        channelRef.current = null;
        channelReady.current = false;
      }
      initializedRef.current = false;
      hasCreatedOfferRef.current = false;
    };
  }, [getLocalMedia, initializePeerConnection, initializeRealtime, createAndSendOffer, role, handleEndCall]);

  return {
    localStream,
    remoteStream,
    isConnected,
    connectionStatus,
    isCallActive,
    toggleAudio,
    toggleVideo,
    endCall,
    error
  };
};

export default useWebRTC;
