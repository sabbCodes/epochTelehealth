"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the recovery token as a hash fragment.
  // We listen for the PASSWORD_RECOVERY event to confirm the session is ready.
  useEffect(() => {
    const init = async () => {
      const { supabase } = await import("@/lib/supabase");

      // Check if there's already an active recovery session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
        return;
      }

      // Listen for the PASSWORD_RECOVERY auth event
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      });
    };

    init();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setDone(true);
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });

      setTimeout(() => router.push("/signin"), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update password. Please try again.";
      setError(msg);
      toast({ variant: "destructive", title: "Reset failed", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#004DFF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-[#CCDBFF]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-6 left-6 z-50">
        <Link href="/signin">
          <Button variant="ghost" size="sm" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Sign In
          </Button>
        </Link>
      </motion.div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link href="/">
            <Image src="/telehealthlogowithtext.svg" alt="Epoch Telehealth" width={150} height={40} className="h-8 w-auto mx-auto" />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-1 pb-4">
              <div className="w-12 h-12 bg-[#004DFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6 text-[#004DFF]" />
              </div>
              <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
              <CardDescription>Choose a strong password for your account</CardDescription>
            </CardHeader>

            <CardContent>
              {done ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">Password updated!</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting you to sign in&hellip;</p>
                </div>
              ) : !sessionReady ? (
                <div className="text-center space-y-4 py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-[#004DFF] mx-auto" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Verifying your reset link&hellip;</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    If this takes too long, your link may have expired.{" "}
                    <Link href="/signin" className="text-[#004DFF] hover:underline">Request a new one</Link>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirm-new-password"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password strength hints */}
                  {password.length > 0 && (
                    <div className="space-y-1">
                      {[
                        { label: "At least 8 characters", met: password.length >= 8 },
                        { label: "Contains a number", met: /\d/.test(password) },
                        { label: "Contains a letter", met: /[a-zA-Z]/.test(password) },
                      ].map((hint) => (
                        <div key={hint.label} className={`flex items-center gap-2 text-xs ${hint.met ? "text-green-600" : "text-slate-400"}`}>
                          <CheckCircle className={`w-3 h-3 ${hint.met ? "opacity-100" : "opacity-30"}`} />
                          {hint.label}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-[#004DFF] hover:bg-[#003bbd] text-white" disabled={loading || !password || !confirmPassword}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
