"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Stethoscope,
  TrendingUp,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Download,
  BarChart3,
  Activity,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  Database,
  Globe,
  PieChart,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminProfile, getAdminInitials } from "@/hooks/useAdminProfile"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { NotificationDropdown } from "@/components/NotificationDropdown"
import { useToast } from "@/hooks/use-toast"
import { useSessionTimeout } from "@/hooks/useSessionTimeout"

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
      ? "bg-[#004DFF] text-white shadow-lg shadow-blue-200 dark:shadow-none"
      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
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

// ---- Mini Trend Chart ----

function MiniTrendChart({ data, color }: { data: any[], color: string }) {
  return (
    <div className="h-16 w-full opacity-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#color${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminDashboard() {
  useSessionTimeout()
  const { adminProfile, loading, error } = useAdminProfile()
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [counts, setCounts] = useState({
    users: 0,
    doctors: 0,
    pharmacies: 0,
    pendingVerifications: 0,
    revenue: 0,
  })
  const [pendingDocs, setPendingDocs] = useState<any[]>([])
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [actionReason, setActionReason] = useState("")
  const [submittingAction, setSubmittingAction] = useState(false)
  
  const [isLoadingCounts, setIsLoadingCounts] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const fetchCounts = async (silent = false) => {
    if (!silent) setIsLoadingCounts(true);
    else setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || "Failed to fetch stats");
      
      const {
        allUserCount,
        doctorCount,
        pharmacyCount,
        pendingDoctors,
        pendingPharmacies,
        schedulesData,
        doctorsData
      } = json.data;

      let revenue = 0;
      if (schedulesData && doctorsData) {
        schedulesData.forEach((schedule: any) => {
          const doc = doctorsData.find((d: any) => d.id === schedule.doctor_id || d.user_profile_id === schedule.doctor_id);
          if (doc && doc.consultation_fee) {
            revenue += doc.consultation_fee;
          }
        });
      }

      const totalPending = (pendingDoctors?.length || 0) + (pendingPharmacies?.length || 0);

      setCounts({
        users: allUserCount || 0,
        doctors: doctorCount || 0,
        pharmacies: pharmacyCount || 0,
        pendingVerifications: totalPending,
        revenue: revenue,
      })
      
      const combinedPending = [
        ...(pendingDoctors || []).map((d: any) => ({ ...d, accountType: 'doctor' })),
        ...(pendingPharmacies || []).map((p: any) => ({ ...p, accountType: 'pharmacy' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPendingDocs(combinedPending)
    } catch (err) {
      console.error("Error fetching counts:", err)
    } finally {
      setIsLoadingCounts(false);
      setIsRefreshing(false);
    }
  }

  // Fetch real counts on mount
  useEffect(() => {
    fetchCounts()
  }, [])

  const mockTrendData = [
    { name: "Mon", value: 30 },
    { name: "Tue", value: 45 },
    { name: "Wed", value: 35 },
    { name: "Thu", value: 60 },
    { name: "Fri", value: 55 },
    { name: "Sat", value: 80 },
    { name: "Sun", value: 75 },
  ]

  const stats = [
    {
      title: "Total Users",
      value: isLoadingCounts ? "..." : counts.users.toLocaleString(),
      change: "+12% trend",
      icon: Users,
      color: "#004DFF",
      data: mockTrendData,
    },
    {
      title: "Active Doctors",
      value: isLoadingCounts ? "..." : counts.doctors.toLocaleString(),
      change: "+8% trend",
      icon: Stethoscope,
      color: "#10B981",
      data: [
        { name: "Mon", value: 20 },
        { name: "Tue", value: 25 },
        { name: "Wed", value: 40 },
        { name: "Thu", value: 35 },
        { name: "Fri", value: 50 },
        { name: "Sat", value: 45 },
        { name: "Sun", value: 60 },
      ],
    },
    {
      title: "Platform Revenue",
      value: isLoadingCounts ? "..." : `$${counts.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+23% trend",
      icon: DollarSign,
      color: "#8B5CF6",
      data: [
        { name: "Mon", value: 10 },
        { name: "Tue", value: 20 },
        { name: "Wed", value: 15 },
        { name: "Thu", value: 40 },
        { name: "Fri", value: 35 },
        { name: "Sat", value: 60 },
        { name: "Sun", value: 90 },
      ],
    },
    {
      title: "System Health",
      value: "99.9%",
      change: "Optimal uptime",
      icon: Activity,
      color: "#EC4899",
      data: [
        { name: "Mon", value: 99 },
        { name: "Tue", value: 99.5 },
        { name: "Wed", value: 99.2 },
        { name: "Thu", value: 99.9 },
        { name: "Fri", value: 99.8 },
        { name: "Sat", value: 99.9 },
        { name: "Sun", value: 99.9 },
      ],
    },
  ]

  const pendingVerifications = pendingDocs.length > 0 ? pendingDocs.map((doc) => {
    if (doc.accountType === 'pharmacy') {
      const pharmDocs = [doc.license_url, doc.registration_url].filter(Boolean);
      return {
        id: doc.id,
        user_profile_id: doc.user_profile_id,
        accountType: 'pharmacy',
        name: doc.pharmacy_name || "Unknown Pharmacy",
        specialty: "Pharmacy",
        country: doc.country || "Unknown",
        submittedDate: new Date(doc.created_at).toISOString().split('T')[0],
        documents: pharmDocs,
        status: doc.verification_status || "pending",
        avatar: doc.profile_image || "/placeholder.svg?height=40&width=40",
        raw_data: doc,
      }
    }
    
    const docDocs = [doc.medical_license_url, ...(doc.certifications || [])].filter(Boolean);
    return {
      id: doc.id,
      user_profile_id: doc.user_profile_id,
      accountType: 'doctor',
      name: `Dr. ${doc.first_name} ${doc.last_name}`,
      specialty: doc.specialization || "General Practice",
      country: doc.country || "Unknown",
      submittedDate: new Date(doc.created_at).toISOString().split('T')[0],
      documents: docDocs,
      status: doc.verification_status || "pending",
      avatar: doc.profile_image || "/placeholder.svg?height=40&width=40",
      raw_data: doc,
    }
  }) : [
    {
      id: "empty",
      accountType: "none",
      name: "No pending verifications",
      specialty: "-",
      country: "-",
      submittedDate: "-",
      documents: [],
      status: "approved",
      avatar: "/placeholder.svg?height=40&width=40",
      raw_data: null,
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: "doctor_verified",
      message: "Dr. John Smith has been verified and approved",
      timestamp: "2 hours ago",
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      id: 2,
      type: "payment_processed",
      message: "Payment of 2.5 SOL processed for consultation #12847",
      timestamp: "4 hours ago",
      icon: DollarSign,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      id: 3,
      type: "security_alert",
      message: "Unusual login activity detected from IP 192.168.1.1",
      timestamp: "6 hours ago",
      icon: AlertTriangle,
      color: "text-rose-500",
      bgColor: "bg-rose-50 dark:bg-rose-500/10",
    },
    {
      id: 4,
      type: "user_registered",
      message: "New patient registration: Emma Wilson",
      timestamp: "8 hours ago",
      icon: Users,
      color: "text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-500/10",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
      case "under_review": return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
      case "approved": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
      case "rejected": return "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400"
    }
  }

  const handleVerificationAction = async (action: 'approve' | 'reject') => {
    if (!selectedVerification) return;
    if (action === 'reject' && !actionReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    
    setSubmittingAction(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedVerification.user_profile_id,
          profileId: selectedVerification.id,
          role: selectedVerification.accountType,
          action,
          reason: actionReason
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process verification.");
      
      toast({
        title: action === 'approve' ? "Approved" : "Rejected",
        description: `Successfully ${action}d ${selectedVerification.name}.`
      });
      
      // Update local state to remove the processed verification
      setPendingDocs(prev => prev.filter(doc => doc.id !== selectedVerification.id));
      setCounts(prev => ({ ...prev, pendingVerifications: Math.max(0, prev.pendingVerifications - 1) }));
      
      setReviewModalOpen(false);
      setSelectedVerification(null);
      setActionReason("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingAction(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-8 max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => window.location.href = "/signin"} className="bg-[#004DFF]">
            Return to Sign In
          </Button>
        </div>
      </div>
    )
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
        <div className="p-6 flex items-center gap-2">
          <Image src="/telehealthlogo.svg" alt="Logo" width={32} height={32} />
          <span className="text-xl text-[#004DFF] font-bold tracking-tight">EpochAdmin</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem
            icon={LayoutDashboard}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <SidebarItem
            icon={Shield}
            label="Verifications"
            active={activeTab === "verifications"}
            onClick={() => setActiveTab("verifications")}
          />
          <SidebarItem
            icon={Users}
            label="User Management"
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <SidebarItem
            icon={Globe}
            label="System Health"
            active={activeTab === "system"}
            onClick={() => setActiveTab("system")}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={adminProfile?.profile_image} />
                <AvatarFallback className="bg-blue-100 text-[#004DFF] font-bold">
                  {getAdminInitials(adminProfile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{adminProfile?.full_name || "Admin"}</p>
                <p className="text-xs text-slate-500 truncate">{adminProfile?.role || "System Admin"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <button 
                onClick={() => supabase.auth.signOut().then(() => window.location.href = "/signin")}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
               >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <Menu size={20} className="text-slate-500" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search users, records..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm w-64 outline-none focus:ring-2 focus:ring-[#004DFF]/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationDropdown userId={adminProfile?.id || ""} />
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">System Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time platform metrics and management console.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <Badge variant="outline" className="text-[10px] border-emerald-100 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10">
                    {stat.change}
                  </Badge>
                </div>
                <div className="mb-4">
                  <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <MiniTrendChart data={stat.data} color={stat.color} />
              </motion.div>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-700 w-full justify-start rounded-none h-auto p-0 gap-8">
              <TabsTrigger value="overview" className="data-[state=active]:border-[#004DFF] data-[state=active]:text-[#004DFF] border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent font-bold transition-all">Overview</TabsTrigger>
              <TabsTrigger value="verifications" className="data-[state=active]:border-[#004DFF] data-[state=active]:text-[#004DFF] border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent font-bold transition-all">Verifications</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:border-[#004DFF] data-[state=active]:text-[#004DFF] border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent font-bold transition-all">Users</TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:border-[#004DFF] data-[state=active]:text-[#004DFF] border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent font-bold transition-all">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 rounded-2xl border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                  <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                       <Activity className="text-[#004DFF]" size={18} />
                       Recent Platform Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <div className={`p-2 rounded-xl ${activity.bgColor} ${activity.color}`}>
                             <activity.icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
                          </div>
                          <button className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                      <Button variant="ghost" className="w-full text-[#004DFF] font-bold text-sm">View Security Audit Log</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  <Card className="rounded-2xl border-slate-100 dark:border-slate-700 shadow-sm bg-gradient-to-br from-[#004DFF] to-blue-700 text-white border-none overflow-hidden">
                    <CardContent className="p-6 relative">
                       <div className="relative z-10">
                         <h3 className="font-bold text-lg mb-2">Blockchain Node Status</h3>
                         <div className="flex items-center gap-2 mb-4">
                           <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                           <span className="text-sm opacity-90 font-medium">Solana Devnet: Syncing</span>
                         </div>
                         <p className="text-sm opacity-80 mb-6 font-medium leading-relaxed">System is processing patient records and prescriptions with high integrity.</p>
                         <Button className="bg-white text-[#004DFF] hover:bg-slate-100 font-bold border-none">Node Monitor</Button>
                       </div>
                       <Shield className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-slate-100 dark:border-slate-700 shadow-sm">
                    <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                      <CardTitle className="text-base font-bold">Quick Reports</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-between font-bold rounded-xl h-11">
                          Monthly Growth <PieChart className="text-slate-400" size={16} />
                        </Button>
                        <Button variant="outline" className="w-full justify-between font-bold rounded-xl h-11">
                          Revenue breakdown <DollarSign className="text-slate-400" size={16} />
                        </Button>
                        <Button variant="outline" className="w-full justify-between font-bold rounded-xl h-11">
                          User Engagement <Users className="text-slate-400" size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="verifications" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input placeholder="Search pending verifications..." className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full md:w-48 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => fetchCounts(true)}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors disabled:opacity-50 text-sm shrink-0"
                >
                  <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="space-y-4">
                {pendingVerifications.map((verification, index) => (
                  <motion.div
                    key={verification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="rounded-2xl border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-14 h-14 border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                              <AvatarImage src={verification.avatar} />
                              <AvatarFallback className="bg-blue-50 text-[#004DFF] font-bold">
                                {verification.name.split(" ").map((n: string) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-lg">{verification.name}</h3>
                              <p className="text-sm font-medium text-slate-500">{verification.specialty} • {verification.country}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Activity size={12} /> {verification.documents?.length || 0} Docs
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Search size={12} /> {verification.submittedDate}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-auto">
                             <Badge className={`px-3 py-1 font-bold ${getStatusColor(verification.status)}`}>
                               {verification.status.replace("_", " ").toUpperCase()}
                             </Badge>
                             <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700 mx-2 hidden md:block" />
                             {verification.id !== "empty" && (
                               <Button 
                                 variant="outline" 
                                 className="rounded-xl font-bold h-10 px-4 mt-0"
                                 onClick={() => {
                                   setSelectedVerification(verification);
                                   setActionReason("");
                                   setReviewModalOpen(true);
                                 }}
                               >
                                 Review
                               </Button>
                             )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users">
               <Card className="rounded-2xl border-slate-100 dark:border-slate-700 shadow-sm">
                 <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="p-6 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 mb-6">
                       <Users className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">User Registry</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">Access and manage all platform participants including Patients, Doctors, and Pharmacies.</p>
                    <Button className="bg-[#004DFF] hover:bg-blue-700 text-white rounded-xl font-bold h-11 px-8">Load Directory</Button>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="system">
               <div className="grid md:grid-cols-2 gap-6">
                 <Card className="rounded-2xl border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Shield className="text-emerald-500" size={18} /> Platform Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                           <span className="text-sm font-bold">2FA Enforcement</span>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">ACTIVE</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                           <span className="text-sm font-bold">IP Lockdown</span>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">ACTIVE</Badge>
                      </div>
                    </CardContent>
                 </Card>

                 <Card className="rounded-2xl border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Activity className="text-[#004DFF]" size={18} /> Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-500">API Response Time</span>
                          <span className="text-[#004DFF]">142ms</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="w-[85%] h-full bg-[#004DFF] rounded-full" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-500">Database Load</span>
                          <span className="text-emerald-500">22%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="w-[22%] h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                    </CardContent>
                 </Card>
               </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Verification Review Modal */}
        {reviewModalOpen && selectedVerification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="text-[#004DFF]" size={20} />
                  Review {selectedVerification.accountType === 'doctor' ? 'Doctor' : 'Pharmacy'} Application
                </h2>
                <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-slate-100 dark:border-slate-700">
                    <AvatarImage src={selectedVerification.avatar} />
                    <AvatarFallback className="bg-blue-50 text-[#004DFF] font-bold text-xl">
                      {selectedVerification.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedVerification.name}</h3>
                    <p className="text-slate-500 font-medium">{selectedVerification.specialty} • {selectedVerification.country}</p>
                    <Badge className="mt-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      ID: {selectedVerification.id.split('-')[0]}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* General Info */}
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">Registration Details</h4>
                    {selectedVerification.accountType === 'doctor' ? (
                      <>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"><span className="text-slate-500">License #</span><span className="font-medium">{selectedVerification.raw_data?.license_number || 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"><span className="text-slate-500">Experience</span><span className="font-medium">{selectedVerification.raw_data?.years_of_experience || 0} Years</span></div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"><span className="text-slate-500">Consultation Fee</span><span className="font-medium">${selectedVerification.raw_data?.consultation_fee || '0'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Education</span><span className="font-medium truncate max-w-[150px]">{selectedVerification.raw_data?.education || 'N/A'}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"><span className="text-slate-500">License #</span><span className="font-medium">{selectedVerification.raw_data?.license_number || 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"><span className="text-slate-500">City</span><span className="font-medium">{selectedVerification.raw_data?.city || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Operating Hours</span><span className="font-medium">See Schedule</span></div>
                      </>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">Uploaded Documents</h4>
                    {selectedVerification.documents && selectedVerification.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedVerification.documents.map((doc: string, idx: number) => (
                          <a key={idx} href={doc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#004DFF] transition-colors group">
                            <Download size={16} className="text-slate-400 group-hover:text-[#004DFF]" />
                            <span className="text-sm font-medium truncate flex-1">{doc.split('/').pop() || `Document ${idx+1}`}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 italic">No documents uploaded.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Bio / Description</h4>
                  <p className="text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
                    {selectedVerification.raw_data?.bio || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rejection Reason (if rejecting)</label>
                  <textarea 
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="E.g., Document upload is unclear, or consultation fee is abnormally high..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#004DFF]/20 min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setReviewModalOpen(false)}
                  disabled={submittingAction}
                  className="rounded-xl font-bold h-11"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleVerificationAction('reject')}
                  disabled={submittingAction}
                  className="rounded-xl font-bold h-11 bg-rose-500 hover:bg-rose-600 text-white border-none"
                >
                  {submittingAction ? "Processing..." : "Reject Application"}
                </Button>
                <Button 
                  onClick={() => handleVerificationAction('approve')}
                  disabled={submittingAction}
                  className="rounded-xl font-bold h-11 bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                >
                  {submittingAction ? "Processing..." : "Approve Application"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}
