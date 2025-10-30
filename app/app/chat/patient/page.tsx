"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
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
  Mic,
  MicOff,
  ArrowLeft,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

export default function PatientChatPage() {
  // Track the currently selected doctor's ID (string type to match database IDs)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Chat state from Supabase
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<null | {
    id: string
    doctor_id: string
    patient_id: string
  }>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
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
  
  const [messages, setMessages] = useState<
    { id: string; sender: "doctor" | "patient"; content: string; timestamp: string; type: "text" | "file" }[]
  >([])

  // Supabase messages row type
  type MessageRow = {
    id: string
    appointment_id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
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
            lastMessage: messages.length > 0 ? messages[messages.length - 1].content : "No messages yet",
            timestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : "",
            unread: 0, // You can implement unread count logic if needed
            online: true, // You can implement online status if needed
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
  }, [schedule, messages, selectedChat]);

  // Load messages and subscribe to realtime
  useEffect(() => {
    if (!appointmentId || !doctorUserId || !patientUserId) return
    let cancelled = false

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, appointment_id, sender_id, receiver_id, content, created_at")
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
          type: 'text' as const,
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
            
            // Skip if we've already processed this message
            if (processedMessageIds.has(m.id)) {
              console.log('Skipping duplicate message:', m.id)
              return
            }
            
            // Add to processed messages
            processedMessageIds.add(m.id)
            
            // Only keep the last 100 message IDs to prevent memory leaks
            if (processedMessageIds.size > 100) {
              const ids = Array.from(processedMessageIds).slice(-100)
              processedMessageIds.clear()
              ids.forEach(id => processedMessageIds.add(id))
            }
            
            // Only add the message if it's not from the current user
            // (since we already added it optimistically)
            if (m.sender_id === authUserId) {
              console.log('Skipping own message in realtime update:', m.id)
              return
            }
            
            setMessages((prev) => {
              // Check if message already exists (by ID or content + timestamp)
              const messageExists = prev.some(pm => 
                pm.id === m.id || 
                (pm.content === m.content && 
                 Math.abs(new Date(pm.timestamp).getTime() - new Date(m.created_at).getTime()) < 1000)
              )
              
              if (messageExists) return prev
              
              return [
                ...prev,
                {
                  id: m.id,
                  sender: m.sender_id === doctorUserId ? "doctor" : "patient",
                  content: m.content,
                  timestamp: new Date(m.created_at).toLocaleTimeString([], { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  }),
                  type: "text",
                },
              ]
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

  const sendMessage = async () => {
    if (!message.trim() || !appointmentId || !authUserId || !doctorUserId || !patientUserId) return
    const isPatient = authUserId === patientUserId
    const payload = {
      appointment_id: appointmentId,
      sender_id: authUserId,
      receiver_id: isPatient ? doctorUserId : patientUserId,
      content: message.trim(),
    }
    // Optimistic UI
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId,
      sender: isPatient ? "patient" as const : "doctor" as const,
      content: payload.content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text" as const,
    }
    setMessages((prev) => [...prev, optimistic])
    setMessage("")

    const { data, error } = await supabase
      .from("messages")
      .insert(payload)
      .select("id, created_at, sender_id")
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
                content: optimistic.content,
                timestamp: new Date(String(data.created_at)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                type: "text",
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex relative">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar - Doctor List */}
      <div
        className={`
        ${showSidebar ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 fixed lg:relative z-50 lg:z-auto
        w-80 lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        flex flex-col transition-transform duration-300 ease-in-out h-full
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Doctors</h1>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => setShowSidebar(false)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search doctors..." className="pl-10" />
          </div>
        </div>

        {/* Doctor List */}
        <div className="flex-1 overflow-y-auto">
          {doctors.map((doctor) => (
            <motion.div
              key={doctor.id}
              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
              onClick={() => {
                setSelectedChat(doctor.id)
                setShowSidebar(false)
              }}
              className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
                selectedChat === doctor.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={doctor.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {doctor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {doctor.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{doctor.name}</h3>
                    <span className="text-xs text-gray-500">{doctor.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{doctor.lastMessage}</p>
                      <div className="flex items-center mt-1">
                        <Stethoscope className="w-3 h-3 text-blue-600 mr-1" />
                        <span className="text-xs text-gray-500">{doctor.specialty}</span>
                      </div>
                    </div>

                    {doctor.unread > 0 && <Badge className="bg-blue-600 text-white text-xs">{doctor.unread}</Badge>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dispute Resolution Banner - Shows when session is in disputed status */}
      {sessionStatus === 'disputed' && showDisputeBanner && (
        <div className="fixed left-1/2 transform -translate-x-1/2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg max-w-2xl w-full z-50"
          style={{ 
            bottom: '100px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
          {/* Close button */}
          <button 
            onClick={() => setShowDisputeBanner(false)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-800/50"
            aria-label="Close banner"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ Dispute in Progress
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You&apos;ve filed a dispute. You have <span className="font-mono font-bold">{timeLeft}</span> to resolve this with the doctor before support intervenes.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Note: False disputes may result in account suspension. Please resolve amicably if possible.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={async () => {
                  // Open chat with support
                  window.open("https://t.me/+AyXlku_fTwA2ZGJk", "_blank");
                }}
              >
                Contact Support
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200 dark:hover:bg-green-900/50"
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
                className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Open Dispute</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please provide a reason for disputing this session. This will be reviewed by our support team within 24 hours.</p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-100 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Notice</p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 list-disc pl-5 mt-1 space-y-1">
                  <li>Both parties have 24 hours to resolve the dispute amicably</li>
                  <li>False disputes may result in account suspension</li>
                  <li>Support will review and make a final decision if unresolved</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Please describe the issue in detail..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
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
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowSidebar(true)}>
                    <Menu className="w-4 h-4" />
                  </Button>

                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={headerDoctorAvatar} />
                      <AvatarFallback>{headerDoctorInitials}</AvatarFallback>
                    </Avatar>
                    {selectedDoctor.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{headerDoctorName}</h2>
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{headerDoctorSpecialty}</span>
                      {selectedDoctor.online && <span className="text-sm text-green-600">• Online</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {sessionStatus === 'pending_end' && countdown !== null && countdown > 0 ? (
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDisputeDialog(true)}
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
                    >
                      Open Dispute
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
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
                        
                        if (error) {
                          console.error('Error completing session:', error);
                          return;
                        }
                        
                        setSessionStatus('completed');
                        // Redirect to payment page
                        window.location.href = '/payment';
                      }}
                    >
                      End Session
                    </Button>
                  </div>
                ) : (
                  <Link href="/payment">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                      End Session
                    </Button>
                  </Link>
                )}
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm lg:max-w-md ${
                        msg.sender === "patient"
                          ? "bg-gradient-to-r from-blue-600 to-green-600 text-white"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border"
                      } rounded-lg p-3 shadow-sm`}
                    >
                      {msg.type === "file" ? (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{msg.content}</span>
                        </div>
                      ) : (
                        <p className="text-sm break-words">{msg.content}</p>
                      )}
                      <div className={`text-xs mt-1 ${msg.sender === "patient" ? "text-blue-100" : "text-gray-500"}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Session Status Banner */}
            {sessionStatus === 'pending_end' && countdown !== null && countdown > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-2 text-center">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Session ending in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </p>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  {/* Media Buttons */}
                  <div className="flex items-center space-x-1 mb-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    {sessionStatus === 'completed' ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <p>This session has been completed. Messaging is no longer available.</p>
                        <p className="text-sm mt-1">Please start a new session if you need further assistance.</p>
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
                                if (message.trim()) {
                                  sendMessage()
                                }
                              }
                            }}
                            placeholder="Type a message..."
                            className="min-h-[90px] flex-1 resize-none"
                            disabled={isRecording}
                          />
                          <div className="flex flex-col space-y-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsRecording(!isRecording)}
                              className={isRecording ? "text-red-600" : ""}
                              disabled={sessionStatus === 'completed'}
                            >
                              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>

                            <Button
                              onClick={sendMessage}
                              disabled={!message.trim() || sessionStatus === 'completed'}
                              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {sessionStatus === 'disputed' && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
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
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a doctor</h3>
              <p className="text-gray-600 dark:text-gray-300">Choose a doctor from the sidebar to start messaging</p>
              <Button className="mt-4 lg:hidden" onClick={() => setShowSidebar(true)}>
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
