"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePhantom } from "@phantom/react-sdk";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, addresses } = usePhantom();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Establishing connection...");

  const returnUrl = searchParams.get("returnUrl") || "/account-type-selection";

  useEffect(() => {
    // Wait for both connection and addresses to be available
    if (isConnected && addresses && addresses.length > 0) {
      setStatus("success");
      setMessage("Connection established!");

      // Small delay to show success state
      setTimeout(() => {
        router.push(returnUrl);
      }, 2000);
    }
  }, [isConnected, addresses, router, returnUrl]);

  // Timeout after 10 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (status === "loading") {
        setStatus("error");
        setMessage("Connection timed out. Please try again.");

        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mb-8">
          {status === "loading" && (
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
          )}
          {status === "success" && (
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          )}
          {status === "error" && (
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {status === "loading" && "Connecting Wallet"}
          {status === "success" && "Connected!"}
          {status === "error" && "Connection Failed"}
        </h1>

        <p className="text-gray-600 dark:text-gray-300">{message}</p>

        {status === "error" && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => router.push("/signin")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Sign In
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
