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
  ArrowLeft,
  Menu,
  Pill,
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
import { PrescriptionForm } from "@/components/prescription-form"
import { supabase } from "@/lib/supabase"

export default function DoctorChatPage() {
  const { toast } = useToast()
  const wallet = useWallet()
  const [selectedChat, setSelectedChat] = useState(1)
  const [message, setMessage] = useState("")
  const [showSidebar, setShowSidebar] = useState(false)
  const [showHealthRecord, setShowHealthRecord] = useState(false)
  const [showPrescription, setShowPrescription] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()

  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  // Chat state from Supabase
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<null | {
    id: string
    doctor_id: string
    patient_id: string
    end_requested_by?: string | null
    status: string
  }>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [didIRequestEnd, setDidIRequestEnd] = useState(false)
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
    file_url?: string
    file_type?: string
    file_name?: string
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
          
          // Update local schedule state with the new end_requested_by
          setSchedule(prev => prev ? { ...prev, end_requested_by: payload.new.end_requested_by as string | null } : null);
          
          // If the session is no longer pending_end, reset the local flag
          if (newStatus !== 'pending_end') setDidIRequestEnd(false);
          
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
  }, [appointmentId, doctorUserId]);

  // Show feedback modal when session completes
  useEffect(() => {
    if (sessionStatus === 'completed') {
      setShowFeedbackModal(true)
    }
  }, [sessionStatus])

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
          file_url: m.file_url,
          file_type: m.file_type,
          file_name: m.file_name,
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

              const confirmed: Message = {
                id: m.id,
                sender: m.sender_id === doctorUserId ? 'doctor' : 'patient',
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                type: m.file_url ? 'file' : 'text',
                file_url: m.file_url,
                file_type: m.file_type,
                file_name: m.file_name,
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

  // Patients list - using real data from the database
  const patients = [
    {
      id: 1,
      name: `${patientProfile?.first_name || 'Patient'} ${patientProfile?.last_name || ''}`.trim() || 'Patient',
      age: calculateAge(patientProfile?.date_of_birth),
      avatar: patientProfile?.profile_image || "/placeholder.svg?height=40&width=40",
      lastMessage: "Tap to view conversation",
      timestamp: "",
      unread: 0,
      online: true,
      condition: scheduleNote || "No notes available",
    },
  ]


  // Helper state for pending file upload
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const sendMessage = async () => {
    // Modify slightly: we can send a message IF there's text OR a pending file
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

    const isDoctor = authUserId === doctorUserId
    const payload: any = {
      appointment_id: appointmentId,
      sender_id: authUserId,
      receiver_id: isDoctor ? patientUserId : doctorUserId,
      content: message.trim() || (pendingFile ? "Shared a file" : ""),
    }
    
    if (pendingFile && uploadedUrl) {
      payload.file_url = uploadedUrl
      payload.file_type = pendingFile.type
      payload.file_name = pendingFile.name
    }

    // Optimistic UI
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      sender: isDoctor ? "doctor" : "patient",
      content: payload.content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: payload.file_url ? "file" : "text",
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
    <div className="h-screen bg-slate-950 flex relative">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-y-0 left-72 right-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

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
                The patient has filed a dispute. You have <span className="font-mono font-bold text-amber-200">{timeLeft}</span> to resolve this with the patient before support intervenes.
              </p>
              <p className="text-xs text-amber-400/60 mt-2">
                Note: Support will review the dispute and make a final decision if not resolved.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
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
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 transform ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">My Patients</h1>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setShowSidebar(false)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input placeholder="Search patients..." className="pl-10 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-[#004DFF]/30" />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {patients.map((patient) => (
            <motion.div
              key={patient.id}
              whileHover={{ backgroundColor: "rgba(0, 77, 255, 0.05)" }}
              onClick={() => {
                setSelectedChat(patient.id)
                setShowSidebar(false)
              }}
              className={`p-4 cursor-pointer border-b border-slate-800/50 transition-colors ${
                selectedChat === patient.id ? "bg-[#004DFF]/10 border-l-2 border-l-[#004DFF]" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={patient.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {patient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {patient.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white truncate">{patient.name}</h3>
                    <span className="text-[10px] text-slate-500">{patient.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 truncate max-w-[150px]">{patient.lastMessage}</p>
                      <div className="flex items-center mt-1">
                        <Users className="w-3 h-3 text-[#004DFF] mr-1" />
                        <span className="text-xs text-slate-500">
                          Age: {patient.age} • {patient.condition}
                        </span>
                      </div>
                    </div>

                    {patient.unread > 0 && <Badge className="bg-[#004DFF] text-white text-xs">{patient.unread}</Badge>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* End Session Confirmation Dialog */}
      <AlertDialog open={showEndSessionConfirm} onOpenChange={setShowEndSessionConfirm}>
        <AlertDialogContent className="bg-slate-900 border-slate-700/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">End Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to mark this session as completed? The patient will have 10 minutes to confirm or dispute the session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={async () => {
                if (!appointmentId) return;
                
                const { error } = await supabase
                  .from('schedules')
                  .update({
                    status: 'pending_end',
                    end_requested_by: authUserId,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', appointmentId);
                
                if (error) {
                  console.error('Error updating session status:', error);
                  return;
                }
                
                const doctorId = (await supabase.auth.getUser()).data.user?.id;
                setSessionStatus('pending_end');
                setSchedule(prev => prev ? { ...prev, end_requested_by: doctorId } : null);
                setDidIRequestEnd(true);
                setShowEndSessionConfirm(false);
              }}
            >
              Confirm End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback Dialog */}
      <AlertDialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <AlertDialogContent className="bg-slate-900 border-slate-700/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Session Completed 🎉</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              The consultation has ended successfully. Would you like to share your experience on X (Twitter)? Your feedback helps us grow!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Maybe Later</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-black hover:bg-slate-800 text-white border border-slate-700"
              onClick={() => {
                const text = encodeURIComponent("Just completed another successful telehealth consultation on Epoch! 🩺💻 Seamless experience and great patient care. The future of medicine is here. @EpochTelehealth #SolanaDoctor");
                window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
              }}
            >
              <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Post on X
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPatient ? (
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
                      <AvatarImage src={headerPatientAvatar} />
                      <AvatarFallback className="bg-slate-700 text-white">{headerPatientInitials}</AvatarFallback>
                    </Avatar>
                    {selectedPatient.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full"></div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-white">
                      {patientProfile?.first_name} {patientProfile?.last_name}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-[#004DFF]" />
                      <span className="text-xs text-slate-400">
                        Age: {calculateAge(patientProfile?.date_of_birth)}{scheduleNote && ' • ' + scheduleNote}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <WalletMultiButton className="!bg-transparent !p-0 !h-auto !border-0 hover:!bg-transparent" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700"
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
                      <DropdownMenuItem
                        className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700"
                        onClick={() => setShowPrescription(true)}
                      >
                        <Pill className="w-4 h-4 mr-2 text-emerald-400" />
                        Write Prescription
                      </DropdownMenuItem>
                      {sessionStatus !== 'completed' && sessionStatus !== 'pending_end' && sessionStatus !== 'disputed' && (
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-slate-700 focus:bg-slate-700 hover:text-red-300 focus:text-red-300"
                          onClick={() => setShowEndSessionConfirm(true)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          End Session
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
                            ? "Waiting for the patient to confirm the end of this session..." 
                            : "Patient requested to end this session. Please confirm to conclude."}
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
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          Decline End Request
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={async () => {
                            /* Accept completion logic */
                            if (!appointmentId) return;
                            const { error } = await supabase
                              .from('schedules')
                              .update({
                                status: 'completed',
                                completed_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', appointmentId);
                            if (!error) setSessionStatus('completed');
                          }}
                          className="bg-[#004DFF] hover:bg-blue-600 text-white"
                        >
                          Accept & End
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
                    className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-3 ${
                        msg.sender === "doctor"
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
                            <a href={msg.file_url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border transition ${msg.sender === "doctor" ? "bg-white/10 hover:bg-white/20 border-white/20" : "bg-slate-700 hover:bg-slate-600 border-slate-600"}`}>
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
                          msg.sender === "doctor" ? "text-blue-100" : "text-slate-400"
                        }`}
                      >{msg.timestamp}
                        {msg.sender === "doctor" && (
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

            {/* Message Input */}
            <div className="bg-slate-900/80 border-t border-slate-800/50 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  {/* Action row: file upload, emoji picker */}
                  <div className="flex items-center space-x-1 mb-2 relative">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                      className="hidden"
                      onChange={async (e) => {
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
                        // Stage file to be sent via sendMessage
                        setPendingFile(file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="ghost" size="sm"
                      className="text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach image or PDF (max 1MB)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="hidden sm:flex text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      onClick={() => { fileInputRef.current?.click(); }}
                      title="Share image or PDF (max 1MB)"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="hidden sm:flex text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      onClick={() => setShowEmojiPicker((p) => !p)}
                    >
                      <Smile className="w-4 h-4" />
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

                  {sessionStatus === 'completed' ? (
                    <div className="text-center py-4 text-slate-400">
                      <p>This session has been completed. Messaging is no longer available.</p>
                      <p className="text-sm mt-1 text-slate-500">Please be patient while escrow release funds to your wallet.</p>
                    </div>
                  ) : (
                    <div className="border-t border-slate-800/50 pt-3">
                      <div className="flex items-center space-x-2">
                          <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if ((message.trim() || pendingFile) && sessionStatus !== 'disputed') {
                                  sendMessage();
                                }
                              }
                            }}
                            placeholder={sessionStatus === 'disputed'
                              ? 'This session is under dispute. Please wait for resolution...'
                              : pendingFile ? 'Add a caption...' : 'Type your message...'}
                            className="min-h-[90px] flex-1 resize-none bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-[#004DFF]/30"
                            disabled={sessionStatus === 'disputed'}
                          />
                          <div className="flex flex-col space-y-2">
                            <Button
                              onClick={sendMessage}
                              disabled={(!message.trim() && !pendingFile) || sessionStatus === 'disputed' || sessionStatus === 'completed'}
                              className="bg-[#004DFF] hover:bg-blue-600 text-white"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      {sessionStatus === 'disputed' && (
                        <p className="text-xs text-amber-400/80 mt-2">
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
              <div className="w-16 h-16 bg-slate-800 border border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a patient</h3>
              <p className="text-slate-400">
                Choose a patient from the sidebar to start consultation
              </p>
              <Button className="mt-4 lg:hidden bg-[#004DFF] hover:bg-blue-600" onClick={() => setShowSidebar(true)}>
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

      {/* Prescription Dialog */}
      {showPrescription && selectedPatient && schedule && (
        <Dialog open={showPrescription} onOpenChange={setShowPrescription}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-transparent border-none p-0">
            <PrescriptionForm
              patientName={selectedPatient.name}
              patientId={schedule.patient_id}
              doctorId={schedule.doctor_id}
              appointmentId={appointmentId || ''}
              onSave={() => {
                setShowPrescription(false)
              }}
              onCancel={() => setShowPrescription(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
