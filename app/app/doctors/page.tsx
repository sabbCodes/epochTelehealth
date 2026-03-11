"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Star, MapPin, Clock, Calendar, Bot, Stethoscope, Video, MessageCircle, ChevronRight, CheckCircle, ArrowRight, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDoctors, getDoctorSpecialties, DoctorProfile } from "@/lib/doctors";
import Link from "next/link";
import { formatName } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      type: "bot",
      message: "Hi! I'm your AI triage assistant. Tell me about your symptoms and I'll suggest the right specialist for you.",
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChatbot) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isTyping, showChatbot]);

  useEffect(() => {
    let isMounted = true;
    const loadSpecialties = async () => {
      try {
        const specialtiesData = await getDoctorSpecialties();
        if (isMounted && specialtiesData) setSpecialties(specialtiesData);
      } catch (err) {
        console.error("Error loading specialties:", err);
      }
    };
    loadSpecialties();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadDoctors = async () => {
      try {
        setLoading(true);
        const doctorsData = await fetchDoctors({ searchQuery, specialty: selectedSpecialty });
        if (isMounted) {
          setDoctors(doctorsData);
          setError(null);
        }
      } catch (err) {
        console.error("Error loading doctors:", err);
        if (isMounted) setError("Failed to load doctors. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(loadDoctors, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedSpecialty]);

  const getExperienceText = (years: number | null | undefined) => {
    if (!years) return 'Experience not specified';
    return years === 1 ? `${years} year xp` : `${years} years xp`;
  };

  const getBaseFee = (doc: DoctorProfile) => {
    const fees = [doc.consultation_fee_30min_video, doc.consultation_fee_60min_video, doc.consultation_fee_30min_chat].filter((f): f is number => !!f);
    if (fees.length === 0) return "Free / TBD";
    return `${Math.min(...fees)} USDC`;
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isTyping) return;
    
    const userMsg = { type: "user", message: currentMessage };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setCurrentMessage("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.type === "user" ? "user" : "model", content: m.message })),
          specialties
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setChatMessages(prev => [...prev, { type: "bot", message: data.message }]);
      
      if (data.suggestedSpecialty && specialties.includes(data.suggestedSpecialty)) {
        setSelectedSpecialty(data.suggestedSpecialty);
        toast({ title: "Specialty selected", description: `Filtering by ${data.suggestedSpecialty} based on your symptoms.` });
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { type: "bot", message: "Sorry, I am having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white pb-20 lg:pb-0">
      
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                <Stethoscope size={14} /> Our Specialists
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
                Find the right doctor for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">health needs</span>.
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Connect with top-rated medical professionals for secure text, audio, and video consultations from anywhere in the world.
              </p>
            </div>
            
            <button
              onClick={() => setShowChatbot(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all active:scale-95 group"
            >
              <Bot className="group-hover:animate-bounce" />
              <span>Use AI Triage Assistant</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-10 bg-white dark:bg-slate-800 p-2 pl-6 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-2 max-w-4xl focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <Search className="text-slate-400 shrink-0 hidden md:block" size={20} />
            <input
              type="text"
              placeholder="Search by name, condition, or specialty..."
              className="flex-1 w-full bg-transparent border-none outline-none py-3 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium px-4 md:px-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block mx-2" />
            <div className="relative flex-1 md:flex-none w-full md:w-64">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 dark:text-white px-5 py-3 pr-10 rounded-full text-sm font-bold outline-none cursor-pointer border-none"
              >
                <option value="all">All Specialties</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                  <div className="space-y-2 flex-1 pt-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-rose-200 dark:border-rose-900/50 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Failed to load doctors</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl font-bold px-8">Try Again</Button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No doctors found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search terms or specialty filter.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {doctors.map((doctor, index) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md">
                        <AvatarImage src={doctor.profile_image || ""} className="object-cover" />
                        <AvatarFallback className="rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-[#004DFF] font-bold text-xl">
                          {formatName(doctor.first_name?.[0])}{formatName(doctor.last_name?.[0])}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          Dr. {formatName(doctor.first_name)} {formatName(doctor.last_name)}
                          {doctor.is_verified && <CheckCircle className="text-emerald-500" size={16} />}
                        </h3>
                        <p className="text-sm font-semibold text-[#004DFF] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md inline-block mt-1">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 mb-6">
                    {/* Stats row */}
                    <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-slate-900 dark:text-white font-bold">{doctor.rating?.toFixed(1) || "New"}</span>
                        <span className="text-xs text-slate-400">({doctor.reviews_count || 0})</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-900 dark:text-white font-bold">{getExperienceText(doctor.years_of_experience)}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin size={16} className="text-slate-400 shrink-0" />
                        <span className="truncate">{[doctor.city, doctor.country].filter(Boolean).join(', ') || "Location not specified"}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                        <MessageCircle size={16} className="text-slate-400 shrink-0" />
                        <span className="truncate">{doctor.languages?.join(', ') || "English"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Starting from</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{getBaseFee(doctor)}</p>
                    </div>
                    <Link href={`/schedule?doctorId=${doctor.id}`}>
                      <button className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        Book <ArrowRight size={16} />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* AI Chatbot Overlay */}
      <AnimatePresence>
        {showChatbot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowChatbot(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md h-[500px] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">AI Triage Assistant</h3>
                    <p className="text-xs text-blue-100 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChatbot(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/50">
                {chatMessages.map((msg, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.type === "user"
                          ? "bg-[#004DFF] text-white rounded-br-sm"
                          : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-600 rounded-bl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-600 rounded-bl-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 p-1.5 pl-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <input
                    type="text"
                    placeholder="Describe your symptoms..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white disabled:opacity-50"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={isTyping}
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    className="w-9 h-9 flex items-center justify-center bg-[#004DFF] text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:hover:bg-[#004DFF]"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
