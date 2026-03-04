"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Store,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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

  const [showWalletHelp, setShowWalletHelp] = useState(false);

  // Effect to update wallet address when it changes
  useEffect(() => {
    if (isConnected && addresses?.length > 0) {
      const solanaAddress = addresses[0]?.address;
      setWalletAddress(solanaAddress);
      setShowWalletHelp(false);
    }
  }, [addresses, isConnected]);

  // Show wallet help on first load if not connected
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem("hasSeenWalletHelp");
    if (!hasSeenHelp && !isConnected) {
      const timer = setTimeout(() => setShowWalletHelp(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const dismissWalletHelp = () => {
    setShowWalletHelp(false);
    localStorage.setItem("hasSeenWalletHelp", "true");
  };

  // Custom connect button handler
  const handleConnectWallet = () => {
    dismissWalletHelp();
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
      features: [
        "Prescription fulfillment",
        "Inventory management",
        "Delivery services",
        "USDC payments",
      ],
    },
  ];

  const handleContinue = async () => {
    if (!selectedType || !walletAddress) {
      toast({
        title: "Action Required",
        description: "Please select an account type and connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
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
    <div className="min-h-screen bg-white dark:bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Subtle Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#004DFF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#004DFF]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Area */}
      <header className="w-full relative z-50 px-6 py-6 flex items-center justify-between">
        <Link href="/signin">
          <Button
            variant="outline"
            size="sm"
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        
        {/* Wallet Button */}
        <div className="relative">
          {isConnected && walletAddress ? (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 group transition-all w-32"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 group-hover:hidden" />
              <span className="group-hover:hidden">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
              <span className="hidden group-hover:inline font-medium">Disconnect</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handleConnectWallet}
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm relative z-10"
              >
                Connect Wallet
              </Button>

              {/* Explanatory Help Popover */}
              <AnimatePresence>
                {showWalletHelp && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-4 z-50"
                  >
                    <div className="absolute -top-2 right-6 w-4 h-4 bg-white dark:bg-slate-800 border-t border-l border-slate-200 dark:border-slate-700 rotate-45" />
                    
                    <div className="relative z-10">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#004DFF] rounded-full mr-2" />
                        Wallet Required
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                        To securely manage your health identity, you need a wallet. 
                        <strong> New here?</strong> Click connect and sign in with Google to create one automatically.
                      </p>
                      <Button 
                        size="sm" 
                        onClick={dismissWalletHelp}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 h-8 text-xs"
                      >
                        Got it
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 pb-20">
        <div className="w-full max-w-5xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <Link href="/" className="inline-block">
              <Image
                src="/telehealthlogowithtext.svg"
                alt="Epoch Telehealth"
                width={180}
                height={45}
                className="h-9 w-auto mx-auto"
                priority
              />
            </Link>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Choose your account type
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Select the role that best describes how you'll use the platform.
            </p>
            {email && (
              <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-50 dark:bg-[#004DFF]/10 text-[#004DFF] rounded-full text-sm font-medium">
                Setting up for {email}
              </div>
            )}
          </motion.div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {accountTypes.map((account, index) => {
              const Icon = account.icon;
              const isSelected = selectedType === account.type;

              return (
                <motion.div
                  key={account.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card
                    onClick={() => setSelectedType(account.type)}
                    className={`relative cursor-pointer transition-all duration-300 border-2 overflow-hidden group ${
                      isSelected
                        ? "border-[#004DFF] bg-blue-50/30 dark:bg-[#004DFF]/5 shadow-md"
                        : "border-transparent border-slate-200 dark:border-slate-800 hover:border-[#004DFF]/30 hover:shadow-md bg-white dark:bg-slate-900/50"
                    }`}
                  >
                    {/* Active indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-4 right-4 text-[#004DFF]"
                        >
                          <CheckCircle2 className="w-6 h-6 fill-blue-100 dark:fill-none" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <CardHeader className="pt-8 pb-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 ${
                          isSelected
                            ? "bg-[#004DFF] text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-[#004DFF]/10 group-hover:text-[#004DFF]"
                        }`}
                      >
                        <Icon strokeWidth={2} className="w-7 h-7" />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {account.title}
                      </CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {account.description}
                      </p>
                    </CardHeader>
                    
                    <CardContent className="pt-4 pb-8">
                      <ul className="space-y-3">
                        {account.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start text-sm text-slate-600 dark:text-slate-300"
                          >
                            <span className="mr-3 text-[#004DFF] opacity-70 mt-0.5">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Continue Action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center"
          >
            <Button
              onClick={handleContinue}
              disabled={!selectedType || isLoading}
              size="lg"
              className="bg-[#004DFF] hover:bg-[#003bbd] text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none min-w-[200px]"
            >
              {isLoading ? (
                "Setting up..."
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
