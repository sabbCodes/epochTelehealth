"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Users,
  Search,
  Filter,
  Eye,
  MessageCircle,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DoctorPatients() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null)

  const patients = [
    {
      id: 1,
      name: "John Doe",
      age: 45,
      gender: "Male",
      email: "john.doe@email.com",
      phone: "+234 801 234 5678",
      location: "Lagos, Nigeria",
      avatar: "/placeholder.svg?height=40&width=40",
      lastVisit: "2 days ago",
      nextAppointment: "Tomorrow 10:00 AM",
      condition: "Hypertension",
      status: "Active",
      riskLevel: "Medium",
      consultations: 12,
      medicalHistory: ["Hypertension", "Type 2 Diabetes"],
      currentMedications: ["Lisinopril 10mg", "Metformin 500mg"],
      allergies: ["Penicillin"],
      vitals: {
        bloodPressure: "140/90",
        heartRate: "78 bpm",
        temperature: "98.6°F",
        weight: "85 kg",
      },
    },
    {
      id: 2,
      name: "Sarah Johnson",
      age: 32,
      gender: "Female",
      email: "sarah.j@email.com",
      phone: "+234 802 345 6789",
      location: "Abuja, Nigeria",
      avatar: "/placeholder.svg?height=40&width=40",
      lastVisit: "1 week ago",
      nextAppointment: "Next week",
      condition: "Anxiety Disorder",
      status: "Active",
      riskLevel: "Low",
      consultations: 8,
      medicalHistory: ["Anxiety Disorder", "Migraine"],
      currentMedications: ["Sertraline 50mg", "Sumatriptan 100mg"],
      allergies: ["None known"],
      vitals: {
        bloodPressure: "120/80",
        heartRate: "72 bpm",
        temperature: "98.4°F",
        weight: "65 kg",
      },
    },
    {
      id: 3,
      name: "Michael Chen",
      age: 28,
      gender: "Male",
      email: "m.chen@email.com",
      phone: "+234 803 456 7890",
      location: "Port Harcourt, Nigeria",
      avatar: "/placeholder.svg?height=40&width=40",
      lastVisit: "3 days ago",
      nextAppointment: "Friday 2:00 PM",
      condition: "Asthma",
      status: "Active",
      riskLevel: "Low",
      consultations: 5,
      medicalHistory: ["Asthma", "Seasonal Allergies"],
      currentMedications: ["Albuterol Inhaler", "Fluticasone"],
      allergies: ["Dust mites", "Pollen"],
      vitals: {
        bloodPressure: "118/75",
        heartRate: "68 bpm",
        temperature: "98.2°F",
        weight: "72 kg",
      },
    },
  ]

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || patient.status.toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  const selectedPatientData = patients.find((p) => p.id === selectedPatient)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Records</h1>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800">{filteredPatients.length} Patients</Badge>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Patients</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {filteredPatients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedPatient(patient.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 ${
                        selectedPatient === patient.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={patient.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{patient.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{patient.condition}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getRiskColor(patient.riskLevel)} variant="outline">
                              {patient.riskLevel} Risk
                            </Badge>
                            <span className="text-xs text-gray-500">{patient.lastVisit}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatientData ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {/* Patient Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={selectedPatientData.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-lg">
                            {selectedPatientData.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedPatientData.name}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-300">
                            {selectedPatientData.age} years old • {selectedPatientData.gender}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className={getRiskColor(selectedPatientData.riskLevel)}>
                              {selectedPatientData.riskLevel} Risk
                            </Badge>
                            <Badge variant="outline">{selectedPatientData.status}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button size="sm">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="w-4 h-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="history">Medical History</TabsTrigger>
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                    <TabsTrigger value="records">Records</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Contact Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{selectedPatientData.email}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{selectedPatientData.phone}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{selectedPatientData.location}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Appointment Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Appointments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Last Visit:</span>
                            <span className="text-sm font-medium">{selectedPatientData.lastVisit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Next Appointment:</span>
                            <span className="text-sm font-medium">{selectedPatientData.nextAppointment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Total Consultations:</span>
                            <span className="text-sm font-medium">{selectedPatientData.consultations}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Current Medications */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Current Medications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedPatientData.currentMedications.map((medication, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                            >
                              <span className="text-sm">{medication}</span>
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="history">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Medical History</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Conditions</h4>
                          <div className="space-y-2">
                            {selectedPatientData.medicalHistory.map((condition, index) => (
                              <Badge key={index} variant="outline" className="mr-2">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Allergies</h4>
                          <div className="space-y-2">
                            {selectedPatientData.allergies.map((allergy, index) => (
                              <Badge key={index} variant="outline" className="mr-2 bg-red-50 text-red-700">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="vitals">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Latest Vitals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">Blood Pressure</p>
                            <p className="font-semibold">{selectedPatientData.vitals.bloodPressure}</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">Heart Rate</p>
                            <p className="font-semibold">{selectedPatientData.vitals.heartRate}</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Temperature</p>
                            <p className="font-semibold">{selectedPatientData.vitals.temperature}</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Weight</p>
                            <p className="font-semibold">{selectedPatientData.vitals.weight}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="records">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Medical Records</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Medical Records</h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            Patient medical records and documents will be displayed here
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Patient</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Choose a patient from the list to view their detailed information
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
