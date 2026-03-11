/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Star,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Shield,
  Video,
  MessageCircle,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatName } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { DoctorProfile, fetchDoctorById } from "@/lib/doctors";
import { createSchedule } from "@/lib/schedules";
import DoctorProfileSkeleton from "@/components/doctorprofileskeleton";
// import { TelehealthsolEscrow } from "@/utils/telehealthsol_escrow";
// import idl from "@/utils/telehealthsol_escrow.json";
// import {
//   PublicKey,
//   Connection,
//   SystemProgram,
//   Transaction,
//   LAMPORTS_PER_SOL,
// } from "@solana/web3.js";
// import { BN, Program } from "@coral-xyz/anchor";
// import {
//   getAssociatedTokenAddressSync,
//   TOKEN_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID
// } from "@solana/spl-token";
import {
  usePhantom,
  useModal,
  useAccounts,
  useSolana,
} from "@phantom/react-sdk";

// const idl_string = JSON.stringify(idl);
// const idl_object = JSON.parse(idl_string);
// const programID = new PublicKey(idl.address);

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // Phantom wallet hooks
  const { isConnected } = usePhantom();
  const { open } = useModal();
  const addresses = useAccounts();
  const { solana } = useSolana();

  const doctorId = searchParams?.get("doctorId");
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // State for consultation type
  const [selectedType, setSelectedType] = useState<{
    id: string;
    name: string;
    description: string;
    duration: number;
    icon: React.ComponentType<{ className?: string }>;
  } | null>(null);

  useEffect(() => {
    const loadDoctor = async () => {
      if (!doctorId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const doctorData = await fetchDoctorById(doctorId);
        setDoctor(doctorData);
      } catch (error) {
        console.error("Failed to load doctor:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctor();
  }, [doctorId]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email || undefined });
      }
    };
    getUser();
  }, []);

  if (!doctorId) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Doctor not found</h2>
          <p className="text-muted-foreground mt-2">
            Please select a doctor to schedule an appointment
          </p>
          <Button className="mt-4" onClick={() => router.push("/doctors")}>
            Browse Doctors
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <DoctorProfileSkeleton />;
  }

  if (!doctor) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Doctor not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested doctor could not be found.
          </p>
          <Button className="mt-4" onClick={() => router.push("/doctors")}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Format doctor's data
  const doctorName = `Dr. ${formatName(doctor.first_name)} ${formatName(
    doctor.last_name
  )}`;
  // Calculate fees dynamically
  let consultationFee = 0;
  if (selectedType) {
    if (selectedType.id === "video") consultationFee = Number(doctor.consultation_fee_30min_video) || 0;
    else if (selectedType.id === "extended_video") consultationFee = Number(doctor.consultation_fee_60min_video) || 0;
    else if (selectedType.id === "text") consultationFee = Number(doctor.consultation_fee_30min_chat) || 0;
  } else {
    // Collect non-null, non-undefined, >0 fees as Numbers
    const fees = [
      Number(doctor.consultation_fee_30min_video), 
      Number(doctor.consultation_fee_60min_video), 
      Number(doctor.consultation_fee_30min_chat)
    ].filter((f) => !isNaN(f) && f > 0);
    
    consultationFee = fees.length > 0 ? Math.min(...fees) : 0;
  }
  
  const totalAmount = consultationFee;
  
  const location = [doctor.city, doctor.country].filter(Boolean).join(", ");
  const experience = doctor.years_of_experience
    ? `${doctor.years_of_experience} years`
    : "Experienced";
  const languages = doctor.languages?.join(", ") || "English";

  // Consultation types with proper TypeScript types
  const consultationTypes: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    duration: number;
    price: number;
  }> = [
    {
      id: "text",
      name: "Text Chat",
      description: "Secure async messaging consultation",
      icon: MessageCircle,
      duration: 30,
      price: Number(doctor.consultation_fee_30min_chat) || 0,
    },
    {
      id: "video",
      name: "Video Call",
      description: "Face-to-face video consultation",
      icon: Video,
      duration: 30,
      price: Number(doctor.consultation_fee_30min_video) || 0,
    },
    {
      id: "extended_video",
      name: "Extended Video Call",
      description: "Comprehensive 60-minute video session",
      icon: Video,
      duration: 60,
      price: Number(doctor.consultation_fee_60min_video) || 0,
    },
  ];

  const handleConsultationTypeSelect = (type: {
    id: string;
    name: string;
    description: string;
    duration: number;
    icon: React.ComponentType<{ className?: string }>;
    price: number;
  }) => {
    setSelectedType(type);
  };

  // Generate dates for the next 7 days based on availability
  const generateDates = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const fullDayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayName = days[date.getDay()];
      const fullDayName = fullDayNames[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const dateString = `${day} ${month}`;
      
      const daySchedule = doctor?.availability_schedule?.[fullDayName];
      const isOpen = daySchedule ? daySchedule.isOpen : true; // default true if no schedule defined

      return {
        value: dateString,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayName,
        date: dateString,
        dateObj: new Date(date),
        fullDayName,
        isOpen
      };
    });
  };

  const dates = generateDates();

  // Generate time slots based on the selected date's schedule
  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    
    // Find the full day name from the selected date string
    const dateObj = dates.find(d => d.value === selectedDate);
    if (!dateObj || !dateObj.isOpen) return [];
    
    const daySchedule = doctor?.availability_schedule?.[dateObj.fullDayName];
    
    const slots = [];
    
    // Default 8-5 if no schedule
    let startHour = 8, startMin = 0;
    let endHour = 17, endMin = 0;
    
    if (daySchedule && daySchedule.start && daySchedule.end) {
       const startParts = daySchedule.start.split(":");
       startHour = parseInt(startParts[0]);
       startMin = parseInt(startParts[1]);
       
       const endParts = daySchedule.end.split(":");
       endHour = parseInt(endParts[0]);
       endMin = parseInt(endParts[1]);
    }

    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push({
        time: `${currentHour % 12 || 12}:${currentMin === 0 ? "00" : "30"} ${currentHour >= 12 ? "PM" : "AM"}`,
        value: `${currentHour.toString().padStart(2, "0")}:${currentMin === 0 ? "00" : "30"}`,
      });
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleBooking = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!selectedType) {
      toast({
        title: "Incomplete Information",
        description: "Please select a consultation type",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Validate inputs
      if (!selectedDate || !selectedTime) {
        throw new Error("Please select both date and time");
      }

      // Get patient profile with user data
      const { data: patientData, error: patientProfileError } = await supabase
        .from("patient_profiles")
        .select(
          `
          id,
          user_profile_id,
          first_name,
          last_name,
          user_profiles!inner (email)
        `
        )
        .eq("user_profile_id", user.id)
        .single();

      if (patientProfileError || !patientData) {
        console.error("Patient profile error:", patientProfileError);
        throw new Error("Please complete your patient profile before booking");
      }

      const patientProfile = {
        id: patientData.id,
        user_profile_id: patientData.user_profile_id,
        first_name: patientData.first_name,
        last_name: patientData.last_name,
      };

      // 3. Parse the selected date (format: '5 Sep')
      const now = new Date();
      const currentYear = now.getFullYear();

      // Parse the date string (e.g., '5 Sep')
      const [day, monthName] = selectedDate.split(" ");
      const monthMap: { [key: string]: number } = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };

      const month = monthMap[monthName];
      const dayNum = parseInt(day, 10);

      // Parse the time string (e.g., '1:30 PM')
      const [time, period] = selectedTime.split(" ");
      // eslint-disable-next-line prefer-const
      let [hours, minutes] = time.split(":").map(Number);

      // Convert to 24-hour format
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      // Create the date object
      const startTime = new Date(currentYear, month, dayNum, hours, minutes);

      // Validate the date
      if (isNaN(startTime.getTime())) {
        throw new Error("Invalid date or time selected");
      }

      // Ensure the date is in the future
      if (startTime <= now) {
        // If the date is in the past, try next year
        startTime.setFullYear(currentYear + 1);

        // If it's still in the past, throw an error
        if (startTime <= now) {
          throw new Error("Please select a future date and time");
        }
      }

      // Format for Supabase (YYYY-MM-DD and HH:MM:SS)
      const formatTwoDigits = (num: number) => num.toString().padStart(2, "0");
      const scheduledDate = `${startTime.getFullYear()}-${formatTwoDigits(
        startTime.getMonth() + 1
      )}-${formatTwoDigits(startTime.getDate())}`;
      const startTimeStr = `${formatTwoDigits(
        startTime.getHours()
      )}:${formatTwoDigits(startTime.getMinutes())}:00`;

      // Calculate end time
      const endTime = new Date(
        startTime.getTime() + (selectedType?.duration || 30) * 60000
      );
      const endTimeStr = `${formatTwoDigits(
        endTime.getHours()
      )}:${formatTwoDigits(endTime.getMinutes())}:00`;

      // Check for existing schedule first
      const { data: existingSchedule, error: checkError } = await supabase
        .from("schedules")
        .select("id")
        .eq("doctor_id", doctor?.id)
        .eq("scheduled_date", scheduledDate)
        .eq("start_time", startTimeStr)
        .single();

      if (existingSchedule) {
        throw new Error(
          "This time slot is already booked. Please select a different time."
        );
      }

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is expected
        console.error("Error checking schedule:", checkError);
        throw new Error("Error checking availability. Please try again.");
      }

      // Perform payment using Solana escrow program
      // const doctorWallet: string | undefined =
      //   doctor.wallet_address || undefined;
      // if (!doctorWallet) {
      //   throw new Error("Doctor payment address is not configured.");
      // }
      // if (!user?.email) {
      //   throw new Error(
      //     "Your account does not have an email set. Please re-login."
      //   );
      // }

      // Check wallet connection
      // if (!isConnected || !addresses || addresses.length === 0) {
      //   toast({
      //     title: "Wallet Required",
      //     description: "Please connect your wallet to proceed with payment.",
      //     variant: "destructive",
      //   });
      //   open();
      //   return;
      // }

      // const patientWallet = addresses[0].address;

      // Create Solana connection
      // const connection = new Connection(
      //   "https://mainnet.helius-rpc.com/?api-key=0956b94b-51c1-4add-a9d0-37ed87d401d6",
      //   "confirmed"
      // );

      // const connection = new Connection(
      //   "https://devnet.helius-rpc.com/?api-key=0956b94b-51c1-4add-a9d0-37ed87d401d6",
      //   "confirmed"
      // );

      // Create program instance without AnchorProvider (we'll build transactions manually)
      // const program = new Program<TelehealthsolEscrow>(idl_object, programID);

      // Convert consultation date to seed (using timestamp)
      // const consultationDateTime = new Date(`${selectedDate}T${selectedTime}`);
      // const seed = new BN(startTime.getTime());

      // Convert amount to lamports (assuming USDC with 6 decimals)
      // const sessionAmount = new BN(totalAmount * 1_000_000); // Convert to smallest unit

      // Derive escrow PDA
      // const [escrow] = PublicKey.findProgramAddressSync(
      //   [
      //     Buffer.from("session"),
      //     new PublicKey(patientWallet).toBuffer(),
      //     seed.toArrayLike(Buffer, "le", 8),
      //   ],
      //   program.programId
      // );

      // Derive vault ATA (this will be created by the program)
      // const vault = getAssociatedTokenAddressSync(
      //   new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
      //   escrow,
      //   true,
      //   TOKEN_PROGRAM_ID,
      //   ASSOCIATED_TOKEN_PROGRAM_ID
      // );

      // Get patient ATA
      // const patientAta = getAssociatedTokenAddressSync(
      //   new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
      //   new PublicKey(patientWallet),
      //   false,
      //   TOKEN_PROGRAM_ID,
      //   ASSOCIATED_TOKEN_PROGRAM_ID
      // );

      // Platform wallet
      // const platformWallet = new PublicKey(
      //   "EpochDhSxSmkmtSA2tZjGW8JCUV8QBWTmkigKskvkv6V"
      // );

      // Check if patient ATA exists and has sufficient balance
      // const patientAtaInfo = await connection.getAccountInfo(patientAta);

      // if (!patientAtaInfo) {
      //   toast({
      //     title: "USDC Account Required",
      //     description:
      //       "You need to create a USDC account in your wallet first. Please get some USDC tokens to proceed.",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // Check USDC balance
      // const tokenBalance = await connection.getTokenAccountBalance(patientAta);
      // const requiredAmount = totalAmount * 1_000_000; // Convert to smallest unit

      // if (Number(tokenBalance.value.amount) < requiredAmount) {
      //   toast({
      //     title: "Insufficient USDC Balance",
      //     description: `You need ${totalAmount} USDC but only have ${Number(
      //       tokenBalance.value.uiAmount || 0
      //     ).toFixed(2)} USDC.`,
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // toast({
      //   title: "Processing Payment",
      //   description: "Setting up network and approving transaction...",
      // });

      // Ensure wallet is on devnet
      // try {
      //   await solana.switchNetwork("devnet");
      // } catch (error) {
      //   console.warn("Failed to switch network:", error);
      // }

      // // First, test with a simple SOL transfer to verify connection works
      // toast({
      //   title: "Testing Connection",
      //   description: "Sending test transaction...",
      // });

      // try {
      //   const testTransaction = new Transaction().add(
      //     SystemProgram.transfer({
      //       fromPubkey: new PublicKey(patientWallet),
      //       toPubkey: new PublicKey(
      //         "EpochDhSxSmkmtSA2tZjGW8JCUV8QBWTmkigKskvkv6V"
      //       ),
      //       lamports: 0.01 * LAMPORTS_PER_SOL, // 0.01 SOL
      //     })
      //   );

      //   // Set recent blockhash and fee payer
      //   const { blockhash } = await connection.getLatestBlockhash("confirmed");
      //   testTransaction.recentBlockhash = blockhash;
      //   testTransaction.feePayer = new PublicKey(patientWallet);

      //   // Send test transaction
      //   const testResult = await solana.signAndSendTransaction(testTransaction);
      //   console.log("Test transaction successful:", testResult.signature);

      //   toast({
      //     title: "Connection Test Successful",
      //     description: "Proceeding with booking...",
      //   });
      // } catch (testError) {
      //   console.error("Test transaction failed:", testError);
      //   toast({
      //     title: "Connection Test Failed",
      //     description: `Unable to process payment: ${testError instanceof Error ? testError.message : 'Unknown error'}`,
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // Start the session (fund escrow)
      // const transaction = await program.methods
      //   .startSession(seed, sessionAmount)
      //   .accounts({
      //     patient: new PublicKey(patientWallet),
      //     platform: platformWallet,
      //     escrow,
      //     mint: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
      //     patientAta,
      //     vault,
      //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      //     tokenProgram: TOKEN_PROGRAM_ID,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .transaction();

      // Set recent blockhash and fee payer
      // const { blockhash } = await connection.getLatestBlockhash("confirmed");
      // transaction.recentBlockhash = blockhash;
      // transaction.feePayer = new PublicKey(patientWallet);

      // Sign and send transaction using Phantom
      // const startSessionTx = await solana.signAndSendTransaction(transaction);

      // console.log("Session started with tx:", startSessionTx.signature);

      // toast({
      //   title: "Payment Successful",
      //   description: "Your consultation has been funded in escrow.",
      // });

      // If we reach here, payment was authorized.
      // Create the Whereby room FIRST, before creating the schedule (only for video consultations)
      let roomUrl: string | null = null;
      let meetingId: string | null = null;

      if (selectedType.id === "video" || selectedType.id === "extended_video") {
        setIsCreatingRoom(true);

        try {
          // meeting end date = scheduled end time + 10 minutes buffer
          const meetingEndDate = new Date(endTime.getTime() + 10 * 60 * 1000);
          const createRoomRes = await fetch("/api/create-room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endDate: meetingEndDate.toISOString() }),
          });

          const createRoomJson = await createRoomRes.json();
          if (!createRoomRes.ok) {
            throw new Error("Failed to create video room");
          }

          // Extract room info from response
          const { roomUrl: url, meetingId: id } = createRoomJson as {
            roomUrl: string;
            meetingId: string;
          };
          roomUrl = url;
          meetingId = id;
        } catch (roomError) {
          setIsCreatingRoom(false);
          throw roomError;
        } finally {
          setIsCreatingRoom(false);
        }
      }

      try {
        // Now create the schedule WITH the room info and escrow info included
        const scheduleData = await createSchedule({
          doctor_id: doctor?.id || "",
          patient_id: patientProfile.id,
          scheduled_date: scheduledDate,
          start_time: startTimeStr,
          end_time: endTimeStr,
          consultation_type: selectedType.id,
          notes: symptoms || null,
          room_url: roomUrl,
          meeting_id: meetingId,
        });

        if (!scheduleData) {
          throw new Error("Schedule was not created");
        }

        console.log("Schedule created with room info:", {
          scheduleId: scheduleData.id,
          meetingId,
        });

        // Debug: Log doctor profile data
        console.log("Doctor profile data:", {
          id: doctor.id,
          user_profile_id: doctor.user_profile_id,
          first_name: doctor.first_name,
          last_name: doctor.last_name,
        });

        // Get doctor's email from user_profiles
        if (!doctor.user_profile_id) {
          console.error("Doctor profile is missing user profile ID");
          throw new Error("Could not find doctor contact information");
        }

        // Use the database function to get doctor's email (bypasses RLS)
        console.log(
          "Looking up doctor email with function for ID:",
          doctor.user_profile_id
        );

        const { data: doctorEmail, error: emailError } = await supabase
          .rpc("get_doctor_email", { doctor_user_id: doctor.user_profile_id })
          .single();

        console.log("Doctor email lookup result:", {
          doctorEmail,
          error: emailError,
        });

        if (emailError || !doctorEmail) {
          console.error("Failed to fetch doctor email:", emailError);
          throw new Error("Could not retrieve doctor contact information");
        }

        console.log("Found doctor email via function:", doctorEmail);

        // Get patient's email from user_profiles if not already in patientProfile
        const patientEmail = user.email;
        if (!patientEmail) {
          throw new Error("Patient email not found");
        }

        // Send calendar invite to both patient and doctor
        try {
          const patientName =
            [patientProfile.first_name, patientProfile.last_name]
              .filter(Boolean)
              .join(" ") || "Patient";
          const doctorName =
            [doctor.first_name, doctor.last_name].filter(Boolean).join(" ") ||
            "Your Doctor";
          // Add null checks for selectedType and its properties
          const patientMeetingLink =
            selectedType &&
            (selectedType.id === "video" ||
              selectedType.id === "extended_video")
              ? `${window.location.origin}/video-call?appointmentId=${scheduleData?.id}&role='patient'`
              : selectedType && selectedType.id === "text"
              ? `${window.location.origin}/chat/patient?appointmentId=${scheduleData?.id}`
              : undefined;

          const doctorMeetingLink =
            selectedType &&
            (selectedType.id === "video" ||
              selectedType.id === "extended_video")
              ? `${window.location.origin}/video-call?appointmentId=${scheduleData?.id}&role='doctor'`
              : selectedType && selectedType.id === "text"
              ? `${window.location.origin}/chat/doctor?appointmentId=${scheduleData?.id}`
              : undefined;

          // Default duration if selectedType is not available
          const appointmentDuration = selectedType?.duration;
          const appointmentType = selectedType?.id;

          // Send to patient
          const patientResponse = await fetch("/api/send-calendar-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: patientEmail,
              patientName,
              doctorName: doctorName,
              date: scheduledDate,
              time: startTimeStr,
              duration: String(appointmentDuration),
              type: appointmentType as "video" | "extended_video" | "chat",
              meetingLink: patientMeetingLink,
              recipientType: "patient",
            }),
          });

          // Send to doctor
          const doctorResponse = await fetch("/api/send-calendar-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: doctorEmail,
              patientName,
              doctorName: doctorName,
              date: scheduledDate,
              time: startTimeStr,
              duration: String(appointmentDuration),
              type: appointmentType as "video" | "extended_video" | "chat",
              meetingLink: doctorMeetingLink,
              recipientType: "doctor",
            }),
          });

          if (!patientResponse.ok || !doctorResponse.ok) {
            const patientError = await patientResponse.json().catch((e) => ({
              status: patientResponse.status,
              statusText: patientResponse.statusText,
              error: e.message || "Failed to parse error response",
            }));

            const doctorError = await doctorResponse.json().catch((e) => ({
              status: doctorResponse.status,
              statusText: doctorResponse.statusText,
              error: e.message || "Failed to parse error response",
            }));

            console.error("Failed to send calendar invites:", {
              patientError: {
                status: patientResponse.status,
                statusText: patientResponse.statusText,
                ...patientError,
              },
              doctorError: {
                status: doctorResponse.status,
                statusText: doctorResponse.statusText,
                ...doctorError,
              },
              requestData: {
                patient: {
                  to: patientEmail,
                  patientName,
                  doctorName,
                  date: scheduledDate,
                  time: startTimeStr,
                  duration: selectedType.duration,
                  type: selectedType.id,
                  hasMeetingLink: !!patientMeetingLink,
                  recipientType: "patient",
                },
                doctor: {
                  to: doctorEmail,
                  patientName,
                  doctorName,
                  date: scheduledDate,
                  time: startTimeStr,
                  duration: selectedType.duration,
                  type: selectedType.id,
                  hasMeetingLink: !!doctorMeetingLink,
                  recipientType: "doctor",
                },
              },
            });
            // Don't fail the whole flow if email fails
          }
        } catch (emailError) {
          console.error("Error sending calendar invites:", emailError);
          // Don't fail the whole flow if email fails
        }

        console.log("Appointment created successfully:", scheduleData);

        toast({
          title: "Success!",
          description: "Your appointment has been booked successfully.",
        });

        router.push("/dashboard");
      } catch (error) {
        console.error("Error in room creation or schedule creation:", error);
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("Error in handleBooking:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-20 lg:pb-0">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#004DFF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-colors mb-4 cursor-pointer outline-none"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Schedule Appointment
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Book a secure, private consultation with your physician. Select the consultation type, date, and time below.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Doctor Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="relative shrink-0">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 shadow-lg border-4 border-white dark:border-slate-700">
                      <AvatarImage src={doctor.profile_image || "/placeholder.svg"} className="object-cover" />
                      <AvatarFallback className="text-2xl bg-slate-100 dark:bg-slate-800">
                        {`${formatName(doctor.first_name?.[0] || "")}${formatName(doctor.last_name?.[0] || "")}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {doctor.is_verified && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#004DFF] rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                        {doctorName}
                      </h2>
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full">
                        Verified
                      </span>
                    </div>
                    <p className="text-[#004DFF] font-semibold text-base mb-4">
                      {doctor.specialization || "General Practitioner"}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-300 mb-4">
                      {location && (
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full">
                          <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                          <span>{location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 shrink-0 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{doctor.rating || "5.0"}</span>
                        <span>({doctor.reviews_count || 0} reviews)</span>
                      </div>
                    </div>
                    <div className="space-y-4 max-w-2xl">
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        {doctor.bio || "No biography available."}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        {/* Education */}
                        <div>
                          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-200">
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">Education</span>
                          </div>
                          {doctor.education ? (
                            <ul className="space-y-1">
                              {(() => {
                                const edus = Array.isArray(doctor.education) ? doctor.education : [doctor.education];
                                const flattened = edus.flatMap(e => (typeof e === 'string' ? e.split(',') : [e])).map(e => String(e).trim()).filter(Boolean);
                                if (flattened.length === 0) return <li className="text-sm text-slate-500 italic">Not specified</li>;
                                return flattened.map((item, idx) => (
                                  <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="text-[#004DFF]">•</span>
                                    <span>{item}</span>
                                  </li>
                                ));
                              })()}
                            </ul>
                          ) : (
                            <span className="text-sm text-slate-500 italic">Not specified</span>
                          )}
                        </div>
                        
                        {/* Languages */}
                        <div>
                          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-200">
                            <MessageCircle className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">Languages</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{languages}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Consultation Type */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Select Consultation Type</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {consultationTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType?.id === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleConsultationTypeSelect(type)}
                        type="button"
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left outline-none flex flex-col ${
                          isSelected 
                            ? "border-[#004DFF] bg-[#004DFF]/5 shadow-[0_0_20px_rgba(0,77,255,0.15)] ring-2 ring-[#004DFF]/20" 
                            : "border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-slate-600 hover:shadow-md"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-[#004DFF] text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {isSelected && <CheckCircle className="w-5 h-5 text-[#004DFF]" />}
                        </div>
                        <h4 className={`font-bold ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>{type.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2 line-clamp-2 leading-relaxed">{type.description}</p>
                        <div className="mt-auto flex justify-between items-center w-full">
                          <span className="inline-flex px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {type.duration} mins
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            ${type.price} USDC
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Date & Time */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Date & Time</h3>
                
                <div className="mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {dates.map((date) => {
                      const isSelected = selectedDate === date.value;
                      return (
                        <button
                          key={date.value}
                          type="button"
                          onClick={() => { setSelectedDate(date.value); setSelectedTime(""); }}
                          disabled={!date.isOpen}
                          className={`p-3 outline-none flex flex-col items-center justify-center border-2 rounded-2xl transition-all duration-300 ${
                            isSelected
                              ? "border-[#004DFF] bg-[#004DFF]/5 text-[#004DFF] shadow-[0_0_15px_rgba(0,77,255,0.1)]"
                              : date.isOpen
                              ? "border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-slate-600 cursor-pointer"
                              : "border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <span className={`text-xs uppercase tracking-wider font-bold mb-1 ${
                            isSelected ? "text-[#004DFF]" : "text-slate-500 dark:text-slate-400"
                          }`}>
                            {date.label}
                          </span>
                          <span className={`font-extrabold ${isSelected ? "text-[#004DFF]" : "text-slate-900 dark:text-white"}`}>
                            {date.date.split(' ')[0]}
                          </span>
                          <span className={`text-xs font-medium ${isSelected ? "text-[#004DFF]/70" : "text-slate-500"}`}>
                            {date.date.split(' ')[1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="pt-2">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Available Slots</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                          {timeSlots.length === 0 ? (
                            <div className="col-span-full py-6 text-center text-slate-500 italic text-sm">No availability on this date</div>
                          ) : timeSlots.map((slot) => {
                            const isSelected = selectedTime === slot.time;
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                onClick={() => setSelectedTime(slot.time)}
                                className={`py-2.5 px-3 outline-none text-sm font-semibold text-center rounded-xl border-2 transition-all ${
                                  isSelected
                                    ? "border-[#004DFF] bg-[#004DFF] text-white shadow-lg shadow-[#004DFF]/30"
                                    : "border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                              >
                                {slot.time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Note */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <MessageCircle className="w-5 h-5 text-[#004DFF]" />
                  Add a Note <span className="text-slate-400 text-sm font-normal">(Optional)</span>
                </h3>
                <Textarea
                  placeholder="Describe your symptoms to help the doctor prepare..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[140px] resize-none outline-none focus:ring-2 focus:ring-[#004DFF]/20 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-base p-4 transition-all"
                />
              </div>
            </motion.div>

          </div>

          {/* Right Column (Summary) */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="sticky top-24">
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:border-slate-700/50 dark:shadow-none border border-slate-100 backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Calendar className="w-5 h-5 text-[#004DFF]" />
                  Booking Summary
                </h3>

                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-slate-500 dark:text-slate-400">Date</span>
                    <span className="font-bold text-right text-slate-900 dark:text-white">
                      {selectedDate ? `${dates.find((d) => d.value === selectedDate)?.label}, ${selectedDate}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-slate-500 dark:text-slate-400">Time</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedTime || "—"}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-slate-500 dark:text-slate-400">Type</span>
                    <span className="font-bold text-right text-slate-900 dark:text-white">
                      {selectedType ? `${selectedType.name} (${selectedType.duration}m)` : "—"}
                    </span>
                  </div>
                </div>

                <Separator className="my-6 dark:bg-slate-700/50 border-slate-100" />

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Consultation Fee</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{consultationFee.toFixed(2)} USDC</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-base font-bold text-slate-900 dark:text-white">Total</span>
                      <span className="text-2xl font-black text-[#004DFF]">{totalAmount.toFixed(2)} <span className="text-sm">USDC</span></span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Secure Escrow</span>
                  </div>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                    Funds stay locked until consultation complete.
                  </p>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || !selectedType || isProcessing}
                  className="w-full bg-[#004DFF] hover:bg-blue-700 text-white shadow-lg shadow-[#004DFF]/25 font-bold h-14 rounded-2xl text-base transition-all disabled:opacity-50 disabled:shadow-none outline-none"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                       <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Processing...
                    </div>
                  ) : (
                    "Confirm Appointment"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
