"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Store,
  User,
  ArrowLeft,
  ArrowRight,
  // Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import {
  usePhantom,
  useModal,
  useDisconnect,
} from "@phantom/react-sdk";

export default function AccountTypeSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const email = searchParams.get("email") || "";
  const [selectedType, setSelectedType] = useState<
    "patient" | "doctor" | "pharmacy" | "admin" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const { addresses, isConnected } = usePhantom();
  const { open } = useModal();
  const { disconnect } = useDisconnect();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Effect to update wallet address when it changes
  useEffect(() => {
    if (isConnected && addresses?.length > 0) {
      const solanaAddress = addresses[0]?.address;
      setWalletAddress(solanaAddress);
    }
  }, [addresses, isConnected]);

  // Custom connect button handler
  const handleConnectWallet = () => {
    open();
  };

  // Disconnect handler
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setWalletAddress(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const accountTypes = [
    {
      type: "patient" as const,
      title: "Patient",
      description:
        "Book appointments, consult with doctors, and manage your health records",
      icon: User,
      color: "blue",
      features: [
        "Book appointments",
        "Video consultations",
        "Health records",
        "Prescription management",
      ],
    },
    {
      type: "doctor" as const,
      title: "Doctor",
      description:
        "Provide consultations, manage patients, and grow your practice",
      icon: Stethoscope,
      color: "green",
      features: [
        "Patient management",
        "Video consultations",
        "Prescription writing",
        "Earnings dashboard",
      ],
    },
    {
      type: "pharmacy" as const,
      title: "Pharmacy",
      description:
        "Fulfill prescriptions, manage inventory, and serve patients",
      icon: Store,
      color: "purple",
      features: [
        "Prescription fulfillment",
        "Inventory management",
        "Delivery services",
        "USDC payments",
      ],
    },
    // {
    //   type: "admin" as const,
    //   title: "Admin",
    //   description: "Manage platform operations, users, and system settings",
    //   icon: Shield,
    //   color: "red",
    //   features: [
    //     "User management",
    //     "Platform monitoring",
    //     "System settings",
    //     "Analytics dashboard",
    //   ],
    // },
  ];

  const handleContinue = async () => {
    if (!selectedType || !walletAddress) {
      toast({
        title: "Error",
        description: "Please select an account type and connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      // Use the walletAddress from state
      router.push(`/onboarding/${selectedType}?walletAddress=${walletAddress}&email=${email}`);
    } catch (error) {
      console.error("Error during account type selection:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-green-400 to-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-2xl"></div>
      </div>

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-50"
      >
        <Link href="/signin">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </Link>
      </motion.div>

      {/* Connect Wallet Button */}
      <div className="fixed top-4 right-4 z-50">
        {isConnected && walletAddress ? (
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-700"
          >
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            <span className="ml-2 text-xs text-red-600 dark:text-red-400">
              Disconnect
            </span>
          </Button>
        ) : (
          <Button
            onClick={handleConnectWallet}
            variant="outline"
            size="sm"
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
          >
            Connect Wallet
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="w-full max-w-4xl">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Link href="/" className="inline-flex items-center space-x-2">
              <Image
                src="/telehealthlogowithtext.svg"
                alt="Epoch telehealth"
                width={200}
                height={50}
                className="h-12 w-auto"
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Your Account Type
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Select how you&apos;ll be using Epoch telehealth platform
              </p>
              {email && (
                <p className="text-sm text-blue-600 mt-2">
                  Setting up account for: {email}
                </p>
              )}
            </div>

            {/* Account Type Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {accountTypes.map((account, index) => {
                const Icon = account.icon;
                const isSelected = selectedType === account.type;

                return (
                  <motion.div
                    key={account.type}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        isSelected
                          ? "ring-2 ring-blue-500 shadow-lg"
                          : "hover:ring-1 hover:ring-blue-200"
                      }`}
                      onClick={() => setSelectedType(account.type)}
                    >
                      <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                          <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                              isSelected
                                ? `bg-gradient-to-r ${
                                    account.color === "blue"
                                      ? "from-blue-500 to-blue-600"
                                      : account.color === "green"
                                      ? "from-green-500 to-green-600"
                                      : account.color === "purple"
                                      ? "from-purple-500 to-purple-600"
                                      : "from-red-500 to-red-600"
                                  }`
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            <Icon
                              className={`w-8 h-8 ${
                                isSelected ? "text-white" : "text-gray-400"
                              }`}
                            />
                          </div>
                        </div>
                        <CardTitle className="text-xl">
                          {account.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {account.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {account.features.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                            >
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <Button
                onClick={handleContinue}
                disabled={!selectedType || isLoading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8"
              >
                {isLoading ? (
                  "Setting up..."
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {selectedType && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                  You selected:{" "}
                  <span className="font-semibold capitalize">
                    {selectedType}
                  </span>
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
