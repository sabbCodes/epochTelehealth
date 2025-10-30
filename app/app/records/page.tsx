"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  Shield,
  Clock,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function RecordsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null)

  const medicalRecords = [
    {
      id: 1,
      title: "Cardiology Consultation",
      date: "2024-01-15",
      doctor: "Dr. Adaora Okafor",
      type: "Consultation",
      status: "Completed",
      ipfsHash: "QmX7Y8Z9A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T",
      blockchainTx: "5KJh9GYtFr4EdcVgb2nHs8Lm1Qw3Er5Ty7Ui9Op0As2Df4Gh6Jk8Lm",
      summary:
        "Patient presents with chest discomfort. ECG shows normal sinus rhythm. Recommended lifestyle modifications.",
      prescriptions: ["Aspirin 81mg daily", "Lifestyle modifications"],
      followUp: "2 weeks",
    },
    {
      id: 2,
      title: "Blood Test Results",
      date: "2024-01-13",
      doctor: "Dr. Adaora Okafor",
      type: "Lab Report",
      status: "Completed",
      ipfsHash: "QmA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W",
      blockchainTx: "3Gh6Jk8LmQw3Er5Ty7Ui9Op0As2Df4KJh9GYtFr4EdcVgb2nHs8L",
      summary: "Complete blood count and lipid panel results within normal ranges.",
      results: {
        Cholesterol: "180 mg/dL (Normal)",
        HDL: "45 mg/dL (Normal)",
        LDL: "110 mg/dL (Normal)",
        Triglycerides: "150 mg/dL (Normal)",
      },
    },
    {
      id: 3,
      title: "Dermatology Consultation",
      date: "2024-01-10",
      doctor: "Dr. Kemi Adebayo",
      type: "Consultation",
      status: "Completed",
      ipfsHash: "QmB2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X",
      blockchainTx: "4Df4Gh6Jk8LmQw3Er5Ty7Ui9Op0As2KJh9GYtFr4EdcVgb2nHs",
      summary: "Routine skin examination. Minor acne treatment prescribed.",
      prescriptions: ["Benzoyl peroxide 2.5%", "Moisturizer with SPF 30"],
      followUp: "3 months",
    },
  ]

  const recordTypes = ["All Types", "Consultation", "Lab Report", "Prescription", "Imaging"]

  const toggleRecord = (id: number) => {
    setExpandedRecord(expandedRecord === id ? null : id)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Consultation":
        return "bg-blue-100 text-blue-800"
      case "Lab Report":
        return "bg-green-100 text-green-800"
      case "Prescription":
        return "bg-purple-100 text-purple-800"
      case "Imaging":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Records</h1>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800">
                <Shield className="w-3 h-3 mr-1" />
                Blockchain Secured
              </Badge>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search records, doctors, or conditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Record Type" />
              </SelectTrigger>
              <SelectContent>
                {recordTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase().replace(" ", "-")}>
                    {type}
                  </SelectItem>
                ))}
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
        {/* Timeline View */}
        <div className="space-y-4">
          {medicalRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Collapsible open={expandedRecord === record.id} onOpenChange={() => toggleRecord(record.id)}>
                <Card className="hover:shadow-md transition-shadow">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{record.title}</CardTitle>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(record.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <User className="w-4 h-4 mr-1" />
                                {record.doctor}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(record.type)}>{record.type}</Badge>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {record.status}
                          </Badge>
                          <ChevronDown
                            className={`w-5 h-5 transition-transform ${
                              expandedRecord === record.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Record Details */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">{record.summary}</p>
                          </div>

                          {record.prescriptions && (
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Prescriptions</h4>
                              <ul className="space-y-1">
                                {record.prescriptions.map((prescription, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                                    {prescription}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {record.results && (
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Results</h4>
                              <div className="space-y-2">
                                {Object.entries(record.results).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">{key}:</span>
                                    <span className="font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {record.followUp && (
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Follow-up</h4>
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Clock className="w-4 h-4 mr-2" />
                                {record.followUp}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Blockchain Info */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                              <Shield className="w-4 h-4 mr-2 text-green-600" />
                              Blockchain Verification
                            </h4>

                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">IPFS Hash:</span>
                                <div className="flex items-center justify-between mt-1">
                                  <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                    {record.ipfsHash.substring(0, 20)}...
                                  </code>
                                  <Button size="sm" variant="ghost">
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Transaction:</span>
                                <div className="flex items-center justify-between mt-1">
                                  <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                    {record.blockchainTx.substring(0, 20)}...
                                  </code>
                                  <Button size="sm" variant="ghost">
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 pt-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-green-600 text-xs">Verified on Solana</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-2">
                            <Button className="w-full" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Record
                            </Button>
                            <Button className="w-full" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                            <Button className="w-full" variant="outline">
                              <Hash className="w-4 h-4 mr-2" />
                              Verify on IPFS
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
