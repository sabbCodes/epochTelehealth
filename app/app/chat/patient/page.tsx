"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  Users,
  Stethoscope,
  ImageIcon,
  FileText,
  ArrowLeft,
  Menu,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { formatName } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PatientChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [showSidebar, setShowSidebar] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()

  // Chat state from Supabase
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<null | {
    id: string
    doctor_id: string
    patient_id: string
    end_requested_by?: string | null
  }>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [didIRequestEnd, setDidIRequestEnd] = useState(false)
  const [doctorUserId, setDoctorUserId] = useState<string | null>(null)
  const [patientUserId, setPatientUserId] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_image: string | null;
    specialization: string | null;
  } | null>(null)
  
  const [doctors, setDoctors] = useState<Array<{
    id: string;
    name: string;
    specialty: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
    online: boolean;
  }>>([]);

  type Message = {
    id: string
    sender: "patient" | "doctor"
    content: string
    timestamp: string
    type: "text" | "video" | "voice" | "file"
    file_url?: string
    file_type?: string
    file_name?: string
  }
  
  const [messages, setMessages] = useState<Message[]>([])

  // Supabase messages row type
  type MessageRow = {
    id: string
    appointment_id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    file_url?: string
    file_type?: string
    file_name?: string
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedChat])

  // Also scroll when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Read appointment ID from search params
  useEffect(() => {
    const possibleKeys = ["appointmentId", "appointment_id", "scheduleId", "schedule_id", "id"] as const
    for (const key of possibleKeys) {
      const v = searchParams?.get(key as string)
      if (v) {
        setAppointmentId(v)
        break
      }
    }
  }, [searchParams])

  // Get auth user id
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (isMounted) setAuthUserId(user?.id ?? null)
    })()
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch schedule and set up real-time updates
  useEffect(() => {
    if (!appointmentId) return;
    
    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) {
        console.error('Error fetching schedule:', error);
        return;
      }

      setSchedule(data);
      setSessionStatus(data.status || 'active');
      
      // If status is pending_end, calculate remaining time
      if (data.status === 'pending_end' && data.updated_at) {
        const updatedAt = new Date(data.updated_at).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - updatedAt) / 1000); // in seconds
        const remaining = Math.max(0, 600 - elapsed); // 10 minutes = 600 seconds
        
        setCountdown(remaining);
        
        // Start countdown if there's time left
        if (remaining > 0) {
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev === null || prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return () => clearInterval(timer);
        }
      }
      
      // Set up real-time subscription for status changes
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'schedules',
            filter: `id=eq.${appointmentId}`
          },
          (payload) => {
            const newStatus = payload.new.status;
            setSessionStatus(newStatus);
            
            // Update local schedule state with the new end_requested_by
            setSchedule(prev => prev ? { ...prev, end_requested_by: payload.new.end_requested_by as string | null } : null);
            
            // If the session is no longer pending_end, reset the local flag
            if (newStatus !== 'pending_end') setDidIRequestEnd(false);
            
            // If status changed to pending_end, start countdown
            if (newStatus === 'pending_end') {
              setCountdown(600); // 10 minutes in seconds
              
              const timer = setInterval(() => {
                setCountdown(prev => {
                  if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
              
              return () => clearInterval(timer);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchSchedule();
  }, [appointmentId]);

  // After schedule, resolve doctor/patient to their user_profile_ids and fetch patient's doctors
  useEffect(() => {
    if (!schedule) return;
    let cancelled = false;
    
    // Define types for the data
  type DoctorData = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_image: string | null;
    specialization: string | null;
    user_profile_id?: string;
  };

  // Debug function to log doctor data
  const logDoctorData = (doctor: DoctorData | null, label: string) => {
    console.log(`[${label}]`, {
      id: doctor?.id,
      name: doctor ? `${doctor.first_name} ${doctor.last_name}` : 'No doctor',
      user_profile_id: doctor?.user_profile_id
    });
  };
    
    const fetchData = async () => {
      try {
        console.log('Fetching doctor with ID:', schedule.doctor_id);
        
        // First, fetch the current doctor and patient data in parallel
        const [
          { data: currentDoctor, error: de },
          { data: patient, error: pe }
        ] = await Promise.all([
          supabase
            .from("doctor_profiles")
            .select("id, user_profile_id, first_name, last_name, profile_image, specialization")
            .eq("id", schedule.doctor_id)
            .single(),
          supabase
            .from("patient_profiles")
            .select("user_profile_id")
            .eq("id", schedule.patient_id)
            .single()
        ]);

        // Then fetch the patient's schedules with doctor information
        const { data: patientSchedules, error: pde } = await supabase
          .from("schedules")
          .select(
            `
            id,
            doctor:doctor_profiles!inner(
              id,
              first_name,
              last_name,
              profile_image,
              specialization,
              user_profile_id
            )
          `,
            { count: 'exact' }
          )
          .eq("patient_id", schedule.patient_id)
          .order("created_at", { ascending: false });

        if (de) console.error("Failed to fetch doctor user id:", de);
        if (pe) console.error("Failed to fetch patient user id:", pe);
        if (pde) console.error("Failed to fetch patient's doctors:", pde);
        
        if (cancelled) return;
        
        // Debug log the current doctor data
        logDoctorData(currentDoctor, 'Current Doctor');
        console.log('Patient Schedules:', patientSchedules);

        // Set the current doctor's user ID and profile
        if (currentDoctor) {
          setDoctorUserId(currentDoctor.user_profile_id ?? null);
          setDoctorProfile({
            id: currentDoctor.id,
            first_name: currentDoctor.first_name,
            last_name: currentDoctor.last_name,
            profile_image: currentDoctor.profile_image,
            specialization: currentDoctor.specialization,
          });
        }

        // Set the patient's user ID
        if (patient) {
          setPatientUserId(patient.user_profile_id ?? null);
        }

        // Process and set the doctors list
        if (patientSchedules) {
          const uniqueDoctors = new Map<string, DoctorData>();
          
          // Add current doctor first if exists (this ensures they're always included)
          if (currentDoctor) {
            console.log('Adding current doctor to uniqueDoctors:', currentDoctor.id);
            uniqueDoctors.set(currentDoctor.id, {
              id: currentDoctor.id,
              first_name: currentDoctor.first_name,
              last_name: currentDoctor.last_name,
              profile_image: currentDoctor.profile_image,
              specialization: currentDoctor.specialization,
              user_profile_id: currentDoctor.user_profile_id
            });
          } else {
            console.error('Current doctor is null or undefined');
          }
          
          // Add other doctors from schedules
          patientSchedules.forEach((schedule: { doctor?: DoctorData | DoctorData[] }) => {
            try {
              // Handle both array and single doctor cases
              const doctors = Array.isArray(schedule.doctor) 
                ? schedule.doctor
                : schedule.doctor ? [schedule.doctor] : [];
              
          doctors.forEach((doctor: DoctorData) => {
                if (doctor?.id && !uniqueDoctors.has(doctor.id)) {
                  // Ensure the doctor object matches the DoctorData type
                  const doctorData: DoctorData = {
                    id: doctor.id,
                    first_name: doctor.first_name ?? null,
                    last_name: doctor.last_name ?? null,
                    profile_image: doctor.profile_image ?? null,
                    specialization: doctor.specialization ?? null,
                    user_profile_id: doctor.user_profile_id
                  };
                  uniqueDoctors.set(doctor.id, doctorData);
                }
              });
            } catch (error) {
              console.error('Error processing schedule:', schedule, error);
            }
          });
          
          // Transform to the required format for the UI
          const formattedDoctors = Array.from(uniqueDoctors.values()).map(doctor => ({
            id: doctor.id,
            name: `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'Doctor',
            specialty: doctor.specialization || 'General Practice',
            avatar: doctor.profile_image || "/placeholder.svg?height=40&width=40",
            lastMessage: "Tap to view conversation",
            timestamp: "",
            unread: 0,
            online: true,
          }));
          
          setDoctors(formattedDoctors);
          
          // Set the first doctor as selected if none is selected
          if (formattedDoctors.length > 0 && !selectedChat) {
            setSelectedChat(formattedDoctors[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule]);

  // Load messages and subscribe to realtime
  useEffect(() => {
    if (!appointmentId || !doctorUserId || !patientUserId) return
    let cancelled = false

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, appointment_id, sender_id, receiver_id, content, created_at, file_url, file_type, file_name")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true })
      
      if (error) {
        console.error("Failed to load messages:", error)
        return
      }
      
      if (!data || cancelled) return
      
      const mapped = (data as unknown as MessageRow[]).map((m) => {
        const sender: 'doctor' | 'patient' = m.sender_id === doctorUserId ? 'doctor' : 'patient';
        return {
          id: m.id,
          sender,
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          }),
          type: (m.file_url ? 'file' : 'text') as Message['type'],
          file_url: (m as any).file_url,
          file_type: (m as any).file_type,
          file_name: (m as any).file_name,
        };
      });
      
      if (!cancelled) {
        setMessages(mapped)
      }
    }

    loadMessages()

    // Track processed message IDs to prevent duplicates
    const processedMessageIds = new Set<string>()
    let channel: ReturnType<typeof supabase.channel> | null = null

    // Only set up the channel if we have all required IDs
    if (appointmentId && doctorUserId && patientUserId) {
      channel = supabase
        .channel(`messages-appointment-${appointmentId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `appointment_id=eq.${appointmentId}`
          },
          (payload) => {
            const m = payload.new as MessageRow
            
            // Skip if we've already processed this confirmed DB message ID
            if (processedMessageIds.has(m.id)) return
            processedMessageIds.add(m.id)
            
            // Trim the processed IDs set to prevent memory leaks
            if (processedMessageIds.size > 100) {
              const ids = Array.from(processedMessageIds).slice(-100)
              processedMessageIds.clear()
              ids.forEach(id => processedMessageIds.add(id))
            }
            
            setMessages((prev) => {
              // If this message was sent by us, replace the optimistic temp entry
              // (matched by content) so it gets the real DB id and timestamp.
              // If it's from the other party, just append as a new message.
              const tempIndex = prev.findIndex(
                (pm) => pm.id.startsWith('temp-') && pm.content === m.content
              )

              const confirmed = {
                id: m.id,
                sender: m.sender_id === doctorUserId ? 'doctor' as const : 'patient' as const,
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                type: m.file_url ? 'file' as const : 'text' as const,
                file_url: (m as any).file_url,
                file_type: (m as any).file_type,
                file_name: (m as any).file_name,
              }

              if (tempIndex !== -1) {
                // Swap out the temp optimistic entry with the real one
                const updated = [...prev]
                updated[tempIndex] = confirmed
                return updated
              }

              // Guard against exact ID duplicates
              if (prev.some(pm => pm.id === m.id)) return prev

              return [...prev, confirmed]
            })
          }
        )
        .subscribe()
    }

    return () => {
      cancelled = true
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [appointmentId, doctorUserId, patientUserId, authUserId])

  // Doctors list is now managed in state and populated from the database

  // messages are now managed from Supabase state above

  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const sendMessage = async () => {
    if ((!message.trim() && !pendingFile) || !appointmentId || !authUserId || !doctorUserId || !patientUserId) return
    
    // 1. Upload file if exists
    let uploadedUrl = null
    if (pendingFile) {
      const fileExt = pendingFile.name.split('.').pop()
      const fileName = `${appointmentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(fileName, pendingFile)
        
      if (uploadError) {
        console.error("Upload error:", uploadError)
        toast({ title: "Upload Failed", description: "Could not upload file.", variant: "destructive" })
        return
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(fileName)
        
      uploadedUrl = publicUrl
    }

    const isPatient = authUserId === patientUserId
    const payload: any = {
      appointment_id: appointmentId,
      sender_id: authUserId,
      receiver_id: isPatient ? doctorUserId : patientUserId,
      content: message.trim() || (pendingFile ? "Shared a file" : ""),
    }
    
    if (pendingFile && uploadedUrl) {
      payload.file_url = uploadedUrl
      payload.file_type = pendingFile.type
      payload.file_name = pendingFile.name
    }

    // Optimistic UI
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId,
      sender: isPatient ? "patient" as const : "doctor" as const,
      content: payload.content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: payload.file_url ? "file" as const : "text" as const,
      file_url: payload.file_url,
      file_type: payload.file_type,
      file_name: payload.file_name,
    }
    setMessages((prev) => [...prev, optimistic])
    setMessage("")
    setPendingFile(null)

    const { data, error } = await supabase
      .from("messages")
      .insert(payload)
      .select("id, created_at, sender_id, content, file_url, file_type, file_name")
      .single()
    if (error) {
      console.error("Failed to send message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      return
    }
    if (data) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: data.id as string,
                sender: data.sender_id === doctorUserId ? "doctor" : "patient",
                content: data.content,
                timestamp: new Date(String(data.created_at)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                type: data.file_url ? "file" : "text",
                file_url: (data as any).file_url,
                file_type: (data as any).file_type,
                file_name: (data as any).file_name,
              }
            : m
        )
      )
    }
  }

  // Find the currently selected doctor, defaulting to the first doctor if none selected
  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedChat) || doctors[0]
  const headerDoctorName = doctorProfile
    ? `Dr. ${formatName(doctorProfile.first_name ?? '')} ${formatName(doctorProfile.last_name ?? '')}`.trim() || 'Doctor'
    : selectedDoctor?.name || 'Doctor'
  const headerDoctorAvatar = doctorProfile?.profile_image || selectedDoctor?.avatar || "/placeholder.svg"
  const headerDoctorInitials = (headerDoctorName || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
  const headerDoctorSpecialty = doctorProfile?.specialization || selectedDoctor?.specialty || 'General Practice'

  // Session status state
  const [sessionStatus, setSessionStatus] = useState<string>('scheduled')
  
  // Redirect to payment page when session completes
  useEffect(() => {
    if (sessionStatus === 'completed' && appointmentId) {
      router.push(`/payment?appointmentId=${appointmentId}`)
    }
  }, [sessionStatus, appointmentId, router])

  const [countdown, setCountdown] = useState<number | null>(null)
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeStartTime, setDisputeStartTime] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('24:00:00')
  const [showDisputeBanner, setShowDisputeBanner] = useState(true)
  // Removed unused sessionStartTime state

  // Define a proper type for the Supabase payload
  type ScheduleUpdatePayload = {
    new: {
      status: string;
      updated_at?: string;
    };
  };

  // Memoize the handleSessionComplete function to prevent infinite re-renders
  const handleSessionComplete = useCallback(async () => {
    if (!appointmentId) return;
    
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString() 
        })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      setSessionStatus('completed');
      setCountdown(null);
      
      // Optionally redirect to feedback/payment page
      // router.push(`/appointment/complete/${appointmentId}`);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  }, [appointmentId]);

  const startSession = useCallback(async (): Promise<boolean> => {
    if (!appointmentId) return false;
    
    try {
      // First, check if the session is already active
      const { data: currentSession } = await supabase
        .from('schedules')
        .select('status')
        .eq('id', appointmentId)
        .single();
      
      // If already active, no need to update
      if (currentSession?.status === 'active') return true;
      
      // Update to active status
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting session:', error);
      return false;
    }
  }, [appointmentId]);

  // Effect to handle session status updates and real-time sync
  const updateSessionStatus = useCallback(async () => {
    if (!appointmentId) return;
    
    try {
      // Fetch current session status with only the columns we know exist
      const { data: currentSession, error } = await supabase
        .from('schedules')
        .select('status, updated_at')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;
      if (!currentSession) {
        console.error('No session found with ID:', appointmentId);
        return;
      }

      setSessionStatus(currentSession.status || 'scheduled');

      // Auto-start session if it's in scheduled state
      if (currentSession.status === 'scheduled') {
        const sessionStarted = await startSession();
        if (sessionStarted) {
          setSessionStatus('active');
          return;
        }
      }

      // Handle countdown for pending_end status
      if (currentSession.status === 'pending_end') {
        const endRequestedAt = currentSession.updated_at 
          ? new Date(currentSession.updated_at) 
          : new Date();
        const now = new Date();
        const timeRemaining = Math.ceil(
          (10 * 60 * 1000 - (now.getTime() - endRequestedAt.getTime())) / 1000
        );
        
        if (timeRemaining > 0) {
          setCountdown(timeRemaining);
        } else {
          await handleSessionComplete();
        }
      }
    } catch (error) {
      console.error('Error in updateSessionStatus:', error);
    }
  }, [appointmentId, handleSessionComplete, startSession]);

  useEffect(() => {
    if (!appointmentId) return;
    
    // Initial status update
    updateSessionStatus();
    
    const channel = supabase
      .channel(`schedule_${appointmentId}_changes`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'schedules',
          filter: `id=eq.${appointmentId}`
        },
        (payload: ScheduleUpdatePayload) => {
          const newStatus = payload.new.status;
          setSessionStatus(newStatus);
          
          if (newStatus === 'pending_end') {
            // Start countdown when session is marked as pending end
            const endRequestedAt = payload.new.updated_at 
              ? new Date(payload.new.updated_at) 
              : new Date();
            const now = new Date();
            const timeRemaining = Math.ceil(
              (10 * 60 * 1000 - (now.getTime() - endRequestedAt.getTime())) / 1000
            );
            setCountdown(timeRemaining > 0 ? timeRemaining : 0);
          } else if (newStatus === 'completed') {
            // Handle session completion
            setCountdown(null);
          } else if (newStatus === 'disputed') {
            // Set dispute start time when status changes to disputed
            setDisputeStartTime(payload.new.updated_at || new Date().toISOString());
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  // Handle dispute countdown timer
  useEffect(() => {
    if (sessionStatus !== 'disputed' || !disputeStartTime) return;

    const disputeStart = new Date(disputeStartTime).getTime();
    const disputeEnd = disputeStart + 24 * 60 * 60 * 1000; // 24 hours from dispute start
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = disputeEnd - now;
      
      if (distance < 0) {
        setTimeLeft('00:00:00');
        // When countdown ends, show waiting for support message
        return;
      }
      
      // Calculate time left
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    
    // Update immediately
    updateTimer();
    
    // Update every second
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, [sessionStatus, disputeStartTime]);

  // Handle session countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (sessionStatus === 'pending_end' && countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev: number | null) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      // Countdown finished, complete the session
      handleSessionComplete();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, sessionStatus, handleSessionComplete]);



  return (
    <div className="h-screen bg-slate-950 flex relative">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar - Doctor List */}
      <div
        className={`
        ${showSidebar ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 fixed lg:relative z-50 lg:z-auto
        w-80 lg:w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 
        flex flex-col transition-transform duration-300 ease-in-out h-full
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">My Doctors</h1>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setShowSidebar(false)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input placeholder="Search doctors..." className="pl-10 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-[#004DFF]/30" />
          </div>
        </div>

        {/* Doctor List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {doctors.map((doctor) => (
            <motion.div
              key={doctor.id}
              whileHover={{ backgroundColor: "rgba(0, 77, 255, 0.05)" }}
              onClick={() => {
                setSelectedChat(doctor.id)
                setShowSidebar(false)
              }}
              className={`p-4 cursor-pointer border-b border-slate-800/50 transition-colors ${
                selectedChat === doctor.id ? "bg-[#004DFF]/10 border-l-2 border-l-[#004DFF]" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={doctor.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {doctor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {doctor.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white truncate">{doctor.name}</h3>
                    <span className="text-[10px] text-slate-500">{doctor.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 truncate max-w-[180px]">{doctor.lastMessage}</p>
                      <div className="flex items-center mt-1">
                        <Stethoscope className="w-3 h-3 text-[#004DFF] mr-1" />
                        <span className="text-xs text-slate-500">{doctor.specialty}</span>
                      </div>
                    </div>

                    {doctor.unread > 0 && <Badge className="bg-[#004DFF] text-white text-xs">{doctor.unread}</Badge>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dispute Resolution Banner */}
      {sessionStatus === 'disputed' && showDisputeBanner && (
        <div 
          className="fixed left-1/2 transform -translate-x-1/2 bg-amber-900/40 backdrop-blur-xl border border-amber-700/50 rounded-2xl p-4 shadow-2xl max-w-2xl w-full z-50"
          style={{ 
            bottom: '100px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {/* Close button */}
          <button 
            onClick={() => setShowDisputeBanner(false)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-800/50 transition"
            aria-label="Close banner"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-amber-200">
                ⚠️ Dispute in Progress
              </h3>
              <p className="text-sm text-amber-300/80 mt-1">
                You&apos;ve filed a dispute. You have <span className="font-mono font-bold text-amber-200">{timeLeft}</span> to resolve this with the doctor before support intervenes.
              </p>
              <p className="text-xs text-amber-400/60 mt-2">
                Note: False disputes may result in account suspension. Please resolve amicably if possible.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                onClick={async () => {
                  window.open("https://t.me/+AyXlku_fTwA2ZGJk", "_blank");
                }}
              >
                Contact Support
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-700/50"
                onClick={async () => {
                  if (!appointmentId) return;
                  const { error } = await supabase
                    .from('schedules')
                    .update({ 
                      status: 'completed',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', appointmentId);
                  if (!error) {
                    setSessionStatus('completed');
                  }
                }}
              >
                Resolve Dispute
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-400 border-red-700/50 hover:bg-red-900/30"
                onClick={async () => {
                  if (!appointmentId) return;
                  const { error } = await supabase
                    .from('schedules')
                    .update({ 
                      status: 'active',
                      dispute_reason: null,
                      dispute_started_at: null,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', appointmentId);
                  if (!error) {
                    setSessionStatus('active');
                    setDisputeReason('');
                  }
                }}
              >
                Cancel Dispute
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Dialog */}
      <AlertDialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">⚠️ Open Dispute</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-slate-400">Please provide a reason for disputing this session. This will be reviewed by our support team.</p>
              <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-700/30">
                <p className="text-sm font-semibold text-amber-400">Important Notice</p>
                <ul className="text-xs text-amber-200/80 list-disc pl-5 mt-2 space-y-1">
                  <li>Both parties have 24 hours to resolve the dispute amicably</li>
                  <li>False disputes may result in account suspension</li>
                  <li>Support will review and make a final decision if unresolved</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Please describe the issue in detail..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="min-h-[120px] bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:ring-1 focus:ring-[#004DFF]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!disputeReason.trim()}
              onClick={async () => {
                if (!appointmentId) return;
                
                const { error } = await supabase
                  .from('schedules')
                  .update({
                    status: 'disputed',
                    dispute_reason: disputeReason,
                    dispute_started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', appointmentId);
                
                if (error) {
                  console.error('Error updating session status:', error);
                  return;
                }
                
                setSessionStatus('disputed');
                setShowDisputeDialog(false);
              }}
            >
              Submit Dispute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedDoctor ? (
          <>
            {/* Chat Header */}
            <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setShowSidebar(true)}>
                    <Menu className="w-4 h-4" />
                  </Button>

                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={headerDoctorAvatar} />
                      <AvatarFallback className="bg-slate-700 text-white">{headerDoctorInitials}</AvatarFallback>
                    </Avatar>
                    {selectedDoctor.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full"></div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-white">{headerDoctorName}</h2>
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-3.5 h-3.5 text-[#004DFF]" />
                      <span className="text-xs text-slate-400">{headerDoctorSpecialty}</span>
                      {selectedDoctor.online && <span className="text-xs text-emerald-400">• Online</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      {/* End Session – visible as long as the session hasn't ended */}
                      {sessionStatus !== 'completed' && sessionStatus !== 'pending_end' && sessionStatus !== 'disputed' && (
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-slate-700 focus:bg-slate-700 hover:text-red-300 focus:text-red-300" 
                          onClick={async () => {
                            if (!appointmentId) return;
                            // Fetch user id fresh at click time to avoid null race
                            const { data: { user } } = await supabase.auth.getUser();
                            const userId = user?.id ?? null;
                            if (!userId) {
                              console.error('[Patient] End Session: No user ID found');
                              return;
                            }
                            const { error } = await supabase
                              .from('schedules')
                              .update({
                                status: 'pending_end',
                                end_requested_by: userId,
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', appointmentId);
                            if (error) {
                              console.error('[Patient] End Session supabase error:', error);
                            } else {
                              setSessionStatus('pending_end');
                              setSchedule(prev => prev ? { ...prev, end_requested_by: userId } : null);
                              setDidIRequestEnd(true);
                            }
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          End Session
                        </DropdownMenuItem>
                      )}
                      {(sessionStatus === 'active' || sessionStatus === 'pending_end') && (
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-slate-700 focus:bg-slate-700 hover:text-red-300 focus:text-red-300" 
                          onClick={() => setShowDisputeDialog(true)}
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          File Dispute
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Pending End Banner */}
            <AnimatePresence>
              {sessionStatus === 'pending_end' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-900/40 backdrop-blur-md border-b border-slate-800/50 p-4"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Session End Requested</h4>
                        <p className="text-xs text-slate-400">
                          {didIRequestEnd 
                            ? "Waiting for the doctor to confirm the end of this session..." 
                            : "The doctor wants to end this session. Please confirm to conclude."}
                        </p>
                      </div>
                    </div>
                    {!didIRequestEnd && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            if (!appointmentId) return;
                            const { error } = await supabase
                              .from('schedules')
                              .update({
                                status: 'active',
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', appointmentId);
                            if (!error) setSessionStatus('active');
                          }}
                          className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                        >
                          Continue Session
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-[#004DFF] hover:bg-blue-600 text-white"
                          onClick={async () => {
                            if (!appointmentId) return;
                            const { error } = await supabase
                              .from('schedules')
                              .update({
                                status: 'completed',
                                ended_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', appointmentId);
                            if (!error) {
                              setSessionStatus('completed');
                              window.location.href = '/payment';
                            }
                          }}
                        >
                          Confirm & End
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="flex justify-center mb-6 mt-2">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-1.5 flex items-center space-x-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-amber-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-400">Messages are end-to-end encrypted. No one outside of this chat, not even Epoch Telehealth, can read them.</span>
                </div>
              </div>

              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-3 ${
                        msg.sender === "patient"
                          ? "bg-gradient-to-br from-[#004DFF] to-blue-600 text-white rounded-br-none shadow-blue-500/20 shadow-lg"
                          : "bg-slate-800 text-slate-100 rounded-bl-none shadow-slate-900/50 shadow-md border border-slate-700/50"
                      }`}
                    >
                      {msg.file_url ? (
                        <div className="flex flex-col gap-2">
                          {msg.file_type?.startsWith('image/') ? (
                            <a href={msg.file_url} target="_blank" rel="noreferrer" className="block w-full max-w-sm overflow-hidden rounded-xl border border-white/10 relative pb-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={msg.file_url} alt="Attachment" className="w-full h-auto object-cover max-h-64 rounded-xl" />
                            </a>
                          ) : (
                            <a href={msg.file_url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border transition ${msg.sender === "patient" ? "bg-white/10 hover:bg-white/20 border-white/20" : "bg-slate-700 hover:bg-slate-600 border-slate-600"}`}>
                              <FileText className="w-8 h-8 opacity-80" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{msg.file_name || "Document"}</p>
                                <p className="text-xs opacity-70">PDF File</p>
                              </div>
                            </a>
                          )}
                          {msg.content && msg.content !== "Shared a file" && <p className="text-[15px] mt-1">{msg.content}</p>}
                        </div>
                      ) : (
                        <p className="text-[15px]">{msg.content}</p>
                      )}
                      <div
                        className={`flex items-center space-x-1 mt-1.5 text-[10px] sm:text-xs font-medium ${
                          msg.sender === "patient" ? "text-blue-100" : "text-slate-400"
                        }`}
                      >{msg.timestamp}
                        {msg.sender === "patient" && (
                          <svg className="w-3 h-3 text-blue-200/50" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 11.293 1.854 8.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-4.208 7.208l.708.708 7-7-.708-.708-7 7z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Session Status Banner */}
            {sessionStatus === 'pending_end' && countdown !== null && countdown > 0 && (
              <div className="bg-amber-900/30 backdrop-blur-sm border-b border-amber-700/30 p-2 text-center">
                <p className="text-sm font-medium text-amber-300">
                  Session ending in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </p>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-slate-900/80 border-t border-slate-800/50 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  {/* Media Buttons */}
                  <div className="flex items-center space-x-1 mb-2 relative">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 1024 * 1024) {
                          toast({ title: "File too large", description: "Please upload a file smaller than 1MB.", variant: "destructive" });
                          e.target.value = "";
                          return;
                        }
                        const allowed = ["image/png","image/jpeg","image/webp","image/gif","application/pdf"];
                        if (!allowed.includes(file.type)) {
                          toast({ title: "Unsupported file", description: "Only images (PNG, JPG, GIF, WebP) and PDFs are allowed.", variant: "destructive" });
                          e.target.value = "";
                          return;
                        }
                        setPendingFile(file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach image or PDF (max 1MB)"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      onClick={() => fileInputRef.current?.click()}
                      title="Share image or PDF (max 1MB)"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      onClick={() => setShowEmojiPicker((p) => !p)}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>

                    {pendingFile && (
                      <div className="absolute -top-12 left-0 bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg flex items-center gap-2 text-sm text-slate-200">
                        {pendingFile.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-emerald-400" />}
                        <span className="truncate max-w-[120px]">{pendingFile.name}</span>
                        <button onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-rose-400 ml-1">
                          &times;
                        </button>
                      </div>
                    )}

                    {/* Emoji picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-10 left-0 z-50 bg-slate-800 border border-slate-700 rounded-2xl p-3 shadow-2xl w-72">
                        <div className="grid grid-cols-8 gap-1 max-h-52 overflow-y-auto custom-scrollbar">
                          {["😊","😂","🤣","❤️","😍","🙏","😭","😘","👍","😅","🔥","🎉","✅","💯","🥺","👀","😎","🤔","💪","🌟","😷","🩺","💊","🏥","🧬","🩻","🤒","💉","🧘","😴","🤗","👋","🙌","👏","✌️","🫶","💙","🟢","⭐","🎗️"].map((em) => (
                            <button
                              key={em}
                              className="text-xl p-1 rounded hover:bg-slate-700 transition"
                              onClick={() => {
                                setMessage((prev) => prev + em);
                                setShowEmojiPicker(false);
                              }}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {sessionStatus === 'completed' ? (
                      <div className="text-center py-4 text-slate-400">
                        <p>This session has been completed. Messaging is no longer available.</p>
                        <p className="text-sm mt-1 text-slate-500">Please start a new session if you need further assistance.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (message.trim() || pendingFile) {
                                  sendMessage()
                                }
                              }
                            }}
                            placeholder={pendingFile ? 'Add a caption...' : 'Type a message...'}
                            className="min-h-[90px] flex-1 resize-none bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-[#004DFF]/30"
                          />
                          <div className="flex flex-col space-y-2">
                            <Button
                              onClick={sendMessage}
                              disabled={(!message.trim() && !pendingFile) || sessionStatus === 'completed'}
                              className="bg-[#004DFF] hover:bg-blue-600 text-white"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {sessionStatus === 'disputed' && (
                          <p className="text-xs text-amber-400/80 mt-2">
                            ⚠️ This session is under dispute. Please resolve the dispute to continue messaging.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800 border border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a doctor</h3>
              <p className="text-slate-400">Choose a doctor from the sidebar to start messaging</p>
              <Button className="mt-4 lg:hidden bg-[#004DFF] hover:bg-blue-600" onClick={() => setShowSidebar(true)}>
                <Menu className="w-4 h-4 mr-2" />
                Open Doctor List
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
