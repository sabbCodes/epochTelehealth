"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MessageCircle,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  XCircle,
  X,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabase";
import { formatName } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  doctor: string;
  doctorId: string;
  doctorUserId?: string;
  specialty: string;
  time: string;
  endTime: string;
  date: string;
  type: string;
  consultationType: string;
  avatar: string;
  status: "confirmed" | "pending" | "completed" | "cancelled" | "scheduled";
  duration: string;
}

// Helpers
function getStatusStyles(status: string) {
  switch (status) {
    case "confirmed": return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
    case "pending":
    case "scheduled": return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400";
    case "completed": return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
    case "cancelled": return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "confirmed": return <CheckCircle size={10} />;
    case "pending":
    case "scheduled": return <AlertCircle size={10} />;
    case "cancelled": return <X size={10} />;
    default: return null;
  }
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function PatientAppointments() {
  const router = useRouter();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      setIsLoading(true);
      let query = supabase
        .from("schedules")
        .select("*")
        .eq("patient_id", userProfile.id)
        .order("scheduled_date", { ascending: false })
        .order("start_time", { ascending: false });

      const today = new Date().toISOString().split("T")[0];
      if (dateFilter === "today") query = query.eq("scheduled_date", today);
      else if (dateFilter === "tomorrow") {
        const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
        query = query.eq("scheduled_date", tmrw.toISOString().split("T")[0]);
      } else if (dateFilter === "week") {
        const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
        query = query.gte("scheduled_date", today).lte("scheduled_date", weekEnd.toISOString().split("T")[0]);
      }

      const { data: schedules, error: err } = await query;
      if (err) throw err;
      if (!schedules || schedules.length === 0) { setAppointments([]); return; }

      const results = await Promise.all(
        schedules.map(async (s) => {
          const { data: d } = await supabase.from("doctor_profiles").select("*").eq("id", s.doctor_id).single();
          
          const start = new Date(`1970-01-01T${s.start_time}Z`);
          const end = new Date(`1970-01-01T${s.end_time}Z`);
          const mins = Math.round((end.getTime() - start.getTime()) / 60000);

          const startFormatted = new Date(`${s.scheduled_date}T${s.start_time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
          const endFormatted = new Date(`${s.scheduled_date}T${s.end_time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
          const displayStatus = s.status === "scheduled" ? "pending" : s.status;

          return {
            id: s.id,
            doctor: d ? `Dr. ${formatName(d.first_name)} ${formatName(d.last_name)}` : "Unknown Doctor",
            doctorId: d?.id || "",
            doctorUserId: d?.user_profile_id,
            specialty: d?.specialization || "General Medicine",
            time: startFormatted,
            endTime: endFormatted,
            date: s.scheduled_date,
            type: s.consultation_type === "video" || s.consultation_type === "extended_video" ? "Video Consultation" : "Text Chat",
            consultationType: s.consultation_type,
            avatar: d?.profile_image || "",
            status: displayStatus as Appointment["status"],
            duration: `${mins} min`,
          };
        })
      );
      setAppointments(results);
    } catch {
      toast({ title: "Error", description: "Failed to load appointments.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.id, dateFilter, toast]);

  useEffect(() => { if (!profileLoading) fetchAppointments(); }, [profileLoading, fetchAppointments]);

  // Cancel Appointment
  const handleCancel = async (apt: Appointment) => {
    setActionLoadingId(apt.id);
    try {
      const { error } = await supabase.from("schedules").update({ status: "cancelled" }).eq("id", apt.id);
      if (error) throw error;

      // In-app notification for doctor
      if (apt.doctorUserId) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifications: [{
              user_id: apt.doctorUserId,
              title: "Appointment Cancelled",
              body: `${userProfile?.first_name || "A patient"} has cancelled their appointment on ${apt.date} at ${apt.time}.`,
              type: "warning",
              schedule_id: apt.id,
            }],
          }),
        });
      }

      toast({ title: "Cancelled", description: "Your appointment has been cancelled." });
      fetchAppointments();
    } catch {
      toast({ title: "Error", description: "Failed to cancel appointment.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filters
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      apt.status === statusFilter ||
      (statusFilter === "pending" && apt.status === "scheduled");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white pb-20 lg:pb-0">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#004DFF] dark:hover:text-blue-400 transition mb-2">
              <ChevronLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">View and manage your upcoming and past consultations.</p>
          </div>
          <button
            onClick={() => router.push("/doctors")}
            className="flex items-center justify-center space-x-2 bg-[#004DFF] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Stethoscope size={20} /><span>Book New Session</span>
          </button>
        </header>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search doctors or specialties..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm transition-all outline-none dark:text-white dark:placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[140px]">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 dark:text-white px-4 py-3 pr-9 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
            <div className="relative min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 dark:text-white px-4 py-3 pr-9 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* List */}
        <AnimatePresence mode="wait">
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-14 w-14 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-56" /><Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((apt, idx) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md dark:hover:shadow-slate-700/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-700 shadow-sm">
                      <AvatarImage src={apt.avatar} className="rounded-2xl object-cover" />
                      <AvatarFallback className="rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-[#004DFF] font-bold text-lg">
                        {getInitials(apt.doctor.replace("Dr. ", ""))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{apt.doctor}</h3>
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${getStatusStyles(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                          {apt.status === "scheduled" ? "pending" : apt.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#004DFF] dark:text-blue-400">{apt.specialty}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                        <span className="flex items-center gap-1"><Clock size={13} className="text-slate-500" />{apt.time} – {apt.endTime}</span>
                        <span className="flex items-center gap-1"><CalendarIcon size={13} className="text-slate-500" />{apt.date} · {apt.duration}</span>
                        {apt.type === "Video Consultation" && <span className="flex items-center gap-1"><Video size={13} className="text-slate-500" />Video</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {(apt.status === "confirmed" || apt.status === "pending") && (
                      <button
                        onClick={() => {
                          if (apt.consultationType === "chat") {
                            router.push(`/chat/patient?appointmentId=${apt.id}`);
                          } else {
                            router.push(`/video-call?appointmentId=${apt.id}&role=patient`);
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shadow-sm text-sm ${
                          apt.consultationType !== "chat"
                            ? "bg-[#004DFF] text-white hover:bg-blue-700 shadow-blue-200 dark:shadow-none"
                            : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none"
                        }`}
                      >
                        {apt.consultationType !== "chat" ? <Video size={16} /> : <MessageCircle size={16} />}
                        Join
                      </button>
                    )}
                    {(apt.status === "scheduled" || apt.status === "pending" || apt.status === "confirmed") && (
                      <button
                        onClick={() => handleCancel(apt)}
                        disabled={actionLoadingId === apt.id}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition text-sm disabled:opacity-50"
                      >
                        {actionLoadingId === apt.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        Cancel
                      </button>
                    )}
                    {apt.status === "completed" && (
                      <button
                        onClick={() => router.push(`/doctors/${apt.doctorId}`)}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold transition text-sm"
                      >
                        Book again <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search size={30} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No appointments found</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
