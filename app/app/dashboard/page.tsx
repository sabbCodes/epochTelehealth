"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  Pill,
  Wallet,
  Plus,
  LogOut,
  MessageCircle,
  MessageSquare,
  LayoutDashboard,
  Settings,
  X,
  Menu,
  Activity,
  Search,
  Shield,
  Heart,
  Stethoscope,
  XCircle,
  FileText,
} from "lucide-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import Image from "next/image";
import { useUserProfile, getInitials } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabase";
import { formatName } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { NotificationDropdown } from "@/components/NotificationDropdown";

// ---- Types ----

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

// ---- Sidebar Item ----

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  href,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const cls = `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
    active
      ? "bg-[#004DFF] text-white shadow-none"
      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
  }`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

// ---- Appointment Row ----

function AppointmentRow({
  appointment,
  router,
  onCancel,
}: {
  appointment: Appointment;
  router: ReturnType<typeof useRouter>;
  onCancel: (id: string) => void;
}) {
  const statusColor: Record<string, string> = {
    confirmed: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    pending: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    cancelled: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
    completed: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  };

  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors rounded-xl gap-3"
    >
      <div className="flex items-center space-x-4">
        <Avatar className="h-11 w-11 border-2 border-white dark:border-slate-700 shadow-sm">
          <AvatarImage src={appointment.avatar || ""} />
          <AvatarFallback className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-sm">
            {appointment.doctor.split(" ")[1]?.[0] || "D"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            {appointment.doctor}
          </h4>
          <p className="text-xs font-medium text-[#004DFF] dark:text-blue-400 mb-0.5">
            {appointment.specialty}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {appointment.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {appointment.time}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Badge
          variant="secondary"
          className={`text-[10px] font-bold uppercase px-2.5 py-1 ${statusColor[appointment.status] || statusColor.pending}`}
        >
          {appointment.status}
        </Badge>
        {(appointment.status === "confirmed" || appointment.status === "pending") && (
          <button
            onClick={() => {
              if (appointment.type === "text") {
                router.push(`/chat/patient?appointmentId=${appointment.id}`);
              } else {
                router.push(`/video-call?appointmentId=${appointment.id}&role=patient`);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              appointment.type === "video" || appointment.type === "extended_video"
                ? "bg-[#004DFF] text-white hover:bg-blue-700"
                : "border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {appointment.type === "video" || appointment.type === "extended_video" ? (
              <><Video size={13} /> Join</>
            ) : (
              <><MessageCircle size={13} /> Chat</>
            )}
          </button>
        )}
        {appointment.status !== "cancelled" && appointment.status !== "completed" && (
          <button
            onClick={() => onCancel(appointment.id)}
            title="Cancel appointment"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
          >
            <XCircle size={13} /> Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ---- Main Dashboard ----

export default function Dashboard() {
  const { userProfile, loading, error, isAuthenticated } = useUserProfile();
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>();
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [chartData, setChartData] = useState<{ day: string; consultations: number }[]>([]);
  const [totalConsultations, setTotalConsultations] = useState<number | null>(null);
  const [activeMedications, setActiveMedications] = useState<number | null>(null);
  const [hasSessionHistory, setHasSessionHistory] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle avatar image loading state
  useEffect(() => {
    if (userProfile?.profile_image) {
      const imageUrl = userProfile.profile_image.startsWith("http")
        ? userProfile.profile_image
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile_images/${userProfile.profile_image}`;

      const img = new window.Image();
      img.src = imageUrl;
      img.onload = () => setAvatarSrc(imageUrl);
      img.onerror = () => setAvatarSrc(undefined);
    } else {
      setAvatarSrc(undefined);
    }
  }, [userProfile?.profile_image]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!userProfile?.wallet_address) return;
      setIsLoadingBalance(true);
      try {
        const connection = new Connection("https://api.devnet.solana.com");
        const walletAddress = new PublicKey(userProfile.wallet_address);
        const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
        try {
          const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, walletAddress);
          const balance = await connection.getTokenAccountBalance(tokenAccount);
          setWalletBalance((parseInt(balance.value.amount) / 10 ** 6).toFixed(2));
        } catch {
          setWalletBalance("0.00");
        }
      } catch {
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
      if (!userProfile?.id) return;
      try {
        setIsLoadingAppointments(true);
        const { data: schedules, error: schedulesError } = await supabase
          .from("schedules")
          .select("*")
          .eq("patient_id", userProfile.id)
          .gte("scheduled_date", new Date().toISOString().split("T")[0])
          .in("status", ["scheduled", "pending", "confirmed"])
          .order("scheduled_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(5);

        if (schedulesError) throw schedulesError;
        if (!schedules || schedules.length === 0) {
          setUpcomingAppointments([]);
          return;
        }

        const appointmentsWithDoctors = await Promise.all(
          schedules.map(async (schedule) => {
            const { data: doctor, error: doctorError } = await supabase
              .from("doctor_profiles")
              .select("*")
              .eq("id", schedule.doctor_id)
              .single();

            if (doctorError) throw doctorError;

            const appointmentDateTime = new Date(`${schedule.scheduled_date}T${schedule.start_time}`);
            const now = new Date();
            const timeDiff = appointmentDateTime.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

            let displayDate = "";
            if (daysDiff === 0) displayDate = "Today";
            else if (daysDiff === 1) displayDate = "Tomorrow";
            else if (daysDiff < 7) displayDate = `In ${daysDiff} days`;
            else displayDate = appointmentDateTime.toLocaleDateString();

            const formattedTime = appointmentDateTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            return {
              id: schedule.id,
              doctor: `Dr. ${formatName(`${doctor.first_name} ${doctor.last_name}`)}`,
              specialty: doctor.specialization,
              date: displayDate,
              time: formattedTime,
              type: schedule.consultation_type,
              avatar: doctor.profile_image || "",
              appointment_date: schedule.scheduled_date,
              status: schedule.status,
            };
          })
        );
        setUpcomingAppointments(appointmentsWithDoctors);
      } catch {
        setUpcomingAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    if (isAuthenticated) fetchAppointments();
  }, [userProfile?.id, isAuthenticated]);

  // Fetch real stats: total consultations, active medications, and all-time session history
  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile?.id) return;
      try {
        const [{ count: consultCount }, { count: medCount }, { count: historyCount }] = await Promise.all([
          // Total completed consultations
          supabase
            .from("schedules")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", userProfile.id)
            .eq("status", "completed"),
          // Active prescriptions
          supabase
            .from("prescriptions")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", userProfile.id)
            .eq("status", "active"),
          // Any schedule ever (for first vs next CTA)
          supabase
            .from("schedules")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", userProfile.id),
        ]);
        setTotalConsultations(consultCount ?? 0);
        setActiveMedications(medCount ?? 0);
        setHasSessionHistory((historyCount ?? 0) > 0);
      } catch {
        // leave defaults (null / false)
      }
    };
    if (isAuthenticated) fetchStats();
  }, [userProfile?.id, isAuthenticated]);

  // Fetch chart data — consultations per day over the last 7 days
  useEffect(() => {
    const fetchChartData = async () => {
      if (!userProfile?.id) return;
      try {
        const days: { day: string; consultations: number }[] = [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const { count } = await supabase
            .from("schedules")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", userProfile.id)
            .eq("scheduled_date", dateStr)
            .in("status", ["confirmed", "completed"]);
          days.push({ day: dayNames[d.getDay()], consultations: count || 0 });
        }
        setChartData(days);
      } catch {
        setChartData([]);
      }
    };
    if (isAuthenticated) fetchChartData();
  }, [userProfile?.id, isAuthenticated]);

  // Cancel appointment
  const handleCancelAppointment = async (scheduleId: string) => {
    try {
      // Get the schedule to find the doctor
      const { data: schedule } = await supabase
        .from("schedules")
        .select("*, doctor_profiles(user_id, full_name, first_name, last_name)")
        .eq("id", scheduleId)
        .single();

      const { error } = await supabase
        .from("schedules")
        .update({ status: "cancelled" })
        .eq("id", scheduleId);
      if (error) throw error;

      // Notify the doctor in-app
      const doctorUserId = (schedule?.doctor_profiles as { user_id?: string } | null)?.user_id;
      if (doctorUserId) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifications: [{
              user_id: doctorUserId,
              title: "Appointment Cancelled",
              body: `${userProfile?.first_name || "A patient"} has cancelled their appointment on ${schedule?.scheduled_date} at ${schedule?.start_time}.`,
              type: "warning",
              schedule_id: scheduleId,
            }],
          }),
        });
      }

      toast({ title: "Cancelled", description: "Your appointment has been cancelled." });
      // Refresh appointments list
      setUpcomingAppointments((prev) =>
        prev.map((a) => a.id === scheduleId ? { ...a, status: "cancelled" } : a)
      );
    } catch {
      toast({ title: "Error", description: "Failed to cancel appointment.", variant: "destructive" });
    }
  };

  // Auth redirect
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        const timer = setTimeout(() => {
          window.location.href = "/signin?redirectedFrom=dashboard";
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, isAuthenticated]);

  const copyWalletAddress = async () => {
    if (userProfile?.wallet_address) {
      try {
        await navigator.clipboard.writeText(userProfile.wallet_address);
        toast({ title: "Copied!", description: "Wallet address copied to clipboard." });
      } catch {
        toast({ title: "Error", description: "Failed to copy wallet address.", variant: "destructive" });
      }
    }
  };

  const getTimeOfDayGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Morning";
    if (h < 17) return "Afternoon";
    return "Evening";
  };

  const stats = [
    {
      label: "Upcoming Appointments",
      value: isLoadingAppointments ? "..." : upcomingAppointments.length.toString(),
      change: "View all appointments",
      icon: Calendar,
      color: "bg-[#004DFF]",
    },
    {
      label: "Wallet Balance",
      value: isLoadingBalance ? "..." : `${walletBalance} USDC`,
      change: "Click header to copy address",
      icon: Wallet,
      color: "bg-emerald-500",
    },
    {
      label: "Consultations",
      value: totalConsultations === null ? "..." : totalConsultations.toString(),
      change: "Total consultations",
      icon: Activity,
      color: "bg-violet-500",
    },
    {
      label: "Active Medications",
      value: activeMedications === null ? "..." : activeMedications.toString(),
      change: "Current prescriptions",
      icon: Pill,
      color: "bg-amber-500",
    },
  ];


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
        <div className="hidden lg:block w-[280px] bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700" />
        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/signin")}
            className="px-6 py-2 bg-[#004DFF] text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, x: isSidebarOpen ? 0 : -280 }}
        className="fixed lg:relative z-50 h-screen bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col flex-shrink-0"
        style={{ minWidth: isSidebarOpen ? 280 : 0 }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-2">
          <Image
            src="/telehealthlogo.svg"
            alt="Epoch Telehealth"
            width={140}
            height={36}
            className="h-8 w-auto"
          />
          <span className="text-xl text-[#004DFF] font-bold tracking-tight">EpochTelehealth</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === "Dashboard"}
            onClick={() => setActiveTab("Dashboard")}
          />
          <SidebarItem
            icon={Stethoscope}
            label="Doctors"
            active={activeTab === "Doctors"}
            href="/doctors"
          />
          <SidebarItem
            icon={MessageSquare}
            label="AI Health Chat"
            active={activeTab === "AI Chat"}
            href="/ai-chat"
          />
          <SidebarItem
            icon={Pill}
            label="Order Medication"
            active={activeTab === "Medication"}
            href="/medication"
          />
          <SidebarItem
            icon={FileText}
            label="Medical Records"
            active={activeTab === "Records"}
            href="/records"
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            active={activeTab === "Settings"}
            onClick={() => setActiveTab("Settings")}
          />
        </nav>

        {/* Patient Profile Area */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-2">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={avatarSrc} />
                <AvatarFallback className="text-xs font-bold bg-[#004DFF]/10 dark:bg-blue-500/20 text-[#004DFF] dark:text-blue-400">
                  {userProfile?.first_name ? getInitials(userProfile.first_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {formatName(userProfile?.first_name || "")} {formatName(userProfile?.last_name || "")}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Patient
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 mb-1">
              <ThemeToggle />
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    window.location.href = "/signin";
                  } catch {}
                }}
                className="flex items-center gap-2 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-sm font-medium rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size={17}
              />
              <input
                type="text"
                placeholder="Search doctors, appointments..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#004DFF] focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm w-56 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Wallet chip */}
            <button
              onClick={copyWalletAddress}
              className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition"
            >
              <Wallet size={16} className="text-[#004DFF] dark:text-blue-400" />
              <span>{isLoadingBalance ? "..." : `${walletBalance} USDC`}</span>
            </button>
            {/* Notifications */}
            <NotificationDropdown userId={userProfile?.user_profile_id || userProfile?.id || ""} />
            {/* Book appointment CTA */}
            <Button
              className="flex items-center space-x-2 bg-[#004DFF] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition"
              asChild
            >
              <Link href="/doctors">
                <Plus size={17} />
                <span className="hidden sm:inline">Book Appointment</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Good {getTimeOfDayGreeting()},{" "}
              {userProfile?.first_name ? formatName(userProfile.first_name) : "User"}! 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {isLoadingAppointments
                ? "Loading your appointments..."
                : `You have ${upcomingAppointments.length} upcoming appointment${
                    upcomingAppointments.length !== 1 ? "s" : ""
                  } scheduled.`}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg opacity-90`}>
                    <stat.icon size={22} />
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-600">
                    <Activity size={11} />
                    <span>↑</span>
                  </div>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{stat.label}</h3>
                {loading ? (
                  <Skeleton className="h-7 w-24 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                )}
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{stat.change}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Appointments + Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Appointments */}
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Calendar className="text-[#004DFF]" size={18} />
                    Upcoming Appointments
                  </h2>
                  <Link
                    href="/dashboard/appointments"
                    className="text-[#004DFF] text-sm font-bold hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-2">
                  {isLoadingAppointments ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-11 w-11 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((apt) => (
                      <AppointmentRow
                        key={apt.id}
                        appointment={apt}
                        router={router}
                        onCancel={handleCancelAppointment}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming appointments.</p>
                      <Link href="/doctors" className="mt-4 text-[#004DFF] text-sm font-bold hover:underline inline-block">
                        + Book your {hasSessionHistory ? "next" : "first"} appointment
                      </Link>
                    </div>
                  )}
                </div>
              </section>

              {/* Health Activity Chart */}
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Activity className="text-emerald-600" size={18} />
                    Consultation Activity
                  </h2>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Last 7 Days</span>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                        cursor={{ fill: "rgba(16,185,129,0.06)" }}
                      />
                      <Bar dataKey="consultations" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                    No consultation data for this period
                  </div>
                )}
              </section>
            </div>

            {/* Right Sidebar Widgets */}
            <div className="space-y-6">
              {/* Quick Actions Widget */}
              <section className="bg-[#004DFF] rounded-2xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none">
                <h2 className="text-base font-bold mb-4">Quick Actions</h2>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="font-medium text-sm">Your health, your control</span>
                </div>
                <div className="space-y-3">
                  <Link
                    href="/doctors"
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 text-sm text-white"
                  >
                    <Stethoscope size={16} />
                    <span>Find a Doctor</span>
                  </Link>
                  <Link
                    href="/ai-chat"
                    className="w-full bg-white text-[#004DFF] py-3 rounded-xl font-bold transition-all text-sm hover:bg-blue-50 flex items-center justify-center space-x-2"
                  >
                    <Heart size={16} />
                    <span>AI Health Chat</span>
                  </Link>
                </div>
              </section>

              {/* Wallet Widget */}
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Wallet size={18} className="text-[#004DFF]" />
                  USDC Wallet
                </h2>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {isLoadingBalance ? <Skeleton className="h-8 w-28 inline-block" /> : `${walletBalance} USDC`}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 truncate">
                  {userProfile?.wallet_address
                    ? `${userProfile.wallet_address.substring(0, 8)}...${userProfile.wallet_address.slice(-6)}`
                    : "Not connected"}
                </p>
                <button
                  onClick={copyWalletAddress}
                  className="w-full py-2.5 bg-slate-900 dark:bg-[#004DFF] text-white rounded-xl font-bold text-sm hover:opacity-90 transition"
                >
                  Copy Wallet Address
                </button>
              </section>

              {/* HIPAA Badge */}
              <section className="bg-slate-900 rounded-2xl p-5 text-white">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Shield size={18} />
                  </div>
                  <h3 className="font-bold text-sm">HIPAA Compliant</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your connection is end-to-end encrypted with 256-bit AES. All patient data is stored securely in accordance with global healthcare regulations.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
