"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Users,
  Stethoscope,
  TrendingUp,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Download,
  BarChart3,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const stats = [
    {
      title: "Total Users",
      value: "12,847",
      change: "+12% from last month",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Active Doctors",
      value: "2,543",
      change: "+8% from last month",
      icon: Stethoscope,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Monthly Revenue",
      value: "145.7 SOL",
      change: "+23% from last month",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Platform Health",
      value: "99.9%",
      change: "Uptime this month",
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
    },
  ]

  const pendingVerifications = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
      country: "Nigeria",
      submittedDate: "2024-01-15",
      documents: ["Medical License", "Degree Certificate", "ID"],
      status: "pending",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Dr. Ahmed Hassan",
      specialty: "Pediatrics",
      country: "Egypt",
      submittedDate: "2024-01-14",
      documents: ["Medical License", "Degree Certificate"],
      status: "under_review",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Dr. Maria Santos",
      specialty: "Dermatology",
      country: "Brazil",
      submittedDate: "2024-01-13",
      documents: ["Medical License", "Degree Certificate", "ID", "Hospital Affiliation"],
      status: "pending",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "doctor_verified",
      message: "Dr. John Smith has been verified and approved",
      timestamp: "2 hours ago",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "payment_processed",
      message: "Payment of 2.5 SOL processed for consultation #12847",
      timestamp: "4 hours ago",
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "security_alert",
      message: "Unusual login activity detected from IP 192.168.1.1",
      timestamp: "6 hours ago",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      id: 4,
      type: "user_registered",
      message: "New patient registration: Emma Wilson",
      timestamp: "8 hours ago",
      icon: Users,
      color: "text-purple-600",
    },
  ]

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      title: "High Server Load",
      message: "Server load is at 85%. Consider scaling resources.",
      timestamp: "1 hour ago",
    },
    {
      id: 2,
      type: "info",
      title: "Scheduled Maintenance",
      message: "System maintenance scheduled for tomorrow 2:00 AM UTC.",
      timestamp: "3 hours ago",
    },
    {
      id: 3,
      type: "error",
      title: "Payment Gateway Issue",
      message: "Temporary issue with Solana payment processing resolved.",
      timestamp: "5 hours ago",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "under_review":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20"
      case "warning":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
      case "info":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20"
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-900/20"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">teleHealthSol Platform Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-600" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700`}
                        >
                          <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* System Alerts */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                      System Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {systemAlerts.map((alert) => (
                      <div key={alert.id} className={`p-3 border-l-4 rounded-r ${getAlertColor(alert.type)}`}>
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search pending verifications..."
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {pendingVerifications.map((verification, index) => (
                <motion.div
                  key={verification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={verification.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {verification.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{verification.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {verification.specialty} • {verification.country}
                            </p>
                            <p className="text-xs text-gray-500">Submitted: {verification.submittedDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <Badge className={getStatusColor(verification.status)}>
                              {verification.status.replace("_", " ")}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{verification.documents.length} documents</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Submitted Documents:</h4>
                        <div className="flex flex-wrap gap-2">
                          {verification.documents.map((doc, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Management</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Comprehensive user management interface will be implemented here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-600" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Server Status</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Database</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Blockchain</span>
                    <Badge className="bg-green-100 text-green-800">Synced</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">IPFS</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Response Time</span>
                    <span className="text-sm font-medium">&lt; 200ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Uptime</span>
                    <span className="text-sm font-medium">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Active Users</span>
                    <span className="text-sm font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Transactions/Hour</span>
                    <span className="text-sm font-medium">156</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
