"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, AlertTriangle, DollarSign, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PaymentReleaseTimerProps {
  sessionEndTime: Date
  releaseWindowMinutes?: number
  amount: number
  onRelease?: () => void
  onAutoRelease?: () => void
}

export function PaymentReleaseTimer({
  sessionEndTime,
  releaseWindowMinutes = 30,
  amount,
  onRelease,
  onAutoRelease,
}: PaymentReleaseTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isReleased, setIsReleased] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const releaseDeadline = new Date(sessionEndTime.getTime() + releaseWindowMinutes * 60 * 1000)
      const remaining = Math.max(0, releaseDeadline.getTime() - now.getTime())
      return Math.floor(remaining / 1000)
    }

    setTimeRemaining(calculateTimeRemaining())

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      if (remaining === 0 && !isReleased) {
        // Auto-release funds
        if (onAutoRelease) {
          onAutoRelease()
        }
        setIsReleased(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionEndTime, releaseWindowMinutes, isReleased, onAutoRelease])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    const totalSeconds = releaseWindowMinutes * 60
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100
  }

  const handleManualRelease = () => {
    setIsReleased(true)
    if (onRelease) {
      onRelease()
    }
  }

  const getStatusColor = () => {
    if (timeRemaining <= 300) return "text-red-600" // 5 minutes or less
    if (timeRemaining <= 600) return "text-yellow-600" // 10 minutes or less
    return "text-green-600"
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-600" />
          <span>Payment Release Timer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!isReleased ? (
          <>
            <div className="text-center mb-6">
              <div className={`text-4xl font-bold ${getStatusColor()}`}>{formatTime(timeRemaining)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Time remaining to release payment</div>
            </div>

            <Progress value={getProgressPercentage()} className="mb-6" />

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Session ended:</span>
                <span className="text-sm font-medium">{sessionEndTime.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Amount to release:</span>
                <span className="text-sm font-medium">{amount.toFixed(3)} SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Auto-release in:</span>
                <span className="text-sm font-medium">{releaseWindowMinutes} minutes</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleManualRelease}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Release Payment Now
              </Button>

              {timeRemaining <= 300 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md flex items-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800 dark:text-red-300">
                    Payment will be auto-released in less than 5 minutes!
                  </span>
                </motion.div>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              If you don&apos;t release the payment manually, it will be automatically released to the doctor when the timer
              reaches zero.
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Payment Released</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {amount.toFixed(3)} SOL has been successfully released to the doctor.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Transaction completed at {new Date().toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
