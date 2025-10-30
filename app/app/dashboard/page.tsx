"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  FileText,
  Video,
  Pill,
  Bell,
  Wallet,
  Plus,
  ChevronRight,
  LogOut,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { useUserProfile, getInitials } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabase";
import { formatName } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  avatar: string;
  appointment_date: string;
  status: string;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default function Dashboard() {
  const { userProfile, loading, error, isAuthenticated } = useUserProfile();
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>();
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(true);
  const { toast } = useToast();
  const router = useRouter();

  // Handle avatar image loading state
  useEffect(() => {
    if (userProfile?.profile_image) {
      // Ensure the URL is properly formatted
      const imageUrl = userProfile.profile_image.startsWith("http")
        ? userProfile.profile_image
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile_images/${userProfile.profile_image}`;

      const img = new window.Image();
      img.src = imageUrl;
      img.onload = () => setAvatarSrc(imageUrl);
      img.onerror = () => {
        console.error("Failed to load profile image:", imageUrl);
        setAvatarSrc(undefined);
      };
    } else {
      setAvatarSrc(undefined);
    }
  }, [userProfile?.profile_image]);

  // Fetch wallet balance when user profile is loaded
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!userProfile?.wallet_address) return;

      setIsLoadingBalance(true);
      try {
        // Connect to Solana devnet
        const connection = new Connection("https://api.devnet.solana.com");
        const walletAddress = new PublicKey(userProfile.wallet_address);

        // USDC mint address on devnet
        const USDC_MINT = new PublicKey(
          "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
        );

        // Get associated token account
        const tokenAccount = await getAssociatedTokenAddress(
          USDC_MINT,
          walletAddress
        );

        // Get token account balance
        const balance = await connection.getTokenAccountBalance(tokenAccount);

        // Convert balance to USDC (6 decimals)
        const usdcBalance = (parseInt(balance.value.amount) / 10 ** 6).toFixed(
          2
        );
        setWalletBalance(usdcBalance);
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        setWalletBalance("0.00");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchWalletBalance();
  }, [userProfile?.wallet_address]);

  // Fetch upcoming appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userProfile?.id) {
        console.log('No user profile ID available');
        return;
      }
      
      try {
        console.log('Fetching appointments for user ID:', userProfile.id);
        setIsLoadingAppointments(true);
        
        // Fetch schedules for the current user (patient)
        const { data: schedules, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .eq('patient_id', userProfile.id)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(5);

        if (schedulesError) {
          console.error('Error fetching schedules:', schedulesError);
          throw schedulesError;
        }
        
        console.log('Fetched schedules:', schedules);

        // Fetch doctor details for each schedule
        if (!schedules || schedules.length === 0) {
          console.log('No upcoming appointments found');
          setUpcomingAppointments([]);
          return;
        }

        const appointmentsWithDoctors = await Promise.all(
          schedules.map(async (schedule) => {
            console.log('Processing schedule:', schedule);
            const { data: doctor, error: doctorError } = await supabase
              .from('doctor_profiles')
              .select('*')
              .eq('id', schedule.doctor_id)
              .single();

            if (doctorError) {
              console.error('Error fetching doctor:', doctorError);
              throw doctorError;
            }

            // Combine date and time for display
            const appointmentDateTime = new Date(
              `${schedule.scheduled_date}T${schedule.start_time}`
            );
            
            const now = new Date();
            const timeDiff = appointmentDateTime.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            let displayDate = '';
            if (daysDiff === 0) displayDate = 'Today';
            else if (daysDiff === 1) displayDate = 'Tomorrow';
            else if (daysDiff < 7) displayDate = `In ${daysDiff} days`;
            else displayDate = appointmentDateTime.toLocaleDateString();

            // Format time (HH:MM AM/PM)
            const formattedTime = appointmentDateTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });

            return {
              id: schedule.id,
              doctor: `Dr. ${formatName(`${doctor.first_name} ${doctor.last_name}`)}`,
              specialty: doctor.specialization,
              date: displayDate,
              time: formattedTime,
              type: schedule.consultation_type,
              avatar: doctor.profile_image || '',
              appointment_date: schedule.scheduled_date,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              status: schedule.status
            };
          })
        );

        console.log('Processed appointments:', appointmentsWithDoctors);
        setUpcomingAppointments(appointmentsWithDoctors);
      } catch (error) {
        console.error('Error in fetchAppointments:', error);
        // Set empty array on error to clear any previous state
        setUpcomingAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [userProfile?.id, isAuthenticated]);

  // Handle redirect to sign-in if not authenticated and not loading
  useEffect(() => {
    // Only redirect if we're not loading and we're sure the user is not authenticated
    if (!loading) {
      if (isAuthenticated) {
        console.log("User is authenticated, showing dashboard");
      } else {
        console.log("User is not authenticated, will redirect to sign-in");
        const timer = setTimeout(() => {
          console.log("Executing redirect to sign-in");
          window.location.href = "/signin?redirectedFrom=dashboard";
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [loading, isAuthenticated, userProfile]);

  if (loading) {
    console.log('Dashboard: Rendering loading state');
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    console.error("Error loading user profile:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {userProfile ? "Profile Error" : "Authentication Error"}
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
          <p className="text-red-600 mb-4">
            {userProfile
              ? "There was an error loading your profile data."
              : "You need to be signed in to access the dashboard."}
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = "/signin")}
              variant="destructive"
            >
              {userProfile ? "Update Profile" : "Sign In"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const recentRecords = [
    {
      id: 1,
      title: "Blood Test Results",
      date: "2 days ago",
      doctor: "Dr. Adaora Okafor",
      type: "Lab Report",
    },
    {
      id: 2,
      title: "Consultation Notes",
      date: "1 week ago",
      doctor: "Dr. Emeka Nwosu",
      type: "Consultation",
    },
  ];

  const quickActions = [
    {
      icon: Calendar,
      label: "Book Appointment",
      href: "/doctors",
      color: "bg-blue-500",
    },
    {
      icon: MessageSquare,
      label: "AI Health Chat",
      href: "/ai-chat",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
    {
      icon: FileText,
      label: "View Records",
      href: "/records",
      color: "bg-purple-500",
    },
    {
      icon: Pill,
      label: "Order Medication",
      href: "/medication",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/telehealthlogo.svg"
              alt="teleHealthSol"
              width={150}
              height={40}
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {userProfile?.user_type
                ? `${
                    userProfile.user_type.charAt(0).toUpperCase() +
                    userProfile.user_type.slice(1)
                  } Dashboard`
                : "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
              <Wallet className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {isLoadingBalance ? (
                  <span className="inline-block h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></span>
                ) : (
                  `$${walletBalance} USDC`
                )}
              </span>
            </div>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={avatarSrc}
                      alt={userProfile?.first_name || "User"}
                    />
                    <AvatarFallback>
                      {userProfile?.first_name
                        ? getInitials(userProfile.first_name)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={avatarSrc}
                      alt={userProfile?.first_name || "User"}
                    />
                    <AvatarFallback>
                      {userProfile?.first_name
                        ? getInitials(formatName(userProfile.first_name))
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.first_name ? formatName(userProfile.first_name) : ''} {userProfile?.last_name ? formatName(userProfile.last_name) : ''}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email}
                    </p>
                  </div>
                </div>
                {/* Wallet Address */}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground mb-1">
                    Wallet Address
                  </p>
                  <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (userProfile?.wallet_address) {
                        try {
                          await navigator.clipboard.writeText(
                            userProfile.wallet_address
                          );
                          toast({
                            title: "Wallet address copied!",
                            description:
                              "Your wallet address has been copied to clipboard.",
                            duration: 3000,
                          });
                        } catch (err) {
                          console.error("Failed to copy wallet address:", err);
                          toast({
                            title: "Error",
                            description:
                              "Failed to copy wallet address. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                  >
                    <span className="text-sm font-mono truncate max-w-[180px]">
                      {userProfile?.wallet_address
                        ? `${userProfile.wallet_address.substring(
                            0,
                            6
                          )}...${userProfile.wallet_address.substring(
                            userProfile.wallet_address.length - 4
                          )}`
                        : "Not connected"}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 text-muted-foreground"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 w-full"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/signin";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back,{" "}
            {userProfile?.first_name
              ? formatName(userProfile?.first_name)
              : "User"}{" "}
            👋
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Here&apos;s what&apos;s happening with your health today.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}
                    >
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.label}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Upcoming Appointments
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  <Link href="/doctors">Book New</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAppointments ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No upcoming appointments
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/doctors">Book an appointment</Link>
                    </Button>
                  </div>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage
                            src={appointment.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {appointment.doctor
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {appointment.doctor}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {appointment.specialty}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {appointment.date} at {appointment.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {appointment.type
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </Badge>
                        <Button
                          size="sm"
                          variant={
                            appointment.type === "video"
                              ? "default"
                              : appointment.type === "extended_video"
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            if (appointment.type === "text") {
                              router.push(
                                `/chat/patient?appointmentId=${appointment.id}`
                              );
                            } else {
                              router.push(
                                `/video-call?appointmentId=${appointment.id}&role=patient`
                              );
                            }
                          }}
                        >
                          {appointment.type === "video" ? (
                            <Video className="w-4 h-4 mr-1" />
                          ) : appointment.type === "extended_video" ? (
                            <Video className="w-4 h-4 mr-1" />
                          ) : (
                            <MessageCircle className="w-4 h-4 mr-1" />
                          )}
                          Join{" "}
                          {appointment.type === "video"
                            ? "Video"
                            : appointment.type === "extended_video"
                            ? "Video"
                            : "Chat"}
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Health Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Recent Records */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Records
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {record.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {record.date} • {record.doctor}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
                <Link href="/records">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View All Records
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Health Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Health Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Last Checkup
                  </span>
                  <span className="text-sm font-medium">2 weeks ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Medications
                  </span>
                  <span className="text-sm font-medium">3 active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Consultations
                  </span>
                  <span className="text-sm font-medium">12 total</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
