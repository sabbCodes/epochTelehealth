"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Pill,
  Package,
  Truck,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  Plus,
  MoreHorizontal,
  MapPin,
  Phone,
  Calendar,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  ClipboardList,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePharmacyProfile, getPharmacyInitials } from "@/hooks/usePharmacyProfile"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import { NotificationDropdown } from "@/components/NotificationDropdown"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
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

// ---- Order Row Component ----

function OrderRow({ order }: { order: any }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#004DFF] group-hover:scale-110 transition-transform">
          <Pill size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
             <h4 className="font-bold text-slate-900 dark:text-white capitalize">{order.customer}</h4>
             <Badge variant="outline" className="text-[10px] py-0 border-slate-200 text-slate-400">#{order.id}</Badge>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {order.medication} · <span className="text-blue-500 font-bold">{order.amount}</span>
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><Clock size={12}/> {order.time}</span>
            <span className="flex items-center gap-1"><MapPin size={12}/> {order.address.split(',')[0]}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge className={`px-3 py-1 font-bold ${
          order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10' :
          order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10' :
          'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10'
        }`}>
          {order.status.toUpperCase()}
        </Badge>
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronRight size={18} />
        </Button>
      </div>
    </motion.div>
  )
}

export default function PharmacyDashboardPage() {
  useSessionTimeout()
  const { pharmacyProfile, loading, error } = usePharmacyProfile()
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("Dashboard")
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

  const stats = [
    {
      title: "Active Orders",
      value: "156",
      change: "+12% vs yesterday",
      icon: Package,
      color: "bg-[#004DFF]",
      trend: "up",
    },
    {
      title: "Net Revenue",
      value: "₦847,200",
      change: "+8% vs yesterday",
      icon: DollarSign,
      color: "bg-emerald-500",
      trend: "up",
    },
    {
      title: "Deliveries",
      value: "23",
      change: "-5% vs yesterday",
      icon: Truck,
      color: "bg-amber-500",
      trend: "down",
    },
    {
      title: "Customers",
      value: "89",
      change: "+15% vs yesterday",
      icon: Users,
      color: "bg-violet-500",
      trend: "up",
    },
  ]

  const recentOrders = [
    {
      id: "ORD-001",
      customer: "Sarah Johnson",
      medication: "Amoxicillin 500mg",
      quantity: "30 tablets",
      amount: "₦12,499",
      status: "pending",
      time: "2 hours ago",
      address: "123 Main St, Victoria Island",
      phone: "+234 801 123 4567",
    },
    {
      id: "ORD-002",
      customer: "Michael Chen",
      medication: "Lisinopril 10mg",
      quantity: "90 tablets",
      amount: "₦8,500",
      status: "preparing",
      time: "4 hours ago",
      address: "456 Oak Ave, Ikoyi",
      phone: "+234 802 987 6543",
    },
    {
      id: "ORD-003",
      customer: "Emily Davis",
      medication: "Metformin 500mg",
      quantity: "60 tablets",
      amount: "₦5,750",
      status: "delivered",
      time: "6 hours ago",
      address: "789 Pine St, Lekki",
      phone: "+234 803 456 7890",
    },
  ]

  const lowStockItems = [
    { name: "Ibuprofen 200mg", current: 45, minimum: 100, supplier: "MedSupply Co." },
    { name: "Acetaminophen 500mg", current: 23, minimum: 50, supplier: "PharmaCorp" },
    { name: "Aspirin 81mg", current: 12, minimum: 75, supplier: "HealthDist" },
  ]

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => window.location.href = "/signin"} className="bg-[#004DFF] rounded-xl font-bold">Sign In</Button>
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
           <span className="text-xl text-[#004DFF] font-bold tracking-tight">EpochPharma</span>
           <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto">
             <X size={20} className="text-slate-400" />
           </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === "Dashboard"}
            onClick={() => setActiveTab("Dashboard")}
          />
          <SidebarItem
            icon={Package}
            label="Inventory"
            active={activeTab === "Inventory"}
            onClick={() => setActiveTab("Inventory")}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            active={activeTab === "Settings"}
            onClick={() => setActiveTab("Settings")}
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              {loading ? <Skeleton className="w-10 h-10 rounded-full" /> : (
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={pharmacyProfile?.profile_image || ""} />
                  <AvatarFallback className="bg-blue-100 text-[#004DFF] font-bold">
                    {getPharmacyInitials(pharmacyProfile?.pharmacy_name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{pharmacyProfile?.pharmacy_name || "Pharmacy"}</p>
                <p className="text-xs text-slate-500 truncate">Store Manager</p>
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
                 placeholder="Search orders, meds..."
                 className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm w-64 outline-none focus:ring-2 focus:ring-[#004DFF]/20"
               />
             </div>
           </div>
           <div className="flex items-center gap-3">
             <NotificationDropdown userId={pharmacyProfile?.user_profile_id || ""} />
           </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {activeTab === "Dashboard" && (
            <>
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pharmacy Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage medications, fulfillment, and customer deliveries.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg opacity-90`}>
                      <stat.icon size={22} />
                   </div>
                   <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stat.trend === 'up' ? '↑' : '↓'} <span>{stat.change.split(' ')[0]}</span>
                   </div>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{stat.change.split(' ').slice(1).join(' ')}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Package className="text-[#004DFF]" size={20} />
                    Current Orders
                  </h2>
                  <Button variant="ghost" className="text-[#004DFF] font-bold text-sm">View Archive</Button>
                </div>
                <div className="p-4 space-y-4">
                   {recentOrders.map((order) => (
                     <OrderRow key={order.id} order={order} />
                   ))}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 text-center">
                   <Button variant="link" className="text-slate-400 font-bold">Load more orders</Button>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 overflow-hidden shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Store className="text-[#004DFF]" size={20} />
                      Store Analytics
                    </h3>
                    <Select defaultValue="7d">
                      <SelectTrigger className="w-32 h-9 rounded-xl border-slate-200 dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 Hours</SelectItem>
                        <SelectItem value="7d">7 Days</SelectItem>
                        <SelectItem value="30d">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                    <div className="text-center grayscale opacity-50">
                      <TrendingUp size={40} className="mx-auto mb-2" />
                      <p className="text-xs font-bold">Chart Integration Pending Real Data</p>
                    </div>
                 </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <CardHeader className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertCircle size={18} />
                    Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-5">
                     {lowStockItems.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-start gap-4">
                         <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{item.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current: {item.current} · Min: {item.minimum}</p>
                         </div>
                         <Button size="sm" className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-3 border-none">Order</Button>
                       </div>
                     ))}
                   </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                  <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                   <Button variant="outline" className="w-full justify-start rounded-xl font-bold h-11 hover:bg-[#004DFF] hover:text-white hover:border-[#004DFF] transition-all group">
                     <Plus className="mr-2 group-hover:scale-110 transition-transform" size={18} /> Add New Med
                   </Button>
                   <Button variant="outline" className="w-full justify-start rounded-xl font-bold h-11 hover:bg-[#004DFF] hover:text-white hover:border-[#004DFF] transition-all group">
                     <Truck className="mr-2 group-hover:scale-110 transition-transform" size={18} /> Manage Delivery
                   </Button>
                   <Button variant="outline" className="w-full justify-start rounded-xl font-bold h-11 hover:bg-[#004DFF] hover:text-white hover:border-[#004DFF] transition-all group">
                     <Users className="mr-2 group-hover:scale-110 transition-transform" size={18} /> Customer Info
                   </Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900 text-white border-none">
                 <CardContent className="p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                       <Store size={18} className="text-blue-400" /> Web3 Pharma Chain
                    </h3>
                    <p className="text-xs text-blue-200/70 mb-6 leading-relaxed">System is syncing prescription hashes with the Solana network to ensure zero tampering.</p>
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400">
                       <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> NETWORK LIVE</span>
                       <span>v2.4.1</span>
                    </div>
                 </CardContent>
              </Card>
            </div>
          </div>
          </>
          )}

          {activeTab === "Settings" && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-6">Pharmacy Settings</h2>
              
              {pharmacyProfile?.verification_status === 'rejected' && (
                <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold mb-2">
                    <AlertCircle size={18} />
                    Application Update Required
                  </div>
                  <p className="text-sm text-rose-600 dark:text-rose-300 mb-2">
                    Your pharmacy application to join Epoch Telehealth requires updates before it can be approved.
                  </p>
                  <div className="bg-white dark:bg-rose-950 p-3 rounded-lg border border-rose-100 dark:border-rose-900 text-sm font-medium text-rose-800 dark:text-rose-200">
                    <span className="font-bold">Reason from Admin:</span> {pharmacyProfile?.rejection_reason || "Please update your pharmacy details."}
                  </div>
                </div>
              )}
              
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget;
                const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                const formData = new FormData(form)
                
                // Validate file sizes (1MB max)
                const profileImage = formData.get('profileImage');
                if (profileImage instanceof File && profileImage.size > 1 * 1024 * 1024) {
                  toast({ title: "File too large", description: "Profile picture must be less than 1MB.", variant: "destructive" });
                  return;
                }

                const pharmacyLicense = formData.get('pharmacyLicense');
                if (pharmacyLicense instanceof File && pharmacyLicense.size > 1 * 1024 * 1024) {
                  toast({ title: "File too large", description: "Pharmacy license must be less than 1MB.", variant: "destructive" });
                  return;
                }
                const businessRegistration = formData.get('businessRegistration');
                if (businessRegistration instanceof File && businessRegistration.size > 1 * 1024 * 1024) {
                  toast({ title: "File too large", description: "Business registration must be less than 1MB.", variant: "destructive" });
                  return;
                }

                formData.append('role', 'pharmacy')
                formData.append('id', pharmacyProfile?.id || '')

                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
                
                try {
                  const res = await fetch('/api/user/update-profile', {
                    method: 'POST',
                    body: formData
                  })
                  if (!res.ok) throw new Error("Failed to update profile")
                  toast({ title: "Success", description: "Profile updated successfully. Your application is now pending review." })
                  window.location.reload()
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" })
                  submitBtn.disabled = false;
                  submitBtn.textContent = pharmacyProfile?.verification_status === 'rejected' ? 'Update & Resubmit Application' : 'Save Changes';
                }
              }}>
                {/* Profile Picture */}
                <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="relative shrink-0">
                    <img
                      src={pharmacyProfile?.profile_image || `https://ui-avatars.com/api/?name=${pharmacyProfile?.pharmacy_name}&background=004DFF&color=fff`}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow"
                      id="pharmacyProfileImagePreview"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-1">Profile Picture</p>
                    <p className="text-xs text-slate-500 mb-2">Supported formats: JPEG, PNG (Max 1MB)</p>
                    <Input
                      type="file"
                      name="profileImage"
                      accept="image/jpeg,image/png"
                      className="file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const preview = document.getElementById('pharmacyProfileImagePreview') as HTMLImageElement;
                          if (preview) preview.src = URL.createObjectURL(file);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                    <Input 
                      name="phone"
                      type="tel"
                      defaultValue={pharmacyProfile?.phone || ""}
                      placeholder="+1234567890"
                      pattern="[+\d\s\-()]*"
                      onKeyDown={(e) => {
                        if (!/[\d+\s\-()]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City</label>
                    <Input name="city" defaultValue={pharmacyProfile?.city || ""} placeholder="Lagos" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Pharmacy Description / Bio</label>
                    <textarea 
                      name="bio"
                      defaultValue={pharmacyProfile?.bio || ""}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[120px]"
                      placeholder="Tell customers about your pharmacy, operating hours, etc..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Pharmacy License</label>
                    {pharmacyProfile?.verification_status === 'approved' ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Document securely stored and approved.</span>
                        {pharmacyProfile.license_url && (
                           <a href={pharmacyProfile.license_url} target="_blank" rel="noreferrer" className="text-sm text-[#004DFF] font-bold hover:underline flex items-center gap-1">
                             <Eye size={16} /> View Document
                           </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pharmacyProfile?.license_url && (
                           <a href={pharmacyProfile.license_url} target="_blank" rel="noreferrer" className="text-sm text-[#004DFF] font-bold hover:underline mb-2 flex items-center gap-1">
                             <Eye size={16} /> View Current Document
                           </a>
                        )}
                        <Input 
                          type="file" 
                          name="pharmacyLicense" 
                          accept="image/*,.pdf" 
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Business Registration Document</label>
                    {pharmacyProfile?.verification_status === 'approved' ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Document securely stored and approved.</span>
                        {pharmacyProfile.registration_url && (
                           <a href={pharmacyProfile.registration_url} target="_blank" rel="noreferrer" className="text-sm text-[#004DFF] font-bold hover:underline flex items-center gap-1">
                             <Eye size={16} /> View Document
                           </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pharmacyProfile?.registration_url && (
                           <a href={pharmacyProfile.registration_url} target="_blank" rel="noreferrer" className="text-sm text-[#004DFF] font-bold hover:underline mb-2 flex items-center gap-1">
                             <Eye size={16} /> View Current Document
                           </a>
                        )}
                        <Input 
                          type="file" 
                          name="businessRegistration" 
                          accept="image/*,.pdf" 
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-slate-500 mt-2">Upload new documents only if you need to update them. Supported formats: JPEG, PNG, PDF (Max 1MB).</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-[#004DFF] hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
                    {pharmacyProfile?.verification_status === 'rejected' ? 'Update & Resubmit Application' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
