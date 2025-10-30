"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, Star, MapPin, Clock, Calendar, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchDoctors, getDoctorSpecialties } from "@/lib/doctors"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { formatName } from "@/lib/utils"

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  years_of_experience: number;
  consultation_fee: number | null;
  profile_image: string | null;
  city: string | null;
  country: string | null;
  languages: string[] | null;
  rating?: number;
  reviews_count?: number;
  name?: string;
  location?: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChatbot, setShowChatbot] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    {
      type: "bot",
      message:
        "Hi! I'm your AI health assistant. Tell me about your symptoms and I'll suggest the right specialist for you.",
    },
  ])
  const [currentMessage, setCurrentMessage] = useState("")

  // Fetch doctors and apply filters
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [doctorsData, specialtiesData] = await Promise.all([
          fetchDoctors({ searchQuery, specialty: selectedSpecialty }),
          getDoctorSpecialties(),
        ]);
        
        // Set specialties from the fetched data
        if (specialtiesData) {
          setSpecialties(specialtiesData);
        }
        
        // Transform the data to include computed properties
        const transformedDoctors = doctorsData.map(doctor => ({
          ...doctor,
          name: `${doctor.first_name} ${doctor.last_name}`,
          location: [doctor.city, doctor.country].filter(Boolean).join(', ')
        }));
        setDoctors(transformedDoctors);
        
        setError(null);
      } catch (error) {
        console.error("Error loading data:", error);
        setError('Failed to load doctors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Add debounce to search
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSpecialty, specialties.length]);
  
  // Format experience text
  const getExperienceText = (years: number | undefined) => {
    if (!years) return 'Experience not specified';
    return years === 1 ? `${years} year experience` : `${years} years experience`;
  }

  const sendMessage = () => {
    if (!currentMessage.trim()) return

    const newMessages = [
      ...chatMessages,
      { type: "user", message: currentMessage },
      {
        type: "bot",
        message:
          "Based on your symptoms, I recommend consulting with a Cardiologist. Dr. Adaora Okafor is highly rated and available now.",
      },
    ]

    setChatMessages(newMessages)
    setCurrentMessage("")
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-6 max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find a Doctor</h1>
              <p className="text-gray-600 dark:text-gray-300">Book an appointment with our specialists</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setShowChatbot(true)}
                className="gap-2"
              >
                <Bot className="w-4 h-4" />
                AI Triage
              </Button>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, specialty, or condition..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 text-gray-500 mr-2" />
                  <SelectValue placeholder="Filter by specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : doctors && doctors.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
              <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No doctors found</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
                          <AvatarImage 
                            src={doctor.profile_image || "/placeholder.svg"} 
                            alt={`${formatName(doctor.first_name)} ${formatName(doctor.last_name)}`} 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                            {`${formatName(doctor.first_name?.[0] || '')}${formatName(doctor.last_name?.[0] || '')}`}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 w-full">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              Dr. {formatName(doctor.first_name)} {formatName(doctor.last_name)}
                            </h3>
                          </div>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {doctor.specialization}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
                              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                {doctor.rating?.toFixed(1)}
                              </span>
                              <span className="text-xs text-amber-600 dark:text-amber-300 ml-1">
                                ({doctor.reviews_count} reviews)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ml-auto">
                        Verified
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {(doctor.city || doctor.country) && (
                      <div className="flex items-start text-gray-600 dark:text-gray-300">
                        <MapPin className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm">
                            {[doctor.city, doctor.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start text-gray-600 dark:text-gray-300">
                      <Clock className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm">
                          {getExperienceText(doctor.years_of_experience)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Consultation Fee
                        </span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {doctor.consultation_fee} USDC
                        </span>
                      </div>
                    </div>

                    {doctor.languages && doctor.languages.length > 0 && (
                      <div className="pt-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Speaks {doctor.languages.length} language{doctor.languages.length > 1 ? 's' : ''}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {doctor.languages.slice(0, 4).map((lang) => (
                            <Badge 
                              key={lang} 
                              variant="outline" 
                              className="text-xs bg-white dark:bg-gray-800 border-blue-100 dark:border-gray-700"
                            >
                              {lang}
                            </Badge>
                          ))}
                          {doctor.languages.length > 4 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-white dark:bg-gray-800 border-blue-100 dark:border-gray-700"
                            >
                              +{doctor.languages.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="border-t pt-4">
                    <Link href={`/schedule?doctorId=${doctor.id}`} className="w-full">
                      <Button size="sm" className="w-full gap-2 bg-blue-600 hover:bg-blue-700 outline-none">
                        <Calendar className="w-4 h-4" />
                        Schedule Appointment
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* AI Chatbot Modal */}
      <AnimatePresence>
        {showChatbot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowChatbot(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md h-96 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Health Assistant</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowChatbot(false)}>
                  ×
                </Button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Describe your symptoms..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button onClick={sendMessage}>Send</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
