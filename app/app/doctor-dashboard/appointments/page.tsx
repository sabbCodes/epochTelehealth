"use client"

import { useState } from "react";
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
  XCircle,
  AlertCircle,
  ChevronLeft,
  Filter,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Appointment {
  id: number;
  patient: string;
  time: string;
  endTime: string;
  type: string;
  condition: string;
  avatar: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  duration: string;
  notes: string;
  fee: string;
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 1,
    patient: "John Doe",
    time: "09:00 AM",
    endTime: "09:30 AM",
    type: "Video Consultation",
    condition: "Follow-up Cardiology",
    avatar: "",
    status: "confirmed",
    duration: "30 min",
    notes: "Patient reports improved symptoms",
    fee: "3.00 USDC",
  },
  {
    id: 2,
    patient: "Sarah Johnson",
    time: "10:30 AM",
    endTime: "11:15 AM",
    type: "Video Consultation",
    condition: "Chest Pain Assessment",
    avatar: "",
    status: "pending",
    duration: "45 min",
    notes: "First-time consultation",
    fee: "5.00 USDC",
  },
  {
    id: 3,
    patient: "Michael Chen",
    time: "02:00 PM",
    endTime: "02:30 PM",
    type: "Video Consultation",
    condition: "Routine Checkup",
    avatar: "",
    status: "confirmed",
    duration: "30 min",
    notes: "Annual health screening",
    fee: "3.00 USDC",
  },
  {
    id: 4,
    patient: "Emma Wilson",
    time: "03:30 PM",
    endTime: "04:00 PM",
    type: "Video Consultation",
    condition: "Hypertension Management",
    avatar: "",
    status: "completed",
    duration: "30 min",
    notes: "Medication adjustment needed",
    fee: "3.00 USDC",
  },
];

function getStatusStyles(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20";
    case "pending":
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20";
    case "completed":
      return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20";
    case "cancelled":
      return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20";
    default:
      return "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-600";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "confirmed": return <CheckCircle size={13} />;
    case "pending":   return <AlertCircle size={13} />;
    case "completed": return <CheckCircle size={13} />;
    case "cancelled": return <XCircle size={13} />;
    default:          return <Clock size={13} />;
  }
}

function getStatusDot(status: string) {
  switch (status) {
    case "confirmed": return "bg-emerald-500";
    case "pending":   return "bg-amber-500";
    case "completed": return "bg-blue-500";
    case "cancelled": return "bg-slate-400";
    default:          return "bg-slate-400";
  }
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function DoctorAppointments() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"list" | "calendar">("list");

  const filteredAppointments = MOCK_APPOINTMENTS.filter((apt) => {
    const matchesSearch =
      apt.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Back + Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/doctor-dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#004DFF] dark:hover:text-blue-400 transition mb-2"
            >
              <ChevronLeft size={16} />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Manage your schedule and patient consultations.
            </p>
          </div>
          <button
            onClick={() => router.push("/schedule")}
            className="flex items-center justify-center space-x-2 bg-[#004DFF] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>Add Availability</span>
          </button>
        </header>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
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
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 dark:text-white px-4 py-3 pr-9 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
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

        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
          {(["list", "calendar"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-700 text-[#004DFF] dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab === "list" ? "List View" : "Calendar View"}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt, idx) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md dark:hover:shadow-slate-700/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Patient info */}
                      <div className="flex items-start space-x-4">
                        <div className="relative flex-shrink-0">
                          {apt.avatar ? (
                            <img
                              src={apt.avatar}
                              alt={apt.patient}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-[#004DFF]/10 dark:bg-blue-500/20 flex items-center justify-center text-[#004DFF] dark:text-blue-400 font-bold text-lg border-2 border-white dark:border-slate-700">
                              {getInitials(apt.patient)}
                            </div>
                          )}
                          <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white dark:border-slate-800 flex items-center justify-center text-white ${getStatusDot(apt.status)}`}
                          >
                            {getStatusIcon(apt.status)}
                          </div>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {apt.patient}
                            </h3>
                            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${getStatusStyles(apt.status)}`}>
                              {getStatusIcon(apt.status)}
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{apt.condition}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                            <span className="flex items-center gap-1">
                              <Clock size={13} className="text-[#004DFF]" />
                              {apt.time} – {apt.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={13} className="text-emerald-500" />
                              {apt.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign size={13} className="text-amber-500" />
                              {apt.fee}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center flex-wrap gap-2">
                        {apt.status === "confirmed" && (
                          <>
                            <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 text-sm">
                              <Video size={16} />
                              Join
                            </button>
                            <button className="p-2.5 text-slate-400 hover:text-[#004DFF] hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition border border-slate-100 dark:border-slate-700">
                              <MessageCircle size={18} />
                            </button>
                          </>
                        )}
                        {apt.status === "pending" && (
                          <>
                            <button className="flex items-center gap-2 bg-[#004DFF] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-blue-900/20 text-sm">
                              <CheckCircle size={16} />
                              Accept
                            </button>
                            <button className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition text-sm">
                              <XCircle size={16} />
                              Decline
                            </button>
                          </>
                        )}
                        {apt.status === "completed" && (
                          <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm">
                            <Eye size={16} />
                            View Notes
                          </button>
                        )}
                        <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>

                    {apt.notes && (
                      <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          <span className="font-bold text-slate-900 dark:text-slate-200 mr-2">Notes:</span>
                          {apt.notes}
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
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-center"
            >
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-[#004DFF] dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarIcon size={38} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Calendar Integration</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
                The full interactive calendar view is being synchronized with your schedule.
              </p>
              <button className="mt-8 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition-all text-sm">
                Connect Google Calendar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
