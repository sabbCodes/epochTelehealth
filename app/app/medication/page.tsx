"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Pill, MapPin, Clock, Truck, Plus, Search, ShoppingCart, Star, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MedicationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [cart, setCart] = useState<any[]>([])

  const prescriptions = [
    {
      id: 1,
      name: "Aspirin 81mg",
      dosage: "Once daily",
      prescribedBy: "Dr. Adaora Okafor",
      date: "2024-01-15",
      refills: 2,
      status: "Active",
    },
    {
      id: 2,
      name: "Benzoyl Peroxide 2.5%",
      dosage: "Twice daily",
      prescribedBy: "Dr. Kemi Adebayo",
      date: "2024-01-10",
      refills: 1,
      status: "Active",
    },
  ]

  const pharmacies = [
    {
      id: 1,
      name: "HealthPlus Pharmacy",
      location: "Victoria Island, Lagos",
      distance: "2.3 km",
      rating: 4.8,
      deliveryTime: "30-45 min",
      deliveryFee: "₦500",
      verified: true,
      medications: [
        { name: "Aspirin 81mg", price: "₦1,200", inStock: true },
        { name: "Benzoyl Peroxide 2.5%", price: "₦2,500", inStock: true },
      ],
    },
    {
      id: 2,
      name: "MedPlus Pharmacy",
      location: "Ikoyi, Lagos",
      distance: "3.1 km",
      rating: 4.6,
      deliveryTime: "45-60 min",
      deliveryFee: "₦700",
      verified: true,
      medications: [
        { name: "Aspirin 81mg", price: "₦1,150", inStock: true },
        { name: "Benzoyl Peroxide 2.5%", price: "₦2,300", inStock: false },
      ],
    },
  ]

  const addToCart = (pharmacy: any, medication: any) => {
    const cartItem = {
      id: Date.now(),
      pharmacy: pharmacy.name,
      medication: medication.name,
      price: medication.price,
      quantity: 1,
    }
    setCart([...cart, cartItem])
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medication Delivery</h1>
            <Button className="relative">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">{cart.length}</Badge>
              )}
            </Button>
          </div>

          {/* Search and Location */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Enter delivery address"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-10 w-full md:w-64"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Prescriptions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-blue-600" />
                    Active Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{prescription.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {prescription.dosage} • Prescribed by {prescription.prescribedBy}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>Date: {prescription.date}</span>
                          <span>Refills: {prescription.refills}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">{prescription.status}</Badge>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Order
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Nearby Pharmacies */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-green-600" />
                    Nearby Pharmacies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pharmacies.map((pharmacy) => (
                    <div key={pharmacy.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{pharmacy.name}</h3>
                            {pharmacy.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {pharmacy.location} • {pharmacy.distance}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">{pharmacy.rating}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                              <Clock className="w-4 h-4 mr-1" />
                              {pharmacy.deliveryTime}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                              <Truck className="w-4 h-4 mr-1" />
                              {pharmacy.deliveryFee}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Available Medications</h4>
                        {pharmacy.medications.map((medication, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{medication.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{medication.price}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {medication.inStock ? (
                                <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Out of Stock
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                disabled={!medication.inStock}
                                onClick={() => addToCart(pharmacy, medication)}
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Delivery Info Sidebar */}
          <div className="space-y-6">
            {/* Delivery Status */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-orange-600" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Truck className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast & Secure Delivery</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get your medications delivered to your doorstep within 30-60 minutes
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Delivery Time:</span>
                      <span className="font-medium">30-60 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Delivery Fee:</span>
                      <span className="font-medium">₦500 - ₦1,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Payment:</span>
                      <span className="font-medium">SOL/Crypto</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Safety Notice */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-amber-600">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Safety Notice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    • Only order medications prescribed by licensed doctors
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">• Verify pharmacy credentials before ordering</p>
                  <p className="text-gray-600 dark:text-gray-300">• Check medication expiry dates upon delivery</p>
                  <p className="text-gray-600 dark:text-gray-300">• Report any issues immediately</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
