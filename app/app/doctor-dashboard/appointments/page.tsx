"use client"

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MessageCircle,
  Search,
  Plus,
  Eye,
  MoreVertical,
  CheckCircle,
  CalendarClock,
  AlertCircle,
  ChevronLeft,
  Filter,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { supabase } from "@/lib/supabase";
import { formatName } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// ---- Types ----

interface Appointment {
  id: string;
  patient: string;
  patientId: string;
  patientAuthId?: string;
  patientEmail?: string;
  time: string;
  endTime: string;
  date: string;
  type: string;
  consultationType: string;
  condition: string;
  avatar: string;
  status: "confirmed" | "pending" | "completed" | "cancelled" | "scheduled";
  duration: string;
  notes: string;
}

// ---- Helpers ----

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

function getStatusDot(status: string) {
  switch (status) {
    case "confirmed": return "bg-emerald-500";
    case "pending":
    case "scheduled": return "bg-amber-500";
    case "completed": return "bg-slate-500";
    case "cancelled": return "bg-red-500";
    default: return "bg-slate-400";
  }
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

// ---- Reschedule Modal ----

function RescheduleModal({
  appointment,
  doctorName,
  open,
  onClose,
  onSent,
}: {
  appointment: Appointment;
  doctorName: string;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSend = async () => {
    if (!appointment.patientAuthId) {
      toast({ title: "Error", description: "Cannot find patient contact info.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      // 1. Send reschedule email to the patient
      await fetch("/api/send-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientAuthId: appointment.patientAuthId,
          patientName: appointment.patient,
          doctorName,
          originalDate: appointment.date,
          originalTime: appointment.time,
          doctorMessage: message,
          recipientType: "patient",
        }),
      });

      // 2. In-app notification for the patient
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifications: [{
            user_id: appointment.patientAuthId,
            title: "Reschedule Request",
            body: `Dr. ${doctorName} has requested to reschedule your appointment on ${appointment.date} at ${appointment.time}.${message ? ` Message: "${message}"` : ""} Please book a new time.`,
            type: "warning",
            schedule_id: appointment.id,
          }],
        }),
      });

      toast({ title: "Patient notified", description: "The reschedule request has been sent." });
      onSent();
      onClose();

      // Redirect doctor to update their availability
      setTimeout(() => router.push("/schedule"), 800);
    } catch {
      toast({ title: "Error", description: "Failed to send reschedule request.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <CalendarClock size={18} className="text-amber-500" />
            Suggest Reschedule
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Send a reschedule request to <strong>{appointment.patient}</strong> for their appointment on {appointment.date} at {appointment.time}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Message to patient <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. I have an urgent case at that time. Please pick a new slot — I'll have updated availability shortly."
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 dark:text-white dark:placeholder-slate-500 resize-none transition"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
            After sending, you&apos;ll be redirected to update your availability with new time slots.
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition disabled:opacity-60"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {sending ? "Sending..." : "Send & Update Availability"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main ----

export default function DoctorAppointments() {
  const router = useRouter();
  const { doctorProfile, loading: profileLoading } = useDoctorProfile();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!doctorProfile?.id) return;
    try {
      setIsLoading(true);
      let query = supabase
        .from("schedules")
        .select("*")
        .eq("doctor_id", doctorProfile.id)
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true });

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
          const { data: p } = await supabase.from("patient_profiles").select("*").eq("id", s.patient_id).single();
          
          // user_profile_id is the auth UUID (mirrors auth.users.id)
          const patientAuthId: string | undefined = p?.user_profile_id ?? undefined;
          
          let patientEmail: string | undefined = undefined;
          if (patientAuthId) {
            const { data: up } = await supabase.from("user_profiles").select("email").eq("id", patientAuthId).single();
            patientEmail = up?.email;
          }

          const start = new Date(`1970-01-01T${s.start_time}Z`);
          const end = new Date(`1970-01-01T${s.end_time}Z`);
          const mins = Math.round((end.getTime() - start.getTime()) / 60000);

          const startFormatted = new Date(`${s.scheduled_date}T${s.start_time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
          const endFormatted = new Date(`${s.scheduled_date}T${s.end_time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
          const displayStatus = s.status === "scheduled" ? "pending" : s.status;

          return {
            id: s.id,
            patient: p ? `${formatName(p.first_name)} ${formatName(p.last_name)}` : "Unknown",
            patientId: p?.id || "",
            patientAuthId,
            patientEmail,
            time: startFormatted,
            endTime: endFormatted,
            date: s.scheduled_date,
            type: s.consultation_type === "video" || s.consultation_type === "extended_video" ? "Video Consultation" : "Text Chat",
            consultationType: s.consultation_type,
            condition: s.notes || "General Consultation",
            avatar: p?.profile_image || "",
            status: displayStatus as Appointment["status"],
            duration: `${mins} min`,
            notes: s.notes || "",
          };
        })
      );
      setAppointments(results);
    } catch {
      toast({ title: "Error", description: "Failed to load appointments.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [doctorProfile?.id, dateFilter, toast]);

  useEffect(() => { if (!profileLoading) fetchAppointments(); }, [profileLoading, fetchAppointments]);

  // Accept — sets confirmed, sends in-app notification to patient
  const handleAccept = async (apt: Appointment) => {
    setActionLoadingId(apt.id);
    try {
      const { error } = await supabase.from("schedules").update({ status: "confirmed" }).eq("id", apt.id);
      if (error) throw error;

      // In-app notification for patient
      if (apt.patientAuthId) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifications: [{
              user_id: apt.patientAuthId,
              title: "Appointment Confirmed ✅",
              body: `Dr. ${doctorProfile?.full_name || "Your doctor"} has confirmed your appointment on ${apt.date} at ${apt.time}.`,
              type: "info",
              schedule_id: apt.id,
            }],
          }),
        });
      }

      toast({ title: "Appointment confirmed", description: `${apt.patient} has been notified.` });
      fetchAppointments();
    } catch {
      toast({ title: "Error", description: "Failed to confirm appointment.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filters
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      apt.status === statusFilter ||
      (statusFilter === "pending" && apt.status === "scheduled");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/doctor-dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#004DFF] dark:hover:text-blue-400 transition mb-2">
              <ChevronLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your schedule and patient consultations.</p>
          </div>
          <button
            onClick={() => router.push("/schedule")}
            className="flex items-center justify-center space-x-2 bg-[#004DFF] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} /><span>Add Availability</span>
          </button>
        </header>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search patients or conditions..."
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
                  className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md dark:hover:shadow-slate-700/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Patient info */}
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-700 shadow-sm">
                          <AvatarImage src={apt.avatar} className="rounded-2xl object-cover" />
                          <AvatarFallback className="rounded-2xl bg-[#004DFF]/10 dark:bg-blue-500/20 text-[#004DFF] dark:text-blue-400 font-bold text-lg">
                            {getInitials(apt.patient)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white dark:border-slate-800 flex items-center justify-center text-white ${getStatusDot(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{apt.patient}</h3>
                          <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${getStatusStyles(apt.status)}`}>
                            {getStatusIcon(apt.status)}
                            {apt.status === "scheduled" ? "pending" : apt.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{apt.condition}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                          <span className="flex items-center gap-1"><Clock size={13} className="text-[#004DFF]" />{apt.time} – {apt.endTime}</span>
                          <span className="flex items-center gap-1"><CalendarIcon size={13} className="text-emerald-500" />{apt.date} · {apt.duration}</span>
                          {apt.type === "Video Consultation" && <span className="flex items-center gap-1"><Video size={13} className="text-blue-500" />Video</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center flex-wrap gap-2">
                      {apt.status === "confirmed" && (
                        <>
                          <button
                            onClick={() => {
                              if (apt.type === "Video Consultation") router.push(`/video-call?appointmentId=${apt.id}&role=doctor`);
                              else router.push(`/chat/doctor?appointmentId=${apt.id}`);
                            }}
                            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 text-sm"
                          >
                            {apt.type === "Video Consultation" ? <Video size={16} /> : <MessageCircle size={16} />}
                            Join
                          </button>
                          <button
                            onClick={() => setRescheduleTarget(apt)}
                            className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-4 py-2.5 rounded-xl font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition text-sm"
                          >
                            <CalendarClock size={16} />
                            Reschedule
                          </button>
                        </>
                      )}
                      {(apt.status === "pending" || apt.status === "scheduled") && (
                        <>
                          <button
                            onClick={() => handleAccept(apt)}
                            disabled={actionLoadingId === apt.id}
                            className="flex items-center gap-2 bg-[#004DFF] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-blue-900/20 text-sm disabled:opacity-60"
                          >
                            {actionLoadingId === apt.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Accept
                          </button>
                          <button
                            onClick={() => setRescheduleTarget(apt)}
                            disabled={actionLoadingId === apt.id}
                            className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-4 py-2.5 rounded-xl font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition text-sm disabled:opacity-60"
                          >
                            <CalendarClock size={16} />
                            Suggest Reschedule
                          </button>
                        </>
                      )}
                      {apt.status === "completed" && (
                        <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm">
                          <Eye size={16} /> View Notes
                        </button>
                      )}
                      {/* <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition">
                        <MoreVertical size={18} />
                      </button> */}
                    </div>
                  </div>

                  {apt.notes && (
                    <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        <span className="font-bold text-slate-900 dark:text-slate-200 mr-2">Notes:</span>{apt.notes}
                      </p>
                    </div>
                  )}
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

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          doctorName={doctorProfile?.full_name || "Doctor"}
          open={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSent={fetchAppointments}
        />
      )}
    </div>
  );
}
