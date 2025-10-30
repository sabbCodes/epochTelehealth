"use client";

import { useState } from "react";
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
import { useW3s } from "@/providers/W3sProvider";
import type {
  Error as CircleError,
  ChallengeResult,
  SignMessageResult,
  SignTransactionResult,
} from "@circle-fin/w3s-pw-web-sdk/src/types";
import Image from "next/image";

export default function AccountTypeSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const email = searchParams.get("email") || "";
  const [selectedType, setSelectedType] = useState<
    "patient" | "doctor" | "pharmacy" | "admin" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

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

  const web3Services = useW3s();

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsLoading(true);

    try {
      // Get parameters from URL
      const email = searchParams.get("email") || "";

      if (!email) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please go back and try again.",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Initializing your wallet...",
        description:
          "Setting up secure wallet infrastructure for your account.",
      });

      // Step 1: Initialize wallet (create user, get tokens, setup PIN if needed)
      const initRes = await fetch("/api/wallet/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const initData = await initRes.json();

      if (!initRes.ok) {
        throw new Error(initData.error || "Failed to initialize wallet");
      }

      // Check if user already has a wallet (challengeId is null for existing users)
      if (!initData.challengeId) {
        // User already has a wallet, get the address and redirect
        toast({
          title: "Retrieving wallet address...",
          description: "Getting your existing wallet information.",
        });

        const addressRes = await fetch("/api/wallet/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const addressData = await addressRes.json();

        if (!addressRes.ok) {
          throw new Error(addressData.error || "Failed to get wallet address");
        }

        setPinLoading(false);
        setIsLoading(false);
        toast({
          title: "Account Type Selected!",
          description: "Redirecting to account setup...",
        });

        // Redirect to appropriate onboarding page with wallet info
        const onboardingRoute =
          selectedType === "pharmacy"
            ? "/onboarding/pharmacy"
            : selectedType === "doctor"
            ? "/onboarding/doctor"
            : selectedType === "admin"
            ? "/onboarding/admin"
            : "/onboarding";

        router.push(
          `${onboardingRoute}?type=${selectedType}&email=${encodeURIComponent(
            email
          )}&wallet=${encodeURIComponent(addressData.walletAddress)}`
        );
        return;
      }

      // Step 2: PIN setup with Circle SDK for new users
      setPinLoading(true);
      toast({
        title: "Setting up wallet PIN...",
        description: "Please follow the PIN setup instructions in the popup.",
      });

      web3Services.setAuthentication({
        userToken: initData.userToken,
        encryptionKey: initData.encryptionKey,
      });
      web3Services.execute(
        initData.challengeId,
        async (
          error: CircleError | undefined,
          result:
            | ChallengeResult
            | SignMessageResult
            | SignTransactionResult
            | undefined
        ) => {
          if (error) {
            if (error.code === 155706) {
              toast({
                title: "Network hiccup",
                description:
                  "If the PIN UI does not appear, please check your connection and try again.",
              });
              // Do NOT set pinLoading/isLoading to false; wait for user to complete PIN UI
              return;
            }
            setPinLoading(false);
            setIsLoading(false);
            let errMsg = "";
            if (error instanceof Error) {
              errMsg = error.message;
            } else if (typeof error === "string") {
              errMsg = error;
            } else {
              errMsg = JSON.stringify(error);
            }
            toast({
              variant: "destructive",
              title: "PIN Setup Failed",
              description:
                errMsg ||
                "There was an error setting your wallet PIN. Please try again.",
            });
            return;
          }
          if (result) {
            // Step 3: Get wallet address after PIN setup
            toast({
              title: "Retrieving wallet address...",
              description: "Getting your new wallet information.",
            });

            try {
              const addressRes = await fetch("/api/wallet/address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              const addressData = await addressRes.json();

              if (!addressRes.ok) {
                throw new Error(
                  addressData.error || "Failed to get wallet address"
                );
              }

              setPinLoading(false);
              setIsLoading(false);
              toast({
                title: "Account Type Selected!",
                description: "Redirecting to account setup...",
              });

              // Redirect to appropriate onboarding page with wallet info
              const onboardingRoute =
                selectedType === "pharmacy"
                  ? "/onboarding/pharmacy"
                  : selectedType === "doctor"
                  ? "/onboarding/doctor"
                  : selectedType === "admin"
                  ? "/onboarding/admin"
                  : "/onboarding";

              router.push(
                `${onboardingRoute}?type=${selectedType}&email=${encodeURIComponent(
                  email
                )}&wallet=${encodeURIComponent(addressData.walletAddress)}`
              );
            } catch (addressError) {
              setPinLoading(false);
              setIsLoading(false);
              toast({
                variant: "destructive",
                title: "Wallet Setup Complete",
                description: `PIN setup successful, but there was an issue retrieving your wallet address. Please contact support. ${addressError instanceof Error ? addressError.message : JSON.stringify(addressError)}`,
              });
            }
          }
        }
      );
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: `Wallet setup failed. Please try again or contact support. ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      });
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
                alt="teleHealthSol"
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
                Select how you&apos;ll be using teleHealthSol platform
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
                disabled={!selectedType || isLoading || pinLoading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8"
              >
                {isLoading || pinLoading ? (
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
      {pinLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Setting up your wallet PIN...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
