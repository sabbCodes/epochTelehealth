"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Pill, MapPin, Clock, Truck, Plus, 
  Search, ShoppingCart, Star, CheckCircle, 
  AlertCircle, ChevronRight 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MedicationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [cart, setCart] = useState<any[]>([])

  const prescriptions = [
    {
      id: 1,
      name: "Aspirin 81mg",
      dosage: "Once daily",
      prescribedBy: "Dr. Adaora Okafor",
      date: "2024-01-15",
      refills: 2,
      status: "Active",
    },
    {
      id: 2,
      name: "Benzoyl Peroxide 2.5%",
      dosage: "Twice daily",
      prescribedBy: "Dr. Kemi Adebayo",
      date: "2024-01-10",
      refills: 1,
      status: "Active",
    },
  ]

  const pharmacies = [
    {
      id: 1,
      name: "HealthPlus Pharmacy",
      location: "Victoria Island, Lagos",
      distance: "2.3 km",
      rating: 4.8,
      deliveryTime: "30-45 min",
      deliveryFee: "₦500",
      verified: true,
      medications: [
        { name: "Aspirin 81mg", price: "₦1,200", inStock: true },
        { name: "Benzoyl Peroxide 2.5%", price: "₦2,500", inStock: true },
      ],
    },
    {
      id: 2,
      name: "MedPlus Pharmacy",
      location: "Ikoyi, Lagos",
      distance: "3.1 km",
      rating: 4.6,
      deliveryTime: "45-60 min",
      deliveryFee: "₦700",
      verified: true,
      medications: [
        { name: "Aspirin 81mg", price: "₦1,150", inStock: true },
        { name: "Benzoyl Peroxide 2.5%", price: "₦2,300", inStock: false },
      ],
    },
  ]

  const addToCart = (pharmacy: any, medication: any) => {
    const cartItem = {
      id: Date.now(),
      pharmacy: pharmacy.name,
      medication: medication.name,
      price: medication.price,
      quantity: 1,
    }
    setCart([...cart, cartItem])
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-2xl border-b border-slate-800/50 shadow-sm">
          <div className="container mx-auto px-4 py-5 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    Medication Delivery
                  </h1>
                  <p className="text-slate-400 text-sm mt-1 ml-14">Order active prescriptions to your door.</p>
                </div>
                
                {/* Mobile Cart Button */}
                <Button variant="outline" className="md:hidden relative border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-200 h-10 w-10 p-0 rounded-xl">
                  <ShoppingCart className="w-4 h-4" />
                  <AnimatePresence>
                    {cart.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full border-2 border-slate-900 shadow-lg"
                      >
                        {cart.length}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64 group">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    placeholder="Search medications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 text-white rounded-xl h-11 transition-all"
                  />
                </div>
                <div className="relative hidden md:block w-56 group">
                  <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    placeholder="Delivery address..."
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 text-white rounded-xl h-11 transition-all"
                  />
                </div>
                
                {/* Desktop Cart Button */}
                <Button className="hidden md:flex relative h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Cart</span>
                  <AnimatePresence>
                    {cart.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-emerald-500 text-[10px] font-bold rounded-full border-2 border-slate-900 shadow-lg"
                      >
                        {cart.length}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Active Prescriptions */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                  <h2 className="text-lg font-bold text-white tracking-wide">Active Prescriptions</h2>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {prescriptions.map((prescription, i) => (
                    <motion.div
                      key={prescription.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="group bg-slate-800/40 backdrop-blur-md border border-slate-700/50 hover:border-emerald-500/30 p-5 rounded-2xl transition-all shadow-xl shadow-black/10"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 group-hover:bg-emerald-500/10 transition-colors">
                          <Pill className="w-5 h-5 text-emerald-400" />
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 pointer-events-none">
                          {prescription.status}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">{prescription.name}</h3>
                      <p className="text-sm font-medium text-slate-300 mb-4">{prescription.dosage}</p>
                      
                      <div className="space-y-2 mb-5">
                        <p className="text-xs text-slate-400 flex justify-between">
                          <span>Prescriber:</span>
                          <span className="text-slate-300">{prescription.prescribedBy}</span>
                        </p>
                        <p className="text-xs text-slate-400 flex justify-between">
                          <span>Issued:</span>
                          <span className="text-slate-300">{prescription.date}</span>
                        </p>
                        <p className="text-xs text-slate-400 flex justify-between">
                          <span>Refills Left:</span>
                          <span className="text-white font-bold bg-slate-700/50 px-2 py-0.5 rounded-md">{prescription.refills}</span>
                        </p>
                      </div>
                      
                      <Button className="w-full bg-slate-700 hover:bg-emerald-600 text-white rounded-xl shadow-none transition-colors border-0 h-10">
                        <Plus className="w-4 h-4 mr-2" />
                        Find Pharmacy
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              {/* Nearby Pharmacies */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 mb-4 px-1 mt-10">
                  <div className="w-1 h-5 bg-blue-500 rounded-full" />
                  <h2 className="text-lg font-bold text-white tracking-wide">Available Pharmacies</h2>
                </div>

                <div className="space-y-4">
                  {pharmacies.map((pharmacy, i) => (
                    <motion.div 
                      key={pharmacy.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/20"
                    >
                      <div className="p-5 sm:p-6 border-b border-slate-800/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-white">{pharmacy.name}</h3>
                              {pharmacy.verified && (
                                <div className="bg-blue-500/20 p-1 rounded-full" title="Verified Pharmacy">
                                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-slate-400 gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {pharmacy.location} <span className="text-slate-600 mx-1">•</span> <strong className="text-slate-300">{pharmacy.distance}</strong>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 sm:gap-4 bg-slate-800/40 rounded-xl p-2.5 sm:px-4 self-start">
                            <div className="flex items-center flex-col sm:flex-row gap-1 sm:gap-2">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-bold text-white">{pharmacy.rating}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-700 hidden sm:block" />
                            <div className="flex items-center flex-col sm:flex-row gap-1 sm:gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-semibold text-slate-200">{pharmacy.deliveryTime}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-700 hidden sm:block" />
                            <div className="flex items-center flex-col sm:flex-row gap-1 sm:gap-2">
                              <Truck className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-semibold text-emerald-400">{pharmacy.deliveryFee}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 bg-slate-800/20 space-y-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2">Available Medications</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {pharmacy.medications.map((medication, idx) => (
                            <div
                              key={idx}
                              className="group border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/40 hover:border-blue-500/30 rounded-2xl p-4 transition-all flex flex-col justify-between min-h-[120px]"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-slate-200 group-hover:text-blue-300 transition-colors pr-2 leading-tight">
                                  {medication.name}
                                </h4>
                                {medication.inStock ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">In Stock</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 shrink-0">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Out
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-end justify-between mt-auto">
                                <p className="text-lg font-bold text-white">{medication.price}</p>
                                <Button
                                  size="sm"
                                  disabled={!medication.inStock}
                                  onClick={() => addToCart(pharmacy, medication)}
                                  className={`rounded-xl h-9 px-4 text-xs font-bold transition-all shadow-none ${
                                    medication.inStock 
                                    ? "bg-blue-600 hover:bg-blue-500 text-white" 
                                    : "bg-slate-700 text-slate-500 opacity-50"
                                  }`}
                                >
                                  {medication.inStock ? "Add to Cart" : "Unavailable"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-4 space-y-6 lg:mt-0 mt-8">
              
              {/* Delivery Status / Info */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
                <Card className="bg-gradient-to-br from-blue-900/40 to-slate-900/60 backdrop-blur-xl border-blue-800/30 rounded-3xl overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Truck className="w-32 h-32" />
                  </div>
                  <CardHeader className="pb-4 border-b border-blue-500/10">
                    <CardTitle className="flex items-center text-lg text-white">
                      <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                        <Truck className="w-5 h-5 text-blue-400" />
                      </div>
                      Delivery Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="text-center pb-2">
                      <h3 className="font-bold text-white mb-2 text-lg">Fast & Secure Delivery</h3>
                      <p className="text-sm text-blue-200/70 leading-relaxed">
                        Get your medications delivered anonymously and securely within 30-60 minutes locally.
                      </p>
                    </div>

                    <div className="space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 relative z-10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium flex items-center gap-2"><Clock size={14}/> Est. Time</span>
                        <span className="font-bold text-white">30-60 min</span>
                      </div>
                      <div className="w-full h-px bg-slate-800" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium flex items-center gap-2"><Truck size={14}/> Base Fee</span>
                        <span className="font-bold text-emerald-400">₦500 - ₦1,000</span>
                      </div>
                      <div className="w-full h-px bg-slate-800" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium flex items-center gap-2"><ShoppingCart size={14}/> Payment</span>
                        <span className="font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded-md">Crypto / Card</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Safety Notice */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
                <Card className="bg-rose-950/20 backdrop-blur-xl border border-rose-900/30 rounded-3xl overflow-hidden shadow-none">
                  <div className="p-1.5 flex bg-rose-900/10 items-center justify-center border-b border-rose-900/20">
                    <div className="w-12 h-1 bg-rose-500/20 rounded-full" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="flex items-center text-rose-400 font-bold mb-4">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Safety Notice
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-rose-400/50 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">Only order medications prescribed directly by network-verified doctors.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-rose-400/50 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">Always check the security seal upon immediate delivery.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-rose-400/50 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">If there are side effects, contact your doctor via 1-click chat.</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
