"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Video,
  MessageCircle,
  Star,
  Plus,
  AlertCircle,
  Wallet,
  LogOut,
  Search,
  ChevronRight,
  Activity,
  Shield,
  LayoutDashboard,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctorProfile, getDoctorInitials } from "@/hooks/useDoctorProfile";
import { formatName, formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { NotificationDropdown } from "@/components/NotificationDropdown";

// ---- Types ----

interface Appointment {
  id: string;
  patient: string;
  time: string;
  date: string;
  endTime: string;
  type: string;
  condition?: string;
  avatar: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  duration: string;
  patientId: string;
  startTime: string;
  notes?: string;
}

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

interface AvailabilityDay {
  isOpen: boolean;
  start: string;
  end: string;
}

interface Availability {
  [day: string]: AvailabilityDay;
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
      : "text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700 hover:text-slate-900 dark:text-white"
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
  onPatientClick,
  router,
}: {
  appointment: Appointment;
  onPatientClick: (id: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 my-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 rounded-xl transition-colors group">
      <div className="flex items-center space-x-4 min-w-0">
        <div className="relative flex-shrink-0">
          <Avatar className="w-11 h-11 border-2 border-white shadow-sm">
            <AvatarImage src={appointment.avatar} />
            <AvatarFallback className="text-sm font-bold bg-[#004DFF]/10 text-[#004DFF]">
              {appointment.patient
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              appointment.status === "confirmed"
                ? "bg-emerald-500"
                : appointment.status === "completed"
                ? "bg-slate-400"
                : "bg-amber-500"
            }`}
          />
        </div>
        <div className="min-w-0">
          <button
            onClick={() => onPatientClick(appointment.patientId)}
            className="font-semibold text-slate-900 dark:text-white hover:text-[#004DFF] transition-colors text-sm leading-tight truncate block"
          >
            {appointment.patient}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center mt-0.5">
            <Clock size={11} className="mr-1 flex-shrink-0" />
            <span className="truncate">
              {appointment.time} · {appointment.notes || appointment.condition || "No notes"}
            </span>
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
        <span
          className={`hidden md:inline text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
            appointment.type === "video" || appointment.type === "extended_video"
              ? "bg-blue-50 text-blue-600"
              : appointment.type === "text"
              ? "bg-violet-50 text-violet-600"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600"
          }`}
        >
          {appointment.type === "extended_video" ? "1h Video" : appointment.type}
        </span>
        <button
          onClick={() => {
            if (appointment.type === "text") {
              router.push(`/chat/doctor?appointmentId=${appointment.id}`);
            } else {
              router.push(`/video-call?appointmentId=${appointment.id}&role=doctor`);
            }
          }}
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-[#004DFF] hover:bg-blue-50 rounded-lg transition-all"
        >
          {appointment.type === "text" ? <MessageCircle size={17} /> : <Video size={17} />}
        </button>
        <button
          onClick={() => onPatientClick(appointment.patientId)}
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700 rounded-lg transition-all"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ---- Availability Modal ----

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function AvailabilityModal({
  open,
  onClose,
  doctorId,
  currentAvailability,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  doctorId: string | undefined;
  currentAvailability: Availability | null;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const defaultSlot: AvailabilityDay = { isOpen: false, start: "09:00", end: "17:00" };
  const [schedule, setSchedule] = useState<Availability>(() => {
    if (currentAvailability) return currentAvailability;
    return Object.fromEntries(DAYS.map((d) => [d, { ...defaultSlot }]));
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentAvailability) setSchedule(currentAvailability);
  }, [currentAvailability]);

  function update(day: string, field: keyof AvailabilityDay, value: string | boolean) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function save() {
    if (!doctorId) return;
    setSaving(true);
    const { error } = await supabase
      .from("doctor_profiles")
      .update({ availability_schedule: schedule })
      .eq("id", doctorId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to save availability.", variant: "destructive" });
    } else {
      toast({ title: "Availability Updated", description: "Your schedule has been saved." });
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={18} className="text-[#004DFF] dark:text-blue-400" />
            Update Availability Schedule
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Set your consultation hours for each day of the week.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <input
                type="checkbox"
                checked={schedule[day]?.isOpen ?? false}
                onChange={(e) => update(day, "isOpen", e.target.checked)}
                className="w-4 h-4 rounded accent-[#004DFF]"
              />
              <span className={`w-24 capitalize text-sm font-semibold ${schedule[day]?.isOpen ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                {day}
              </span>
              {schedule[day]?.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={schedule[day].start}
                    onChange={(e) => update(day, "start", e.target.value)}
                    className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white"
                  />
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">to</span>
                  <Input
                    type="time"
                    value={schedule[day].end}
                    onChange={(e) => update(day, "end", e.target.value)}
                    className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white"
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-600 italic">Closed</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 bg-[#004DFF] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 shadow-lg shadow-blue-200 dark:shadow-none"
          >
            {saving ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Dashboard ----

export default function DoctorDashboard() {
  const { doctorProfile, loading, error } = useDoctorProfile();
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [chartData, setChartData] = useState<{ day: string; consultations: number }[]>([]);
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

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!doctorProfile?.wallet_address) return;
      setIsLoadingBalance(true);
      try {
        const connection = new Connection("https://api.devnet.solana.com");
        const walletAddress = new PublicKey(doctorProfile.wallet_address);
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
  }, [doctorProfile?.wallet_address]);

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!doctorProfile?.id) return;
      try {
        setIsLoadingAppointments(true);
        const { data: schedules, error: err } = await supabase
          .from("schedules")
          .select("*")
          .eq("doctor_id", doctorProfile.id)
          .eq("status", "confirmed")
          .gte("scheduled_date", new Date().toISOString().split("T")[0])
          .order("scheduled_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(8);

        if (err) throw err;
        if (!schedules || schedules.length === 0) {
          setUpcomingAppointments([]);
          return;
        }

        const withPatients = await Promise.all(
          schedules.map(async (s) => {
            const { data: p } = await supabase
              .from("patient_profiles")
              .select("*")
              .eq("id", s.patient_id)
              .single();
            const start = new Date(`1970-01-01T${s.start_time}Z`);
            const end = new Date(`1970-01-01T${s.end_time}Z`);
            const mins = Math.round((end.getTime() - start.getTime()) / 60000);
            return {
              id: s.id,
              patient: p ? `${formatName(p.first_name)} ${formatName(p.last_name)}` : "Unknown",
              time: new Date(`${s.scheduled_date}T${s.start_time}`).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              date: s.scheduled_date,
              type: s.consultation_type,
              notes: s.notes || "",
              avatar: p?.profile_image || "",
              status: s.status,
              duration: `${mins} min`,
              patientId: p?.id || "",
              startTime: s.start_time,
              endTime: s.end_time,
            };
          })
        );
        setUpcomingAppointments(withPatients);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to fetch appointments.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setIsLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, [doctorProfile?.id, toast]);

  // Fetch chart data — consultations per day over the last 7 days
  useEffect(() => {
    const fetchChartData = async () => {
      if (!doctorProfile?.id) return;
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
            .eq("doctor_id", doctorProfile.id)
            .eq("scheduled_date", dateStr)
            .in("status", ["confirmed", "completed"]);
          days.push({ day: dayNames[d.getDay()], consultations: count || 0 });
        }
        setChartData(days);
      } catch {
        setChartData([]);
      }
    };
    fetchChartData();
  }, [doctorProfile?.id]);

  const handlePatientClick = async (patientId: string) => {
    if (!patientId) return;
    try {
      const { data: patient, error } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("id", patientId)
        .single();
      if (error) throw error;
      setSelectedPatient(patient);
    } catch {
      toast({ title: "Error", description: "Failed to load patient details.", variant: "destructive" });
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
      trend: "up" as const,
      icon: Calendar,
      color: "bg-[#004DFF]",
    },
    {
      label: "Total Patients",
      value: loading ? "..." : String(doctorProfile?.total_patients || "0"),
      change: "+0 this week",
      trend: "up" as const,
      icon: Users,
      color: "bg-emerald-500",
    },
    {
      label: "Wallet Balance",
      value: isLoadingBalance ? "..." : `${walletBalance} USDC`,
      change: "Click header to copy address",
      trend: "up" as const,
      icon: Wallet,
      color: "bg-violet-500",
    },
    {
      label: "Patient Rating",
      value: loading ? "..." : doctorProfile?.rating?.toFixed(1) || "N/A",
      change: `Based on ${doctorProfile?.total_reviews || 0} reviews`,
      trend: "up" as const,
      icon: Star,
      color: "bg-amber-500",
    },
  ];



  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-6">{error || "An error occurred. Please try again later."}</p>
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
            className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500"
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
            icon={Calendar}
            label="Appointments"
            active={activeTab === "Appointments"}
            href="/doctor-dashboard/appointments"
          />
          {/* <SidebarItem
            icon={Users}
            label="Patients"
            active={activeTab === "Patients"}
            href="/doctor-dashboard/patients"
          />
          <SidebarItem
            icon={ClipboardList}
            label="Schedule"
            active={activeTab === "Schedule"}
            href="/schedule"
          /> */}
          <SidebarItem
            icon={Settings}
            label="Settings"
            active={activeTab === "Settings"}
            onClick={() => setActiveTab("Settings")}
          />
        </nav>

        {/* Doctor Profile Area */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-2">
            <div className="flex items-center space-x-3 mb-4">
              {loading ? (
                <Skeleton className="h-10 w-10 rounded-full" />
              ) : (
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={doctorProfile?.profile_image || ""} />
                  <AvatarFallback className="text-xs font-bold bg-[#004DFF]/10 dark:bg-blue-500/20 text-[#004DFF] dark:text-blue-400">
                    {getDoctorInitials(doctorProfile?.full_name || "D")}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0">
                {loading ? (
                  <Skeleton className="h-4 w-24 mb-1" />
                ) : (
                  <p className="text-sm font-bold truncate">
                    Dr. {formatName(doctorProfile?.last_name || "")} {formatName(doctorProfile?.first_name || "")}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 truncate">
                  {loading ? "" : doctorProfile?.specialization || "Doctor"}
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
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 dark:text-slate-500"
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
                placeholder="Search patients, notes..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-transparent focus:bg-white dark:bg-slate-800 focus:border-[#004DFF] focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm w-56 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Wallet */}
            <button
              onClick={async () => {
                if (doctorProfile?.wallet_address) {
                  try {
                    await navigator.clipboard.writeText(doctorProfile.wallet_address);
                    toast({ title: "Copied!", description: "Wallet address copied to clipboard." });
                  } catch {}
                }
              }}
              className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition"
            >
              <Wallet size={16} className="text-[#004DFF] dark:text-blue-400" />
              <span>{isLoadingBalance ? "..." : `${walletBalance} USDC`}</span>
            </button>
            {/* Withdraw */}
            <button
              onClick={() => setWithdrawOpen(true)}
              className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition"
            >
              <DollarSign size={16} />
              <span>Withdraw</span>
            </button>
            {/* Notifications */}
            <NotificationDropdown userId={doctorProfile?.user_profile_id || ""} />
            {/* Availability CTA */}
            <button
              onClick={() => setAvailabilityOpen(true)}
              className="flex items-center space-x-2 bg-[#004DFF] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">Add Availability</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            {loading ? (
              <Skeleton className="h-8 w-64 mb-2" />
            ) : (
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Good {getTimeOfDayGreeting()}, Dr.{" "}
                {formatName(doctorProfile?.last_name || "")} 👋
              </h1>
            )}
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1 text-sm">
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
                    <span>{stat.trend === "up" ? "↑" : "↓"}</span>
                  </div>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-xs font-medium mb-1">{stat.label}</h3>
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
                    href="/doctor-dashboard/appointments"
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
                        onPatientClick={handlePatientClick}
                        router={router}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm">No appointments scheduled yet.</p>
                      <button
                        onClick={() => setAvailabilityOpen(true)}
                        className="mt-4 text-[#004DFF] text-sm font-bold hover:underline"
                      >
                        + Add your availability
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Patient Activity Chart */}
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
                        cursor={{ fill: "rgba(0,77,255,0.06)" }}
                      />
                      <Bar dataKey="consultations" fill="#004DFF" radius={[8, 8, 0, 0]} />
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
              {/* Availability Widget */}
              <section className="bg-[#004DFF] rounded-2xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none">
                <h2 className="text-base font-bold mb-4">Availability Status</h2>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="font-medium text-sm">Online &amp; Accepting Calls</span>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/schedule")}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 text-sm text-white"
                  >
                    <Calendar size={16} />
                    <span>View Full Schedule</span>
                  </button>
                  <button
                    onClick={() => setAvailabilityOpen(true)}
                    className="w-full bg-white text-[#004DFF] py-3 rounded-xl font-bold transition-all text-sm hover:bg-blue-50"
                  >
                    Update Availability
                  </button>
                </div>
              </section>

              {/* Withdraw */}
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Wallet size={18} className="text-[#004DFF]" />
                  USDC Wallet
                </h2>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {isLoadingBalance ? <Skeleton className="h-8 w-28 inline-block" /> : `${walletBalance} USDC`}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 truncate">
                  {doctorProfile?.wallet_address
                    ? `${doctorProfile.wallet_address.substring(0, 8)}...${doctorProfile.wallet_address.slice(-6)}`
                    : "Not connected"}
                </p>
                <button
                  onClick={() => setWithdrawOpen(true)}
                  className="w-full py-2.5 bg-slate-900 dark:bg-[#004DFF] text-white rounded-xl font-bold text-sm hover:opacity-90 transition"
                >
                  Withdraw USDC
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
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  Your connection is end-to-end encrypted with 256-bit AES. All patient data is stored securely in accordance with global healthcare regulations.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Availability Modal */}
      <AvailabilityModal
        open={availabilityOpen}
        onClose={() => setAvailabilityOpen(false)}
        doctorId={doctorProfile?.id}
        currentAvailability={
          doctorProfile?.availability_schedule
            ? (doctorProfile.availability_schedule as unknown as Availability)
            : null
        }
        toast={toast}
      />

      {/* Withdraw USDC Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet size={18} className="text-[#004DFF] dark:text-blue-400" />
              Withdraw USDC
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Send USDC from your wallet to another Solana address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Amount (USDC)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Available: {walletBalance} USDC</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Destination Address</label>
              <Input
                type="text"
                placeholder="Recipient Solana address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setWithdrawOpen(false)}
                disabled={withdrawing}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={withdrawing}
                className="px-5 py-2 bg-[#004DFF] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {withdrawing ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Details Modal */}
      <Dialog open={!!selectedPatient} onOpenChange={(o) => !o && setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <>
              <DialogHeader className="flex flex-col items-center text-center">
                <div className="relative w-20 h-20 mb-3">
                  <Avatar className="w-full h-full">
                    <AvatarImage
                      src={selectedPatient.profile_image || ""}
                      alt={`${formatName(selectedPatient.first_name)} ${formatName(selectedPatient.last_name)}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl font-bold bg-[#004DFF]/10 text-[#004DFF]">
                      {selectedPatient.first_name?.[0]}
                      {selectedPatient.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <DialogTitle className="text-xl">
                  {formatName(selectedPatient.first_name)}{" "}
                  {formatName(selectedPatient.last_name)}
                </DialogTitle>
                <DialogDescription>
                  {selectedPatient.gender ? `${formatName(selectedPatient.gender)} · ` : ""}
                  {selectedPatient.date_of_birth &&
                    `${calculateAge(selectedPatient.date_of_birth)} years old`}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Demographics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoRow label="Date of Birth" value={selectedPatient.date_of_birth ? formatDate(selectedPatient.date_of_birth) : "Not provided"} />
                    <InfoRow label="Gender" value={selectedPatient.gender || "Not provided"} />
                    <InfoRow label="Marital Status" value={selectedPatient.marital_status || "Not provided"} />
                    <InfoRow label="Occupation" value={selectedPatient.occupation || "Not provided"} />
                    <InfoRow label="Location" value={[selectedPatient.city, selectedPatient.country].filter(Boolean).join(", ") || "Not provided"} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Medical Information</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Medical History", value: selectedPatient.medical_history || "No medical history provided" },
                      { label: "Allergies", value: selectedPatient.allergies || "No known allergies" },
                      { label: "Current Medications", value: selectedPatient.current_medications || "No current medications" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-sm text-slate-700">{value}</div>
                      </div>
                    ))}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 flex-shrink-0 text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-slate-900 dark:text-white font-medium">{value}</span>
    </div>
  );
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}
