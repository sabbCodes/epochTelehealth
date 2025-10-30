"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Video,
  MessageCircle,
  Star,
  Bell,
  Plus,
  AlertCircle,
  Wallet,
  LogOut,
} from "lucide-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctorProfile, getDoctorInitials } from "@/hooks/useDoctorProfile";
import { formatName, formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useW3s } from "@/providers/W3sProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Separator import removed as it's not used

interface Appointment {
  id: string;
  patient: string;
  time: string;
  date: string;
  endTime: string;
  type: string;
  condition?: string;
  avatar: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  duration: string;
  patientId: string;
  startTime: string;
  notes?: string;
  consultation_type?: string;
}

export default function DoctorDashboard() {
  const { doctorProfile, loading, error } = useDoctorProfile();
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");

  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(true);
  interface PatientDetails {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    gender: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    occupation: string | null;
    marital_status: string | null;
    tribe: string | null;
    medical_history: string | null;
    allergies: string | null;
    current_medications: string | null;
    profile_image: string | null;
  }

  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const web3Services = useW3s();

  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!doctorProfile?.wallet_address) return;

      setIsLoadingBalance(true);
      try {
        const connection = new Connection("https://api.devnet.solana.com");
        const walletAddress = new PublicKey(doctorProfile.wallet_address);

        const USDC_MINT = new PublicKey(
          "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
        );

        try {
          // Get associated token account
          const tokenAccount = await getAssociatedTokenAddress(
            USDC_MINT,
            walletAddress
          );

          // Get token account balance
          const balance = await connection.getTokenAccountBalance(tokenAccount);
          
          // Convert balance to USDC (6 decimals)
          const usdcBalance = (parseInt(balance.value.amount) / 10 ** 6).toFixed(2);
          setWalletBalance(usdcBalance);
        } catch (error: unknown) {
          // If token account doesn't exist, default to 0.00
          if (error instanceof Error && error.message.includes('could not find account')) {
            setWalletBalance("0.00");
          } else {
            throw error; // Re-throw other errors
          }
        }
      } catch (error: unknown) {
        console.error("Error fetching wallet balance:", error);
        // Don't show error to user, just default to 0.00
        setWalletBalance("0.00");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchWalletBalance();
  }, [doctorProfile?.wallet_address]);

  // Format USDC to 2 decimal places
  const formatUSDC = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const stats = [
    {
      title: "Upcoming Appointments",
      value: isLoadingAppointments ? "..." : upcomingAppointments.length.toString(),
      change: "View all appointments",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Total Patients",
      value: loading ? "..." : doctorProfile?.total_patients || "0",
      change: "+0 this week",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Monthly Earnings",
      value: loading
        ? "... USDC"
        : `${formatUSDC(doctorProfile?.monthly_earnings || 0)} USDC`,
      change: "+0% from last month",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Patient Rating",
      value: loading ? "..." : doctorProfile?.rating?.toFixed(1) || "N/A",
      change: `Based on ${doctorProfile?.total_reviews || 0} reviews`,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
  ];

  // Fetching upcoming appointments for the doctor
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!doctorProfile?.id) {
        console.log('No doctor profile ID available');
        return;
      }

      try {
        setIsLoadingAppointments(true);

        const { data: schedules, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .eq('doctor_id', doctorProfile.id)
          .order('scheduled_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(5);

        if (schedulesError) {
          console.error('Error fetching schedules:', schedulesError);
          throw schedulesError;
        }

        if (!schedules || schedules.length === 0) {
          console.log('No upcoming appointments found');
          setUpcomingAppointments([]);
          return;
        }

        const appointmentsWithPatients = await Promise.all(
          schedules.map(async (schedule) => {
            const { data: patient, error: patientError } = await supabase
              .from('patient_profiles')
              .select('*')
              .eq('id', schedule.patient_id)
              .single();

            if (patientError) {
              console.error('Error fetching patient:', patientError);
              throw patientError;
            }

            // Calculate duration in minutes
            const start = new Date(`1970-01-01T${schedule.start_time}Z`);
            const end = new Date(`1970-01-01T${schedule.end_time}Z`);
            const durationMs = end.getTime() - start.getTime();
            const durationMins = Math.round(durationMs / (1000 * 60));

            return {
              id: schedule.id,
              patient: `${formatName(patient.first_name)} ${formatName(patient.last_name)}`,
              time: new Date(`${schedule.scheduled_date}T${schedule.start_time}`).toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              date: schedule.scheduled_date,
              type: schedule.consultation_type,
              notes: schedule.notes || 'No notes available',
              avatar: patient.profile_image,
              status: schedule.status,
              duration: `${durationMins} min`,
              patientId: patient.id,
              startTime: schedule.start_time,
              endTime: schedule.end_time
            };
          })
        );

        setUpcomingAppointments(appointmentsWithPatients);
      } catch (error: unknown) {
        console.error('Error in fetchAppointments:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch appointments. Please try again.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [doctorProfile?.id, toast]);

  const recentPatients = [
    {
      id: 1,
      name: "Emma Wilson",
      lastVisit: "2 days ago",
      condition: "Hypertension",
      status: "Stable",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 2,
      name: "David Brown",
      lastVisit: "1 week ago",
      condition: "Diabetes Type 2",
      status: "Monitoring",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ];

  const pendingTasks = [
    {
      id: 1,
      task: "Review lab results for John Doe",
      priority: "high",
      dueTime: "30 min",
    },
    {
      id: 2,
      task: "Complete medical report for Sarah Johnson",
      priority: "medium",
      dueTime: "2 hours",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || 'An error occurred while loading your dashboard. Please try again later.'}
          </p>
          <Button onClick={() => router.push('/signin')} variant="default">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/telehealthlogo.svg"
              alt="teleHealthSol"
              width={150}
              height={40}
              className="h-8 w-auto"
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Doctor Dashboard
              </h1>
              <div className="flex items-center space-x-2">
                {loading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Good {getTimeOfDayGreeting()}, Dr.{" "}
                    {formatName(doctorProfile?.last_name || "")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </div>
            <div
              className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={async () => {
                if (doctorProfile?.wallet_address) {
                  try {
                    await navigator.clipboard.writeText(
                      doctorProfile.wallet_address
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
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">
                {isLoadingBalance ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  `${walletBalance} USDC`
                )}
              </span>
            </div>
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0"
                >
                  {loading ? (
                    <Skeleton className="h-10 w-10 rounded-full" />
                  ) : (
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={doctorProfile?.profile_image || ""}
                        alt={doctorProfile?.full_name || "Doctor"}
                      />
                      <AvatarFallback>
                        {getDoctorInitials(doctorProfile?.full_name || "D")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={doctorProfile?.profile_image || ""}
                      alt={doctorProfile?.full_name || "Doctor"}
                    />
                    <AvatarFallback>
                      {getDoctorInitials(doctorProfile?.full_name || "D")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Dr. {formatName(doctorProfile?.full_name || " ")}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {doctorProfile?.email || ""}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem
                  className="w-full cursor-pointer"
                  onClick={async () => {
                    if (doctorProfile?.wallet_address) {
                      try {
                        await navigator.clipboard.writeText(
                          doctorProfile.wallet_address
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
                  <div className="flex flex-col w-full">
                    <div className="flex items-center">
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Wallet Address</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {doctorProfile?.wallet_address
                        ? `${doctorProfile.wallet_address.substring(
                            0,
                            6
                          )}...${doctorProfile.wallet_address.substring(
                            doctorProfile.wallet_address.length - 4
                          )}`
                        : "Not connected"}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="w-full cursor-pointer"
                  onClick={() => {
                    setWithdrawAmount("");
                    setWithdrawAddress("");
                    setWithdrawOpen(true);
                  }}
                >
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Withdraw USDC</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="w-full cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut();
                      window.location.href = "/signin";
                    } catch (error) {
                      console.error("Error signing out:", error);
                    }
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

      {/* Withdraw USDC Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw USDC</DialogTitle>
            <DialogDescription>
              Send USDC from your Circle wallet to another Solana address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (USDC)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Available: {walletBalance} USDC</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destination Address</label>
              <Input
                type="text"
                placeholder="Recipient Solana address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={withdrawing}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!doctorProfile?.email) {
                    toast({ title: 'Missing email', description: 'Your account email is required to withdraw.', variant: 'destructive' });
                    return;
                  }
                  const amt = parseFloat(withdrawAmount);
                  if (!amt || amt <= 0) {
                    toast({ title: 'Invalid amount', description: 'Enter a valid USDC amount.' , variant: 'destructive'});
                    return;
                  }
                  if (!withdrawAddress || withdrawAddress.length < 32) {
                    toast({ title: 'Invalid address', description: 'Enter a valid Solana address.', variant: 'destructive' });
                    return;
                  }
                  setWithdrawing(true);
                  try {
                    // Initiate transfer from doctor (user-controlled)
                    const res = await fetch('/api/payments/ucw-transfer', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        amount: String(amt),
                        destinationAddress: withdrawAddress,
                        email: doctorProfile.email,
                        feeLevel: 'MEDIUM',
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data?.error || 'Failed to initiate withdrawal');
                    }
                    const { challengeId, userToken, encryptionKey } = data as { challengeId: string; userToken: string; encryptionKey?: string };
                    if (!challengeId || !userToken) {
                      throw new Error('Invalid withdrawal session');
                    }
                    toast({ title: 'Authorize Withdrawal', description: 'Confirm in the next prompt.' });
                    web3Services.setAuthentication({ userToken, encryptionKey });
                    await new Promise<void>((resolve, reject) => {
                      web3Services.execute(challengeId, (error) => {
                        if (error) {
                          const code = (error as any)?.code;
                          const msg = (typeof error === 'object' && error && 'message' in (error as any)) ? (error as any).message as string : String(error);
                          if (code === 155706) {
                            return; // wait for final callback
                          }
                          reject(new Error(msg || 'Authorization failed'));
                          return;
                        }
                        resolve();
                      });
                    });
                    toast({ title: 'Withdrawal initiated', description: 'Funds are on the way.' });
                    setWithdrawOpen(false);
                  } catch (err) {
                    console.error('Withdraw error:', err);
                    toast({ title: 'Withdrawal failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
                  } finally {
                    setWithdrawing(false);
                  }
                }}
                disabled={withdrawing}
              >
                {withdrawing ? 'Processing...' : 'Withdraw'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <Link href="/doctor-dashboard/appointments">
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              View Schedule
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages
            </Button>
          </Link>
          <Link href="/doctor-dashboard/patients">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Patient Records
            </Button>
          </Link>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Availability
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {stat.title}
                      </p>
                      {loading ? (
                        <Skeleton className="h-8 w-24 mt-1" />
                      ) : (
                        <h3 className="text-2xl font-bold mt-1">
                          {stat.value}
                        </h3>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <div className="flex items-center space-x-2">
                              <Skeleton className="h-3 w-3" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={appointment.avatar} />
                            <AvatarFallback>
                              {appointment.patient
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              <button
                                onClick={async () => {
                                  try {
                                    const { data: patient, error } =
                                      await supabase
                                        .from("patient_profiles")
                                        .select("*")
                                        .eq("id", appointment.patientId)
                                        .single();

                                    if (error) throw error;
                                    setSelectedPatient(patient);
                                  } catch (error) {
                                    console.error(
                                      "Error fetching patient details:",
                                      error
                                    );
                                    toast({
                                      title: "Error",
                                      description:
                                        "Failed to load patient details. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="hover:underline text-left font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {appointment.patient}
                              </button>
                            </div>
                            {appointment.notes && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                {appointment.notes}
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {appointment.time} • {appointment.duration} •{" "}
                              {new Date(appointment.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0">
                            <Badge
                              variant={
                                appointment.type === "video"
                                  ? "default"
                                  : appointment.type === "text"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {appointment.type
                                .split("_")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant={
                              appointment.type === "text"
                                ? "outline"
                                : "default"
                            }
                            onClick={() => {
                              if (appointment.type === 'text') {
                                router.push(`/chat/doctor?appointmentId=${appointment.id}`);
                              } else {
                                router.push(`/video-call?appointmentId=${appointment.id}&role=doctor`);
                              }
                            }}
                          >
                            {appointment.type === "video" ? (
                              <>
                                <Video className="w-4 h-4 mr-1" />
                                Join Call
                              </>
                            ) : appointment.type === "extended_video" ? (
                              <>
                                <Video className="w-4 h-4 mr-1" />
                                Join Call
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Start Chat
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No appointments scheduled for today
                    </p>
                    <Button className="mt-4" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Availability
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                  Pending Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border-l-4 ${getPriorityColor(
                      task.priority
                    )} bg-gray-50 dark:bg-gray-800 rounded-r`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.task}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Due in {task.dueTime}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Recent Patients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback>
                          {patient.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {patient.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {patient.condition}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {patient.lastVisit}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  View All Patients
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      <Dialog
        open={!!selectedPatient}
        onOpenChange={(open) => !open && setSelectedPatient(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <>
              <DialogHeader className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-4">
                  <Avatar className="w-full h-full">
                    <AvatarImage
                      src={selectedPatient.profile_image || ""}
                      alt={`${formatName(
                        selectedPatient.first_name
                      )} ${formatName(selectedPatient.last_name)}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl">
                      {selectedPatient.first_name?.[0]}
                      {selectedPatient.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <DialogTitle className="text-2xl">
                  {formatName(selectedPatient.first_name)}{" "}
                  {formatName(selectedPatient.last_name)}
                </DialogTitle>
                <DialogDescription>
                  {selectedPatient.gender
                    ? `${formatName(selectedPatient.gender)} • `
                    : ""}
                  {selectedPatient.date_of_birth &&
                    `${calculateAge(selectedPatient.date_of_birth)} years old`}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-6 mt-6">
                {/* Medical Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3 text-gray-900 dark:text-white">
                      Demographics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <InfoRow
                        label="Date of Birth"
                        value={
                          selectedPatient.date_of_birth
                            ? `${formatDate(
                                selectedPatient.date_of_birth
                              )} (${calculateAge(
                                selectedPatient.date_of_birth
                              )} years)`
                            : "Not provided"
                        }
                      />
                      <InfoRow
                        label="Gender"
                        value={selectedPatient.gender || "Not provided"}
                      />
                      <InfoRow
                        label="Marital Status"
                        value={selectedPatient.marital_status || "Not provided"}
                      />
                      <InfoRow
                        label="Tribe"
                        value={selectedPatient.tribe || "Not provided"}
                      />
                      <InfoRow
                        label="Occupation"
                        value={selectedPatient.occupation || "Not provided"}
                      />
                      <InfoRow
                        label="Location"
                        value={
                          [selectedPatient.city, selectedPatient.country]
                            .filter(Boolean)
                            .join(", ") || "Not provided"
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 text-gray-900 dark:text-white">
                      Medical Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Medical History
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedPatient.medical_history ||
                              "No medical history provided"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Allergies
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedPatient.allergies || "No known allergies"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Medications
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedPatient.current_medications ||
                              "No current medications"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for consistent info row styling
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-32 text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
