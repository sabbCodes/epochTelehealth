"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/signin");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">Email Verified Successfully!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Thank you for verifying your email address. You&apos;ll be redirected to the sign-in page shortly.
        </p>
        <div className="pt-4">
          <Button onClick={() => router.push("/signin")}>
            Go to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
