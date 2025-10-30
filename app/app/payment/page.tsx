"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, Clock, CheckCircle, Star, Wallet, FileText, Download, ArrowLeft, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export default function PaymentPage() {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)

  const consultationDetails = {
    doctor: "Dr. Adaora Okafor",
    specialty: "Cardiologist",
    date: "Today",
    duration: "32:45",
    fee: "0.05 SOL",
    escrowAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setPaymentComplete(true)
    }, 3000)
  }

  const handleRating = (value: number) => {
    setRating(value)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Consultation Complete</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Consultation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="/placeholder.svg?height=64&width=64" />
                      <AvatarFallback>AO</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{consultationDetails.doctor}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{consultationDetails.specialty}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {consultationDetails.duration}
                        </span>
                        <span>{consultationDetails.date}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Consultation Type:</span>
                      <p className="font-medium">Video Call</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Status:</span>
                      <Badge className="ml-2 bg-green-100 text-green-800">Completed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Rate & Review */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Rate Your Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      How was your consultation with {consultationDetails.doctor}?
                    </p>
                    <div className="flex justify-center space-x-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRating(star)}
                          className={`w-8 h-8 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                        >
                          <Star className="w-full h-full fill-current" />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Share your experience (optional)"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Medical Records */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Consultation Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Diagnosis & Recommendations</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Patient presents with chest discomfort. ECG shows normal sinus rhythm. Recommended lifestyle
                      modifications and follow-up in 2 weeks.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Stored on IPFS</span>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>IPFS Hash: QmX7Y8Z9A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T</p>
                    <p>Blockchain TX: 5KJh9GYtFr4EdcVgb2nHs8Lm1Qw3Er5Ty7Ui9Op0As2Df4Gh6Jk8Lm</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Payment Sidebar */}
          <div className="space-y-6">
            {/* Payment Details */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-green-600" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Release Timer */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                        Payment Release Timer
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 mb-1">09:45</div>
                    <p className="text-xs text-orange-700 dark:text-orange-400">
                      Please release payment within 10 minutes or it will be automatically released.
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Consultation Fee:</span>
                    <span className="font-semibold">{consultationDetails.fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Platform Fee:</span>
                    <span className="font-semibold">0.005 SOL</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>0.055 SOL</span>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Escrow Protection</span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Payment is held in escrow and released to the doctor only after consultation completion.
                    </p>
                  </div>

                  {!paymentComplete ? (
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                      onClick={handlePayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Release Payment
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                      >
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      </motion.div>
                      <p className="text-green-600 font-semibold">Payment Complete!</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Transaction confirmed on Solana</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Steps */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Follow prescribed treatment</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Take medications as prescribed and monitor symptoms
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Schedule follow-up</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Book your next appointment in 2 weeks</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Download records</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Save consultation notes to your device</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
