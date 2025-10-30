"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Calendar,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DoctorAppointments() {
  const [selectedDate, setSelectedDate] = useState("today")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const appointments = [
    {
      id: 1,
      patient: "John Doe",
      time: "09:00 AM",
      endTime: "09:30 AM",
      type: "Video Consultation",
      condition: "Follow-up Cardiology",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "confirmed",
      duration: "30 min",
      notes: "Patient reports improved symptoms",
      fee: "0.05 SOL",
    },
    {
      id: 2,
      patient: "Sarah Johnson",
      time: "10:30 AM",
      endTime: "11:15 AM",
      type: "Video Consultation",
      condition: "Chest Pain Assessment",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "pending",
      duration: "45 min",
      notes: "First-time consultation",
      fee: "0.07 SOL",
    },
    {
      id: 3,
      patient: "Michael Chen",
      time: "02:00 PM",
      endTime: "02:30 PM",
      type: "Video Consultation",
      condition: "Routine Checkup",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "confirmed",
      duration: "30 min",
      notes: "Annual health screening",
      fee: "0.05 SOL",
    },
    {
      id: 4,
      patient: "Emma Wilson",
      time: "03:30 PM",
      endTime: "04:00 PM",
      type: "Video Consultation",
      condition: "Hypertension Management",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "completed",
      duration: "30 min",
      notes: "Medication adjustment needed",
      fee: "0.05 SOL",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <AlertCircle className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.condition.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Availability
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search patients or conditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={appointment.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {appointment.patient
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{appointment.patient}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{appointment.condition}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {appointment.time} - {appointment.endTime}
                            </span>
                            <span>{appointment.duration}</span>
                            <span>{appointment.fee}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className={`${getStatusColor(appointment.status)} flex items-center space-x-1`}>
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{appointment.status}</span>
                        </Badge>

                        <div className="flex items-center space-x-2">
                          {appointment.status === "confirmed" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Video className="w-4 h-4 mr-1" />
                                Join
                              </Button>
                              <Button size="sm" variant="outline">
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {appointment.status === "pending" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button size="sm" variant="outline">
                                <XCircle className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          {appointment.status === "completed" && (
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View Notes
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Calendar Integration</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Calendar view will be implemented with a full calendar component
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
