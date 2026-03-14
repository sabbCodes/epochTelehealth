"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Shield, Clock, CheckCircle, Star, Wallet, FileText, Download, ArrowLeft, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

function PaymentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const aptId = searchParams?.get("appointmentId")
  const { toast } = useToast()

  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [schedule, setSchedule] = useState<any>(null)
  const [doctor, setDoctor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!aptId) {
      setLoading(false)
      return
    }

    const fetchDetails = async () => {
      try {
        const { data: sch } = await supabase
          .from("schedules")
          .select("*")
          .eq("id", aptId)
          .single()

        if (sch) {
          setSchedule(sch)
          
          const { data: docData } = await supabase
            .from("doctor_profiles")
            .select("*")
            .eq("id", sch.doctor_id)
            .single()

          if (docData) setDoctor(docData)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [aptId])

  const handlePayment = async () => {
    setIsProcessing(true)
    // Here real Solana payment would go. Simulating for now:
    setTimeout(async () => {
      // Simulate real call
      await supabase.from("schedules").update({ status: 'completed' }).eq("id", aptId)
      setIsProcessing(false)
      setPaymentComplete(true)
      toast({ title: "Payment Successful", description: "Funds released to doctor." })
    }, 2500)
  }

  const handleRating = (value: number) => {
    setRating(value)
  }

  const submitReview = async () => {
    if (!rating) {
      toast({ title: "Rating Required", description: "Please select a star rating.", variant: "destructive" })
      return
    }
    
    setIsSubmittingReview(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        appointment_id: aptId,
        doctor_id: schedule?.doctor_id,
        patient_id: schedule?.patient_id,
        rating,
        review_text: review,
      })
      if (error) {
        console.error("Error submitting review:", error)
        toast({ title: "Failed to submit review", description: "An error occurred.", variant: "destructive" })
        return
      }
      toast({ title: "Review Submitted", description: "Thank you for sharing your experience!" })
      if (paymentComplete) {
        router.push('/dashboard')
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-[#004DFF] border-t-transparent flex items-center justify-center animate-spin rounded-full"></div>
      </div>
    )
  }

  const getFee = () => {
    if (!doctor || !schedule) return "50 USDC"
    const type = schedule.consultation_type
    
    let amount = Number(doctor.consultation_fee) || 50
    if (type === "video" && doctor.consultation_fee_30min_video) {
      amount = Number(doctor.consultation_fee_30min_video)
    } else if (type === "extended_video" && doctor.consultation_fee_60min_video) {
      amount = Number(doctor.consultation_fee_60min_video)
    } else if (type === "text" && doctor.consultation_fee_30min_chat) {
       amount = Number(doctor.consultation_fee_30min_chat)
    } else if (type === "chat" && doctor.consultation_fee_30min_chat) {
       amount = Number(doctor.consultation_fee_30min_chat)
    }

    return amount ? `${amount} USDC` : "50 USDC"
  }

  const fee = getFee()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="sm" className="mr-4 text-slate-400 hover:text-white" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Session Complete</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center text-lg font-semibold text-white mb-6">
                <CheckCircle className="w-6 h-6 mr-2 text-emerald-400" />
                Consultation Summary
              </div>
              
              <div className="flex items-center space-x-5">
                <Avatar className="w-20 h-20 border-2 border-[#004DFF]/30 ring-4 ring-[#004DFF]/10 shadow-lg shadow-[#004DFF]/20">
                  <AvatarImage src={doctor?.profile_image || "/placeholder.svg?height=80&width=80"} />
                  <AvatarFallback className="bg-slate-800 text-lg">DR</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Dr. {doctor?.first_name} {doctor?.last_name}</h3>
                  <p className="text-[#004DFF] font-medium">{doctor?.specialization || "Physician"}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-slate-400 font-medium">
                    <span className="flex items-center bg-slate-800/50 px-2 py-1 rounded-lg">
                      <Clock className="w-4 h-4 mr-1.5 text-blue-400" />
                      {schedule?.completed_at ? "Completed" : "32:45"}
                    </span>
                    <span className="bg-slate-800/50 px-2 py-1 rounded-lg">{schedule?.date || "Today"}</span>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                  <span className="text-slate-400 mb-1 block">Consultation Type</span>
                  <p className="font-semibold text-white capitalize">{schedule?.consultation_type || "Video Call"}</p>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                  <span className="text-slate-400 mb-1 block">Status</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-3 py-1">Completed</Badge>
                </div>
              </div>
            </motion.div>

            {/* Rate & Review */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Rate Your Experience</h3>
              <div className="text-center bg-slate-800/30 p-6 rounded-2xl border border-white/5 mb-4">
                <p className="text-slate-300 mb-5 font-medium">
                  How was your consultation with Dr. {doctor?.last_name}?
                </p>
                <div className="flex justify-center space-x-3 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRating(star)}
                      className={`w-10 h-10 transition-colors ${star <= rating ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-slate-600 hover:text-slate-500"}`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </motion.button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Share your experience (optional)..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="min-h-[120px] bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 rounded-2xl focus:ring-[#004DFF]/30 resize-none mb-4"
              />
              
              <Button 
                onClick={submitReview} 
                disabled={!rating || isSubmittingReview} 
                className="w-full bg-[#004DFF] hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-[#004DFF]/20"
              >
                {isSubmittingReview ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </motion.div>

            {/* Medical Records */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center text-lg font-semibold text-white mb-4">
                <FileText className="w-5 h-5 mr-2 text-[#004DFF]" />
                Consultation Records
              </div>
              <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5 mb-4">
                <h4 className="font-medium text-white mb-2">Doctor's Notes</h4>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  Notes will be encrypted and stored securely on Solana using Arcium. Please download your copy below for your personal records.
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-slate-500 font-mono">ENCRYPTED // PERMANENT</span>
                  <Button size="sm" variant="outline" className="border-white/10 bg-slate-900/50 hover:bg-slate-800 text-slate-200">
                    <Download className="w-4 h-4 mr-2 text-[#004DFF]" />
                    Download PDF
                  </Button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1.5 font-mono bg-black/20 p-3 rounded-lg">
                <p className="truncate"><span className="text-slate-400">Solana Ref:</span> 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM</p>
              </div>
            </motion.div>
          </div>

          {/* Payment Sidebar */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl sticky top-24">
              <div className="flex items-center text-lg font-semibold text-white mb-6">
                <Wallet className="w-5 h-5 mr-2 text-indigo-400" />
                Payment Release
              </div>
              
              <div className="space-y-6">
                {/* Payment Release Timer */}
                {!paymentComplete && (
                  <div className="bg-amber-950/30 rounded-2xl p-4 border border-amber-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
                    <div className="flex items-center space-x-2 mb-2 relative z-10">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-300">
                        Auto-Release Timer
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-amber-400 mb-1 tracking-tight relative z-10">09:45</div>
                    <p className="text-[11px] text-amber-500/80 relative z-10">
                      Funds in escrow will auto-release in 10 minutes unless disputed.
                    </p>
                  </div>
                )}

                <div className="space-y-3 p-4 bg-slate-800/30 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Consultation Fee</span>
                    <span className="font-semibold text-white">{fee}</span>
                  </div>
                  <div className="h-px w-full bg-white/10 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-lg">Total</span>
                    <span className="font-bold text-blue-400 text-lg">{fee}</span>
                  </div>
                </div>

                <div className="bg-[#004DFF]/10 rounded-2xl p-4 border border-[#004DFF]/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Escrow Protected</span>
                  </div>
                  <p className="text-[11px] text-blue-200/60 leading-relaxed">
                    Epoch's smart contracts hold your payment securely. Click release to transfer funds directly to Doctor's wallet.
                  </p>
                </div>

                {!paymentComplete ? (
                  <Button
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-[#004DFF] to-blue-500 hover:from-blue-600 hover:to-blue-400 shadow-[0_0_20px_rgba(0,77,255,0.4)] transition-all"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Releasing Funds...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Release Payment
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="text-center p-6 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                    >
                      <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    </motion.div>
                    <p className="text-emerald-400 text-lg font-bold tracking-tight">Payment Released</p>
                    <p className="text-[11px] text-emerald-400/60 mt-1 font-mono">TX: 8f2Jp...k9M1q</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-[#004DFF] border-t-transparent flex items-center justify-center animate-spin rounded-full"></div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  )
}
