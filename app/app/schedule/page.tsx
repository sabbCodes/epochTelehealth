/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatName } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { DoctorProfile, fetchDoctorById } from "@/lib/doctors"
import { createSchedule } from "@/lib/schedules"
import { useW3s } from "@/providers/W3sProvider"

function DoctorProfileSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="flex items-start space-x-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-5 w-36" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-12 w-full" />

                <div className="pt-2">
                  <div className="flex items-center mb-2">
                    <Skeleton className="w-4 h-4 mr-2" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="ml-6 space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-start">
                        <Skeleton className="w-2 h-2 mt-1.5 mr-2" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center">
                    <Skeleton className="w-4 h-4 mr-2" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-6" />

            <Skeleton className="h-5 w-32 mb-3" />
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>

            <Skeleton className="h-5 w-32 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <Skeleton className="h-6 w-6 mr-2" />
              <Skeleton className="h-6 w-32" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>

              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>

              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between font-bold">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>

                <Skeleton className="h-3 w-full mt-1" />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-4">
                <div className="flex items-center mb-1">
                  <Skeleton className="w-4 h-4 mr-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>

              <Skeleton className="h-10 w-full mt-4 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const doctorId = searchParams?.get("doctorId")
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [symptoms, setSymptoms] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // State for consultation type
  const [selectedType, setSelectedType] = useState<{
    id: string;
    name: string;
    description: string;
    duration: number;
    icon: React.ComponentType<{ className?: string }>;
  } | null>(null)

  // Circle Web SDK for authorizing user-controlled challenges
  const web3Services = useW3s();

  useEffect(() => {
    const loadDoctor = async () => {
      if (!doctorId) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        const doctorData = await fetchDoctorById(doctorId)
        setDoctor(doctorData)
      } catch (error) {
        console.error('Failed to load doctor:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDoctor()
  }, [doctorId])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
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
          <p className="text-muted-foreground mt-2">Please select a doctor to schedule an appointment</p>
          <Button className="mt-4" onClick={() => router.push('/doctors')}>
            Browse Doctors
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <DoctorProfileSkeleton />
  }

  if (!doctor) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Doctor not found</h2>
          <p className="text-muted-foreground mt-2">The requested doctor could not be found.</p>
          <Button className="mt-4" onClick={() => router.push('/doctors')}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  // Format doctor's data
  const doctorName = `Dr. ${formatName(doctor.first_name)} ${formatName(doctor.last_name)}`
  const consultationFee = doctor.consultation_fee || 0;
  const platformFee = consultationFee * 0.10;
  const totalAmount = consultationFee;
  const location = [doctor.city, doctor.country].filter(Boolean).join(', ')
  const experience = doctor.years_of_experience ? `${doctor.years_of_experience} years` : 'Experienced'
  const languages = doctor.languages?.join(', ') || 'English'
  
  // Consultation types with proper TypeScript types
  const consultationTypes: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    duration: number;
  }> = [
    {
      id: 'video',
      name: 'Video Call',
      description: 'Face-to-face video consultation',
      icon: Video,
      duration: 30,
    },
    {
      id: 'extended_video',
      name: 'Extended Video Call',
      description: 'Longer video consultation',
      icon: Video,
      duration: 45,
    },
    {
      id: 'text',
      name: 'Text Chat',
      description: 'Secure messaging consultation',
      icon: MessageCircle,
      duration: 30,
    },
  ]

  const handleConsultationTypeSelect = (type: {
    id: string;
    name: string;
    description: string;
    duration: number;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    setSelectedType(type)
  }

  // Generate dates for the next 7 days
  const generateDates = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const dateString = `${day} ${month}`;
      
      return {
        value: dateString,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName,
        date: dateString,
        dateObj: new Date(date)
      };
    });
  };

  const dates = generateDates();
  
  // Generate time slots from 8:00 AM to 6:00 PM with 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push({
        time: `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        value: `${hour.toString().padStart(2, '0')}:00`
      });
      
      // Add :30 slot (e.g., 8:30, 9:30, etc.)
      if (hour < 17) { // Don't add 5:30 PM if end time is 6:00 PM
        slots.push({
          time: `${hour % 12 || 12}:30 ${hour >= 12 ? 'PM' : 'AM'}`,
          value: `${hour.toString().padStart(2, '0')}:30`
        });
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();

  const handleBooking = async () => {
    if (!user) {
      router.push('/login');
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
        throw new Error('Please select both date and time');
      }

      console.log('Raw selected date:', selectedDate, 'time:', selectedTime);

      // Get patient profile with user data
      const { data: patientData, error: patientProfileError } = await supabase
        .from('patient_profiles')
        .select(`
          id,
          user_profile_id,
          first_name,
          last_name,
          user_profiles!inner (email)
        `)
        .eq('user_profile_id', user.id)
        .single();

      if (patientProfileError || !patientData) {
        console.error('Patient profile error:', patientProfileError);
        throw new Error('Please complete your patient profile before booking');
      }

      const patientProfile = {
        id: patientData.id,
        user_profile_id: patientData.user_profile_id,
        first_name: patientData.first_name,
        last_name: patientData.last_name,
        email: patientData.user_profiles?.email
      };

      console.log('Patient profile found:', patientProfile);

      // 3. Parse the selected date (format: '5 Sep')
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Parse the date string (e.g., '5 Sep')
      const [day, monthName] = selectedDate.split(' ');
      const monthMap: {[key: string]: number} = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const month = monthMap[monthName];
      const dayNum = parseInt(day, 10);
      
      // Parse the time string (e.g., '1:30 PM')
      const [time, period] = selectedTime.split(' ');
      // eslint-disable-next-line prefer-const
      let [hours, minutes] = time.split(':').map(Number);
      
      // Convert to 24-hour format
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      // Create the date object
      const startTime = new Date(currentYear, month, dayNum, hours, minutes);
      
      // Validate the date
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid date or time selected');
      }
      
      // Ensure the date is in the future
      if (startTime <= now) {
        // If the date is in the past, try next year
        startTime.setFullYear(currentYear + 1);
        
        // If it's still in the past, throw an error
        if (startTime <= now) {
          throw new Error('Please select a future date and time');
        }
      }
      
      console.log('Parsed date:', startTime.toString());
      
      // Format for Supabase (YYYY-MM-DD and HH:MM:SS)
      const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');
      const scheduledDate = `${startTime.getFullYear()}-${formatTwoDigits(startTime.getMonth() + 1)}-${formatTwoDigits(startTime.getDate())}`;
      const startTimeStr = `${formatTwoDigits(startTime.getHours())}:${formatTwoDigits(startTime.getMinutes())}:00`;
      
      // Calculate end time
      const endTime = new Date(startTime.getTime() + (selectedType?.duration || 30) * 60000);
      const endTimeStr = `${formatTwoDigits(endTime.getHours())}:${formatTwoDigits(endTime.getMinutes())}:00`;
      
      console.log('Booking details:', {
        doctor_id: doctor?.id,
        patient_id: patientProfile.user_profile_id,
        scheduled_date: scheduledDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        consultation_type: selectedType.id,
        notes: symptoms || null,
      });

      // Check for existing schedule first
      const { data: existingSchedule, error: checkError } = await supabase
        .from('schedules')
        .select('id')
        .eq('doctor_id', doctor?.id)
        .eq('scheduled_date', scheduledDate)
        .eq('start_time', startTimeStr)
        .single();

      if (existingSchedule) {
        throw new Error('This time slot is already booked. Please select a different time.');
      }

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
        console.error('Error checking schedule:', checkError);
        throw new Error('Error checking availability. Please try again.');
      }

      // Perform payment (patient -> doctor) using Circle user-controlled transfer
      const doctorWallet: string | undefined = doctor.wallet_address || undefined;
      if (!doctorWallet) {
        throw new Error('Doctor payment address is not configured.');
      }
      if (!user?.email) {
        throw new Error('Your account does not have an email set. Please re-login.');
      }

      // Initiate transfer via our API to get challengeId
      const transferRes = await fetch('/api/payments/ucw-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: String(totalAmount),
          destinationAddress: doctorWallet,
          email: user.email,
          feeLevel: 'MEDIUM',
        }),
      });
      const transferData = await transferRes.json();
      if (!transferRes.ok) {
        throw new Error(transferData?.error || 'Failed to initiate payment');
      }

      const { challengeId, userToken: circleUserToken, encryptionKey } = transferData as { challengeId: string; userToken: string; encryptionKey?: string };
      if (!challengeId || !circleUserToken) {
        throw new Error('Invalid payment session.');
      }

      // Authorize the challenge with Circle Web SDK (PIN/biometric)
      toast({ title: 'Authorize Payment', description: 'Confirm the payment in the next prompt.' });
      web3Services.setAuthentication({ userToken: circleUserToken, encryptionKey });
      await new Promise<void>((resolve, reject) => {
        web3Services.execute(
          challengeId,
          (error) => {
            if (error) {
              // Handle known benign hiccup: 155706 or generic network error while UI still succeeds
              const code = (error as any)?.code;
              const msg = (typeof error === 'object' && error && 'message' in (error as any))
                ? (error as any).message as string
                : String(error);
              // If it's the known transient 155706, keep waiting for the user to complete the UI
              if (code === 155706) {
                // do not resolve or reject; the SDK will invoke callback again when user finishes
                return;
              }
              // Any other error is fatal here to avoid proceeding before auth completes
              reject(new Error(msg || 'Payment authorization failed'));
              return;
            }
            resolve();
          }
        );
      });

      // If we reach here, payment was authorized. Proceed to create the schedule
      const { data: scheduleData, error: scheduleError } = await createSchedule({
        doctor_id: doctor?.id || '',
        patient_id: patientProfile.id,
        scheduled_date: scheduledDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        consultation_type: selectedType.id,
        notes: symptoms || null,
      });

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError);
        
        // Handle specific error cases
        if ((scheduleError as any).code === '23505') { // Unique violation
          throw new Error('This time slot is no longer available. Please select a different time.');
        } else if ((scheduleError as any).code === '42501') { // Insufficient privileges
          throw new Error('You do not have permission to book this appointment.');
        } else {
          throw scheduleError;
        }
      }

      // Debug: Log doctor profile data
      console.log('Doctor profile data:', {
        id: doctor.id,
        user_profile_id: doctor.user_profile_id,
        first_name: doctor.first_name,
        last_name: doctor.last_name
      });

      // Get doctor's email from user_profiles
      if (!doctor.user_profile_id) {
        console.error('Doctor profile is missing user profile ID');
        throw new Error('Could not find doctor contact information');
      }

      // Use the database function to get doctor's email (bypasses RLS)
      console.log('Looking up doctor email with function for ID:', doctor.user_profile_id);
      
      const { data: doctorEmail, error: emailError } = await supabase
        .rpc('get_doctor_email', { doctor_user_id: doctor.user_profile_id })
        .single();

      console.log('Doctor email lookup result:', { doctorEmail, error: emailError });

      if (emailError || !doctorEmail) {
        console.error('Failed to fetch doctor email:', emailError);
        throw new Error('Could not retrieve doctor contact information');
      }
      
      console.log('Found doctor email via function:', doctorEmail);

      // Get patient's email from user_profiles if not already in patientProfile
      const patientEmail = patientProfile.email || user.email;
      if (!patientEmail) {
        throw new Error('Patient email not found');
      }

      // Send calendar invite to both patient and doctor
      try {
        const patientName = [patientProfile.first_name, patientProfile.last_name]
          .filter(Boolean)
          .join(' ') || 'Patient';
          
const doctorName = [doctor.first_name, doctor.last_name]
          .filter(Boolean)
          .join(' ') || 'Your Doctor';
        // Add null checks for selectedType and its properties
        const meetingLink = selectedType && (selectedType.id === 'video' || selectedType.id === 'extended_video')
          ? `${window.location.origin}/video-call?appointmentId=${scheduleData?.id || 'new'}`
          : undefined;

        // Default duration if selectedType is not available
        const appointmentDuration = selectedType?.duration || '30 minutes';
        const appointmentType = selectedType?.id || 'video';

        // Send to patient
        const patientResponse = await fetch('/api/send-calendar-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: patientEmail,
            patientName,
            doctorName: doctorName,
            date: scheduledDate,
            time: startTimeStr,
            duration: appointmentDuration,
            type: appointmentType as 'video' | 'extended_video' | 'chat',
            meetingLink,
            recipientType: 'patient',
          }),
        });

        // Send to doctor
        const doctorResponse = await fetch('/api/send-calendar-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: doctorEmail,
            patientName,
            doctorName: doctorName,
            date: scheduledDate,
            time: startTimeStr,
            duration: appointmentDuration,
            type: appointmentType as 'video' | 'extended_video' | 'chat',
            meetingLink,
            recipientType: 'doctor',
          }),
        });

        if (!patientResponse.ok || !doctorResponse.ok) {
          const patientError = await patientResponse.json().catch((e) => ({
            status: patientResponse.status,
            statusText: patientResponse.statusText,
            error: e.message || 'Failed to parse error response'
          }));
          
          const doctorError = await doctorResponse.json().catch((e) => ({
            status: doctorResponse.status,
            statusText: doctorResponse.statusText,
            error: e.message || 'Failed to parse error response'
          }));
          
          console.error('Failed to send calendar invites:', { 
            patientError: {
              status: patientResponse.status,
              statusText: patientResponse.statusText,
              ...patientError
            },
            doctorError: {
              status: doctorResponse.status,
              statusText: doctorResponse.statusText,
              ...doctorError
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
                hasMeetingLink: !!meetingLink,
                recipientType: 'patient'
              },
              doctor: {
                to: doctorEmail,
                patientName,
                doctorName,
                date: scheduledDate,
                time: startTimeStr,
                duration: selectedType.duration,
                type: selectedType.id,
                hasMeetingLink: !!meetingLink,
                recipientType: 'doctor'
              }
            }
          });
          // Don't fail the whole flow if email fails
        }
      } catch (emailError) {
        console.error('Error sending calendar invites:', emailError);
        // Don't fail the whole flow if email fails
      }

      console.log('Appointment created successfully:', scheduleData);

      toast({
        title: 'Success!',
        description: 'Your appointment has been booked successfully.',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error in handleBooking:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to book appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link href="/doctors">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Schedule Appointment</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Doctor Information */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Doctor Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20">
                        <AvatarImage
                          src={doctor.profile_image || "/placeholder.svg"}
                          alt={`${formatName(doctor.first_name)} ${formatName(doctor.last_name)}`}
                        />
                        <AvatarFallback>
                          {`${formatName(doctor.first_name?.[0] || "")}${
                            formatName(doctor.last_name?.[0] || "")
                          }`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {doctor.is_verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {doctorName}
                        </h2>
                        <Badge className="bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      </div>

                      <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                        {doctor.specialization || "General Practitioner"}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span>{location}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current flex-shrink-0" />
                          <span>
                            {doctor.rating || "N/A"}
                            {doctor.reviews_count
                              ? `(${doctor.reviews_count} reviews)`
                              : ""}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                          <span>{experience} experience</span>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {doctor.bio}
                      </p>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center mb-1">
                            <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Education & Certifications
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                            {doctor.education ? (
                              <ul className="space-y-2">
                                {(() => {
                                  const educationItems = Array.isArray(
                                    doctor.education
                                  )
                                    ? doctor.education.flatMap((edu: string) => 
                                        edu.split(",")
                                          .map((item: string) => item.trim())
                                          .filter(Boolean)
                                      )
                                    : typeof doctor.education === "string"
                                    ? doctor.education
                                        .split(",")
                                        .map((item: string) => item.trim())
                                        .filter(Boolean)
                                    : [];

                                  return educationItems.length > 0 ? (
                                    educationItems.map(
                                      (item: string, index: number) => (
                                        <li
                                          key={index}
                                          className="flex items-start"
                                        >
                                          <span className="mr-2">•</span>
                                          <span>{item}</span>
                                        </li>
                                      )
                                    )
                                  ) : (
                                    <p className="text-muted-foreground italic">
                                      No education information available
                                    </p>
                                  );
                                })()}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground italic">
                                No education information available
                              </p>
                            )}
                          </div>
                        </div>
                        {languages && (
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Speaks:
                              </span>{" "}
                              {languages}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Consultation Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Consultation Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {consultationTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div
                          key={type.id}
                          onClick={() => handleConsultationTypeSelect(type)}
                          className={`p-4 outline-none border-2 rounded-lg cursor-pointer transition-all ${
                            selectedType?.id === type.id
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedType?.id === type.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {type.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            {type.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {type.duration} minutes
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Date & Time Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Select Date & Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Preferred Date
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {dates.map((date) => (
                        <button
                          key={date.value}
                          onClick={() => {
                            setSelectedDate(date.value);
                            setSelectedTime(""); // Reset time when date changes
                          }}
                          className={`p-3 outline-none text-center border-2 rounded-lg transition-all ${
                            selectedDate === date.value
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {date.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {date.date}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Available Times
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 max-h-60 overflow-y-auto p-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setSelectedTime(slot.time)}
                            className={`p-2 outline-none text-sm text-center rounded border ${
                              selectedTime === slot.time
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300"
                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Symptoms/Reason */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Note (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Please describe your symptoms or reason for consultation..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="min-h-[100px] outline-none"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This helps the doctor prepare for your consultation and
                    provide better care.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Doctor:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {doctorName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Specialty:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {doctor.specialization}
                      </span>
                    </div>
                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Date:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {dates.find((d) => d.value === selectedDate)?.label} (
                          {dates.find((d) => d.value === selectedDate)?.date})
                        </span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Time:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedTime}
                        </span>
                      </div>
                    )}
                    {selectedType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Type:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedType.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Consultation Fee:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {consultationFee.toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Platform Fee (10%):
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {platformFee.toFixed(2)} USDC
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>You Pay</span>
                      <span>{totalAmount.toFixed(2)} USDC</span>
                    </div>
                    <div className="text-center text-sm text-gray-500">
                      Doctor receives:{" "}
                      {(consultationFee - platformFee).toFixed(2)} USDC
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Secure Payment
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Payment is held in escrow and released to the doctor only
                      after consultation completion.
                    </p>
                  </div>

                  <Button
                    onClick={handleBooking}
                    disabled={
                      !selectedDate ||
                      !selectedTime ||
                      !selectedType ||
                      isProcessing
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 outline-none"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Schedule Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
