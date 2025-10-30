// "use client"

// import { useState, useEffect } from "react"
// import { motion } from "framer-motion"
// import { Clock, AlertCircle, CheckCircle, DollarSign } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Progress } from "@/components/ui/progress"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// interface ConsultationTimerProps {
//   duration: number // in minutes
//   rate: number // in SOL per minute
//   onComplete?: () => void
//   onExtend?: (minutes: number) => void
//   onReleaseFunds?: (amount: number) => void
// }

// export function ConsultationTimer({
//   duration = 30,
//   rate = 0.01,
//   onComplete,
//   onExtend,
//   onReleaseFunds,
// }: ConsultationTimerProps) {
//   const [timeRemaining, setTimeRemaining] = useState(duration * 60) // convert to seconds
//   const [isActive, setIsActive] = useState(false)
//   const [showExtendDialog, setShowExtendDialog] = useState(false)
//   const [showCompleteDialog, setShowCompleteDialog] = useState(false)
//   const [isCompleted, setIsCompleted] = useState(false)

//   const totalCost = duration * rate
//   const elapsedTime = duration * 60 - timeRemaining
//   const elapsedCost = (elapsedTime / 60) * rate

//   useEffect(() => {
//     let interval: NodeJS.Timeout | null = null

//     if (isActive && timeRemaining > 0) {
//       interval = setInterval(() => {
//         setTimeRemaining((time) => {
//           if (time <= 1) {
//             setIsActive(false)
//             setShowCompleteDialog(true)
//             return 0
//           }
//           return time - 1
//         })
//       }, 1000)
//     } else if (timeRemaining === 0 && !isCompleted) {
//       setShowCompleteDialog(true)
//     }

//     return () => {
//       if (interval) clearInterval(interval)
//     }
//   }, [isActive, timeRemaining, isCompleted])

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60)
//     const secs = seconds % 60
//     return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
//   }

//   const getProgressPercentage = () => {
//     return ((duration * 60 - timeRemaining) / (duration * 60)) * 100
//   }

//   const getStatusColor = () => {
//     if (timeRemaining <= 300) return "text-red-600" // 5 minutes or less
//     if (timeRemaining <= 600) return "text-yellow-600" // 10 minutes or less
//     return "text-green-600"
//   }

//   const handleStart = () => {
//     setIsActive(true)
//   }

//   const handlePause = () => {
//     setIsActive(false)
//   }

//   const handleExtend = (minutes: number) => {
//     setTimeRemaining((prev) => prev + minutes * 60)
//     setShowExtendDialog(false)
//     if (onExtend) {
//       onExtend(minutes)
//     }
//   }

//   const handleComplete = () => {
//     setIsActive(false)
//     setIsCompleted(true)
//     setShowCompleteDialog(false)

//     if (onReleaseFunds) {
//       onReleaseFunds(elapsedCost)
//     }

//     if (onComplete) {
//       onComplete()
//     }
//   }

//   return (
//     <>
//       <Card className="w-full">
//         <CardContent className="p-4">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center space-x-2">
//               <Clock className="w-5 h-5 text-blue-600" />
//               <span className="font-medium">Consultation Timer</span>
//             </div>
//             <div className="text-sm text-gray-600 dark:text-gray-300">Rate: {rate} SOL/min</div>
//           </div>

//           <div className="text-center mb-4">
//             <div className={`text-3xl font-bold ${getStatusColor()}`}>{formatTime(timeRemaining)}</div>
//             <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
//               {isCompleted ? "Consultation Completed" : isActive ? "Active" : "Paused"}
//             </div>
//           </div>

//           <Progress value={getProgressPercentage()} className="mb-4" />

//           <div className="grid grid-cols-2 gap-4 text-sm mb-4">
//             <div className="text-center">
//               <div className="font-medium text-gray-900 dark:text-white">{elapsedCost.toFixed(3)} SOL</div>
//               <div className="text-gray-600 dark:text-gray-300">Elapsed Cost</div>
//             </div>
//             <div className="text-center">
//               <div className="font-medium text-gray-900 dark:text-white">{totalCost.toFixed(3)} SOL</div>
//               <div className="text-gray-600 dark:text-gray-300">Total Budget</div>
//             </div>
//           </div>

//           {!isCompleted && (
//             <div className="flex space-x-2">
//               {!isActive ? (
//                 <Button onClick={handleStart} className="flex-1">
//                   Start Timer
//                 </Button>
//               ) : (
//                 <Button onClick={handlePause} variant="outline" className="flex-1">
//                   Pause Timer
//                 </Button>
//               )}

//               <Button onClick={() => setShowExtendDialog(true)} variant="outline" disabled={timeRemaining === 0}>
//                 Extend
//               </Button>

//               <Button
//                 onClick={() => setShowCompleteDialog(true)}
//                 variant="outline"
//                 className="text-green-600 border-green-600 hover:bg-green-50"
//               >
//                 Complete
//               </Button>
//             </div>
//           )}

//           {isCompleted && (
//             <div className="text-center">
//               <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
//                 <CheckCircle className="w-5 h-5" />
//                 <span className="font-medium">Consultation Completed</span>
//               </div>
//               <div className="text-sm text-gray-600 dark:text-gray-300">
//                 Funds released: {elapsedCost.toFixed(3)} SOL
//               </div>
//             </div>
//           )}

//           {timeRemaining <= 300 && timeRemaining > 0 && !isCompleted && (
//             <motion.div
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md flex items-center space-x-2"
//             >
//               <AlertCircle className="w-4 h-4 text-red-600" />
//               <span className="text-sm text-red-800 dark:text-red-300">Less than 5 minutes remaining!</span>
//             </motion.div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Extend Time Dialog */}
//       <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Extend Consultation</DialogTitle>
//           </DialogHeader>
//           <div className="py-4">
//             <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
//               How many additional minutes would you like to add?
//             </p>
//             <div className="grid grid-cols-3 gap-2">
//               {[5, 10, 15].map((minutes) => (
//                 <Button
//                   key={minutes}
//                   variant="outline"
//                   onClick={() => handleExtend(minutes)}
//                   className="flex flex-col items-center p-4"
//                 >
//                   <span className="font-medium">{minutes} min</span>
//                   <span className="text-xs text-gray-500">+{(minutes * rate).toFixed(3)} SOL</span>
//                 </Button>
//               ))}
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Complete Consultation Dialog */}
//       <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Complete Consultation</DialogTitle>
//           </DialogHeader>
//           <div className="py-4">
//             <div className="text-center mb-4">
//               <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-2" />
//               <p className="text-sm text-gray-600 dark:text-gray-300">
//                 Are you ready to complete this consultation and release the payment?
//               </p>
//             </div>

//             <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span>Consultation time:</span>
//                 <span>{Math.ceil(elapsedTime / 60)} minutes</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span>Rate:</span>
//                 <span>{rate} SOL/minute</span>
//               </div>
//               <div className="flex justify-between font-medium border-t pt-2">
//                 <span>Total amount:</span>
//                 <span>{elapsedCost.toFixed(3)} SOL</span>
//               </div>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
//               Complete & Release Payment
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }
