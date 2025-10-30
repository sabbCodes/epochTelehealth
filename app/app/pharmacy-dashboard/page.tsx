"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Pill,
  Package,
  Truck,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  Plus,
  MoreHorizontal,
  MapPin,
  Phone,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PharmacyDashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("today")
  const [searchQuery, setSearchQuery] = useState("")
  const [orderFilter, setOrderFilter] = useState("all")

  // Mock data
  const stats = [
    {
      title: "Total Orders",
      value: "156",
      change: "+12%",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Revenue",
      value: "$2,847",
      change: "+8%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Pending Deliveries",
      value: "23",
      change: "-5%",
      icon: Truck,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Active Customers",
      value: "89",
      change: "+15%",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ]

  const recentOrders = [
    {
      id: "ORD-001",
      customer: "Sarah Johnson",
      medication: "Amoxicillin 500mg",
      quantity: "30 tablets",
      amount: "$24.99",
      status: "pending",
      time: "2 hours ago",
      address: "123 Main St, Downtown",
      phone: "+1 (555) 123-4567",
    },
    {
      id: "ORD-002",
      customer: "Michael Chen",
      medication: "Lisinopril 10mg",
      quantity: "90 tablets",
      amount: "$18.50",
      status: "preparing",
      time: "4 hours ago",
      address: "456 Oak Ave, Midtown",
      phone: "+1 (555) 987-6543",
    },
    {
      id: "ORD-003",
      customer: "Emily Davis",
      medication: "Metformin 500mg",
      quantity: "60 tablets",
      amount: "$12.75",
      status: "delivered",
      time: "6 hours ago",
      address: "789 Pine St, Uptown",
      phone: "+1 (555) 456-7890",
    },
    {
      id: "ORD-004",
      customer: "David Wilson",
      medication: "Atorvastatin 20mg",
      quantity: "30 tablets",
      amount: "$32.40",
      status: "cancelled",
      time: "8 hours ago",
      address: "321 Elm St, Westside",
      phone: "+1 (555) 234-5678",
    },
  ]

  const lowStockItems = [
    { name: "Ibuprofen 200mg", current: 45, minimum: 100, supplier: "MedSupply Co." },
    { name: "Acetaminophen 500mg", current: 23, minimum: 50, supplier: "PharmaCorp" },
    { name: "Aspirin 81mg", current: 12, minimum: 75, supplier: "HealthDist" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />
      case "preparing":
        return <Package className="w-3 h-3" />
      case "delivered":
        return <CheckCircle className="w-3 h-3" />
      case "cancelled":
        return <XCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const filteredOrders = recentOrders.filter((order) => {
    const matchesSearch =
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = orderFilter === "all" || order.status === orderFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">MediCare Pharmacy</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Dashboard</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>MP</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className={`text-sm ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                        {stat.change} from yesterday
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Orders Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Recent Orders</span>
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Order
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={orderFilter} onValueChange={setOrderFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <Pill className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{order.customer}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{order.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong>Medication:</strong> {order.medication}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong>Quantity:</strong> {order.quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-300 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {order.address}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{order.amount}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{order.time}</span>
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>Low Stock Alert</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Current: {item.current} | Min: {item.minimum}
                      </p>
                      <p className="text-xs text-gray-500">{item.supplier}</p>
                      <Button size="sm" className="mt-2">
                        Reorder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Medication
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    Manage Inventory
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Truck className="w-4 h-4 mr-2" />
                    Delivery Routes
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Today's Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Store Opens</span>
                    <span className="text-sm font-medium">9:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Delivery Window</span>
                    <span className="text-sm font-medium">10:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Store Closes</span>
                    <span className="text-sm font-medium">8:00 PM</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Scheduled Deliveries</span>
                      <span className="text-sm font-medium text-blue-600">12 pending</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
