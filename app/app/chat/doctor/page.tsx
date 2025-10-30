"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"
import { CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { HealthRecordForm } from "@/components/health-record-form"
import { supabase } from "@/lib/supabase"

export default function DoctorChatPage() {
  const { toast } = useToast()
  const wallet = useWallet()
  const [selectedChat, setSelectedChat] = useState(1)
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showHealthRecord, setShowHealthRecord] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Chat state from Supabase
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<null | {
    id: string
    doctor_id: string
    patient_id: string
    status: string
  }>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [doctorUserId, setDoctorUserId] = useState<string | null>(null)
  const [patientUserId, setPatientUserId] = useState<string | null>(null)
  const [patientProfile, setPatientProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
    profile_image: string | null;
    date_of_birth?: string | null;
  } | null>(null)
  const [scheduleNote, setScheduleNote] = useState<string | null>(null)
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false)
  const [messages, setMessages] = useState<
    { id: string; sender: "doctor" | "patient"; content: string; timestamp: string; type: "text" | "file" }[]
  >([])
  const [sessionStatus, setSessionStatus] = useState<string>('active')
  const [showDisputeBanner, setShowDisputeBanner] = useState(true)
  const [disputeStartTime, setDisputeStartTime] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('24:00:00')

  // Supabase messages row type
  type MessageRow = {
    id: string
    appointment_id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
  }

  // Type for schedule update payload
  type ScheduleUpdatePayload = {
    new: {
      id: string;
      status: string;
      updated_at: string;
      [key: string]: unknown; // Use unknown instead of any for type safety
    };
    old: {
      [key: string]: unknown; // Use unknown instead of any for type safety
    };
  };

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

  // Subscribe to real-time updates for session status
  useEffect(() => {
    if (!appointmentId) return;
    
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
          
          if (newStatus === 'disputed') {
            // Set dispute start time when status changes to disputed
            setDisputeStartTime(payload.new.updated_at || new Date().toISOString());
            setShowDisputeBanner(true);
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  // Read appointment ID from search params (supports multiple common keys)
  useEffect(() => {
    const possibleKeys = [
      "appointmentId",
      "appointment_id",
      "scheduleId",
      "schedule_id",
      "id",
    ] as const
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

  // Fetch schedule and messages when appointmentId changes
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
            setSessionStatus(payload.new.status);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchSchedule();
  }, [appointmentId]);

  // After schedule, resolve doctor/patient to their user_profile_ids and fetch patient profile for header
  useEffect(() => {
    if (!schedule) return
    let cancelled = false
    
    const fetchData = async () => {
      try {
        // Fetch doctor and patient data in parallel
        const [
          { data: d, error: de },
          { data: p, error: pe },
          { data: scheduleData, error: scheduleError }
        ] = await Promise.all([
          supabase.from("doctor_profiles").select("user_profile_id").eq("id", schedule.doctor_id).single(),
          supabase
            .from("patient_profiles")
            .select("user_profile_id, first_name, last_name, profile_image, date_of_birth")
            .eq("id", schedule.patient_id)
            .single(),
          supabase
            .from("schedules")
            .select("notes")
            .eq("id", schedule.id)
            .single()
        ])

        if (cancelled) return
        
        if (de) console.error("Failed to fetch doctor user id:", de)
        if (pe) console.error("Failed to fetch patient user id/profile:", pe)
        if (scheduleError) console.error("Failed to fetch schedule note:", scheduleError)

        setDoctorUserId(d?.user_profile_id ?? null)
        setPatientUserId(p?.user_profile_id ?? null)
        setScheduleNote(scheduleData?.notes ?? null)
        
        setPatientProfile({
          first_name: p?.first_name ?? null,
          last_name: p?.last_name ?? null,
          profile_image: p?.profile_image ?? null,
          date_of_birth: p?.date_of_birth ?? null
        })
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
    
    return () => {
      cancelled = true
    }
  }, [schedule])

  // Calculate patient's age from date of birth
  const calculateAge = (dob: string | null | undefined): string => {
    if (!dob) return 'N/A'
    
    try {
      const birthDate = new Date(dob)
      // Check if the date is valid
      if (isNaN(birthDate.getTime())) return 'N/A'
      
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      return age.toString()
    } catch (error) {
      console.error('Error calculating age:', error)
      return 'N/A'
    }
  }

  // Load existing messages and subscribe to realtime inserts
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

  // Patients list - using real data from the database
  const patients = [
    {
      id: 1,
      name: `${patientProfile?.first_name || 'Patient'} ${patientProfile?.last_name || ''}`.trim() || 'Patient',
      age: calculateAge(patientProfile?.date_of_birth),
      avatar: patientProfile?.profile_image || "/placeholder.svg?height=40&width=40",
      lastMessage: messages.length > 0 ? messages[messages.length - 1].content : "No messages yet",
      timestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : "",
      unread: 0, // You can implement unread count logic if needed
      online: true, // You can implement online status if needed
      condition: scheduleNote || "No notes available",
    },
  ]


  const sendMessage = async () => {
    if (!message.trim() || !appointmentId || !authUserId || !doctorUserId || !patientUserId) return
    const isDoctor = authUserId === doctorUserId
    const payload = {
      appointment_id: appointmentId,
      sender_id: authUserId,
      receiver_id: isDoctor ? patientUserId : doctorUserId,
      content: message.trim(),
    }
    // Optimistic UI
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId,
      sender: isDoctor ? "doctor" as const : "patient" as const,
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
      // Rollback optimistic on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      return
    }
    if (data) {
      // Replace optimistic with real
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

  const selectedPatient = patients.find((patient) => patient.id === selectedChat)
  const headerPatientName = patientProfile
    ? `${patientProfile.first_name ?? ""} ${patientProfile.last_name ?? ""}`.trim() || "Patient"
    : selectedPatient?.name
  const headerPatientAvatar = patientProfile?.profile_image || selectedPatient?.avatar || "/placeholder.svg"
  const headerPatientInitials = (headerPatientName || "")
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex relative">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Dispute Resolution Banner - Shows when session is in disputed status */}
      {sessionStatus === 'disputed' && showDisputeBanner && (
        <div 
          className="fixed left-1/2 transform -translate-x-1/2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg max-w-2xl w-full z-50"
          style={{ 
            bottom: '100px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
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
                The patient has filed a dispute. You have <span className="font-mono font-bold">{timeLeft}</span> to resolve this with the patient before support intervenes.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Note: Support will review the dispute and make a final decision if not resolved.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                  onClick={() => window.open("https://t.me/+AyXlku_fTwA2ZGJk", "_blank")}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Patients</h1>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => setShowSidebar(false)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search patients..." className="pl-10" />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto">
          {patients.map((patient) => (
            <motion.div
              key={patient.id}
              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
              onClick={() => {
                setSelectedChat(patient.id)
                setShowSidebar(false)
              }}
              className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
                selectedChat === patient.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={patient.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {patient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {patient.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{patient.name}</h3>
                    <span className="text-xs text-gray-500">{patient.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{patient.lastMessage}</p>
                      <div className="flex items-center mt-1">
                        <Users className="w-3 h-3 text-blue-600 mr-1" />
                        <span className="text-xs text-gray-500">
                          Age: {patient.age} • {patient.condition}
                        </span>
                      </div>
                    </div>

                    {patient.unread > 0 && <Badge className="bg-blue-600 text-white text-xs">{patient.unread}</Badge>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* End Session Confirmation Dialog */}
      <AlertDialog open={showEndSessionConfirm} onOpenChange={setShowEndSessionConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this session as completed? The patient will have 10 minutes to confirm or dispute the session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-green-600 hover:bg-green-700"
              onClick={async () => {
                if (!appointmentId) return;
                
                const { error } = await supabase
                  .from('schedules')
                  .update({
                    status: 'pending_end',
                    end_requested_by: (await supabase.auth.getUser()).data.user?.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', appointmentId);
                
                if (error) {
                  console.error('Error updating session status:', error);
                  return;
                }
                
                setSessionStatus('pending_end');
                setShowEndSessionConfirm(false);
              }}
            >
              Confirm End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPatient ? (
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
                      <AvatarImage src={headerPatientAvatar} />
                      <AvatarFallback>{headerPatientInitials}</AvatarFallback>
                    </Avatar>
                    {selectedPatient.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {patientProfile?.first_name} {patientProfile?.last_name}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Age: {calculateAge(patientProfile?.date_of_birth)}{scheduleNote && ' • ' + scheduleNote}
                      </span>
                      {/* <span className="text-sm text-green-600">• Online</span> */}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {sessionStatus === 'pending_end' && (
                    <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
                      Waiting for patient confirmation...
                    </div>
                  )}
                  <WalletMultiButton className="!bg-transparent !p-0 !h-auto !border-0 hover:!bg-transparent" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          const { publicKey } = wallet;
                          if (!publicKey) {
                            toast({
                              title: "Wallet Not Connected",
                              description: "Please connect your wallet first to access medical records.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setShowHealthRecord(true);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Medical Record
                      </DropdownMenuItem>
                      {sessionStatus === 'active' && (
                        <DropdownMenuItem onClick={() => setShowEndSessionConfirm(true)}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Completed
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm lg:max-w-md ${
                        msg.sender === "doctor"
                          ? "bg-gradient-to-r from-blue-600 to-green-600 text-white"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border"
                      } rounded-lg p-3 shadow-sm`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <div className={`text-xs mt-1 ${msg.sender === "doctor" ? "text-blue-100" : "text-gray-500"}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>

                  {sessionStatus === 'completed' ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p>This session has been completed. Messaging is no longer available.</p>
                      <p className="text-sm mt-1">Please be patient while escrow release funds to your wallet.</p>
                    </div>
                  ) : (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center space-x-2">
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (message.trim() && sessionStatus !== 'disputed') {
                                sendMessage();
                              }
                            }
                          }}
                          placeholder={sessionStatus === 'disputed' 
                            ? 'This session is under dispute. Please wait for resolution...' 
                            : 'Type your message...'}
                          className="min-h-[90px] flex-1 resize-none"
                          disabled={isRecording || sessionStatus === 'disputed'}
                        />
                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsRecording(!isRecording)}
                            className={isRecording ? "text-red-600" : ""}
                            disabled={sessionStatus === 'disputed' || sessionStatus === 'completed'}
                          >
                            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </Button>

                          <Button
                            onClick={sendMessage}
                            disabled={!message.trim() || sessionStatus === 'disputed' || sessionStatus === 'completed'}
                            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {sessionStatus === 'disputed' && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                          ⚠️ This session is under dispute. Please wait for the patient or support to resolve the issue.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a patient</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose a patient from the sidebar to start consultation
              </p>
              <Button className="mt-4 lg:hidden" onClick={() => setShowSidebar(true)}>
                <Menu className="w-4 h-4 mr-2" />
                Open Patient List
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Health Record Dialog */}
      {showHealthRecord && selectedPatient && schedule && (
        <Dialog open={showHealthRecord} onOpenChange={setShowHealthRecord}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <HealthRecordForm
              patientName={selectedPatient.name}
              patientId={schedule.patient_id}
              doctorId={schedule.doctor_id}
              onSave={(data) => {
                console.log("Health record saved:", data)
                setShowHealthRecord(false)
              }}
              onCancel={() => setShowHealthRecord(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
