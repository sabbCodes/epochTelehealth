"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { AuthService } from "@/lib/auth";
import Image from "next/image";

type AuthState =
  | "idle"
  | "google-signin"
  | "email-signin"
  | "signup"
  | "checking-user"
  | "redirecting";

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // General States
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("signin");

  // Check for auth callback
  useEffect(() => {
    let unsubscribe: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const handleAuthAndRedirect = async () => {
      // Check if user email is verified
      const { isVerified } = await AuthService.checkEmailVerification();

      if (!isVerified) {
        toast({
          title: "Email not verified",
          description:
            "Please check your email and click the verification link before signing in.",
          variant: "destructive",
        });
        return;
      }

      // User is authenticated and verified, check if they have a profile
      const { user: authUser } = await AuthService.getCurrentUser();

      if (authUser?.user_type) {
        // User has a profile, redirect to dashboard
        const dashboardRoute = getDashboardRoute(authUser.user_type);
        router.push(dashboardRoute);
      } else {
        // User needs to complete onboarding
        router.push(
          `/account-type-selection?email=${encodeURIComponent(
            authUser?.email || ""
          )}`
        );
      }
    };

    const init = async () => {
      const { supabase } = await import("@/lib/supabase");

      // Check current session (Supabase may have already exchanged the OAuth code and removed params from URL)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await handleAuthAndRedirect();
      }

      // Also listen for auth state changes to catch OAuth sign-in completion
      unsubscribe = supabase.auth.onAuthStateChange(async (event) => {
        if (event === "SIGNED_IN") {
          await handleAuthAndRedirect();
        }
      }) as unknown as { data: { subscription: { unsubscribe: () => void } } };
    };

    init();

    return () => {
      try {
        unsubscribe?.data.subscription.unsubscribe();
      } catch (e) {
        // ignore
        console.error("Failed to unsubscribe from auth state changes:", e);
      }
    };
  }, [router, toast]);

  const getDashboardRoute = (userType: string) => {
    switch (userType) {
      case "doctor":
        return "/doctor-dashboard";
      case "pharmacy":
        return "/pharmacy-dashboard";
      case "admin":
        return "/admin";
      default:
        return "/dashboard";
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthState("email-signin");
    setAuthError("");

    try {
      const { data, error } = await AuthService.signIn(email, password);

      if (error) {
        throw new Error(error);
      }

      if (data && data.user) {
        // Check if user email is verified
        const { isVerified } = await AuthService.checkEmailVerification();

        if (!isVerified) {
          if (toast) {
            toast({
              title: "Email not verified",
              description:
                "Please check your email and click the verification link before signing in.",
              variant: "destructive",
            });
          } else {
            alert(
              "Email not verified. Please check your email and click the verification link before signing in."
            );
          }
          setAuthState("idle");
          return;
        }

        setAuthState("redirecting");

        // Check if user has a profile
        const { user } = await AuthService.getCurrentUser();

        if (user?.user_type) {
          // User has a profile, redirect to dashboard
          const dashboardRoute = getDashboardRoute(user.user_type);

          // Show dashboard redirection message
          if (toast) {
            toast({
              title: "Welcome back!",
              description: `Redirecting to your ${user.user_type} dashboard...`,
            });
          }

          router.push(dashboardRoute);
        } else {
          // User needs to complete onboarding
          if (toast) {
            toast({
              title: "Account setup required",
              description: "Please complete your account setup to continue.",
            });
          }

          router.push(
            `/account-type-selection?email=${encodeURIComponent(email)}`
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sign in failed. Please try again.";
      setAuthError(errorMessage);
      if (toast) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: errorMessage,
        });
      } else {
        alert(`Sign in failed: ${errorMessage}`);
      }
      setAuthState("idle");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !confirmPassword) return;

    if (signupPassword !== confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    if (signupPassword.length < 6) {
      setAuthError("Password must be at least 6 characters");
      return;
    }

    setAuthState("signup");
    setAuthError("");

    try {
      const { data, error } = await AuthService.signUp(
        signupEmail,
        signupPassword
      );

      if (error) {
        throw new Error(error);
      }

      if (data && data.user) {
        if (toast) {
          toast({
            title: "Account created successfully!",
            description: (
              <div className="space-y-2">
                <p>
                  We&apos;ve sent a verification email to{" "}
                  <strong>{signupEmail}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your email and click the verification link to
                  activate your account.
                </p>
              </div>
            ),
            duration: 8000,
          });
        } else {
          alert(
            `Account created successfully! We have sent a verification email to ${signupEmail}. Please check your email and click the verification link to activate your account.`
          );
        }

        // Clear form and show verification message
        setSignupEmail("");
        setSignupPassword("");
        setConfirmPassword("");
        setAuthState("idle");

        // Delay tab switch to allow toast/alert to show
        setTimeout(() => {
          setActiveTab("signin");
        }, 500);
      } else {
        alert("Signup failed: No user returned.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sign up failed. Please try again.";
      setAuthError(errorMessage);
      if (toast) {
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: errorMessage,
        });
      } else {
        alert(`Sign up failed: ${errorMessage}`);
      }
      setAuthState("idle");
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthState("google-signin");
    setAuthError("");

    try {
      const { error } = await AuthService.signInWithGoogle();

      if (error) {
        throw new Error(error);
      }

      // Google OAuth will redirect to the callback URL
      // The callback will be handled in the useEffect above
    } catch (error) {
      const errorMessage = `Google sign in failed. Please try again., ${error}`;
      setAuthError(errorMessage);
      if (toast) {
        toast({
          variant: "destructive",
          title: "Google sign in failed",
          description: errorMessage,
        });
      } else {
        alert(`Google sign in failed: ${errorMessage}`);
      }
      setAuthState("idle");
    }
  };

  const getStateMessage = () => {
    switch (authState) {
      case "google-signin":
        return "Signing in with Google...";
      case "email-signin":
        return "Signing you in...";
      case "signup":
        return "Creating your account...";
      case "checking-user":
        return "Checking your account...";
      case "redirecting":
        return "Redirecting...";
      default:
        return "";
    }
  };

  const isProcessing = authState !== "idle";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-green-400 to-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-2xl"></div>
      </div>

      {/* Back to Home Button - Fixed Position */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-50"
      >
        <Link href="/">
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
        <div className="w-full max-w-md">
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
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Processing Status */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: "auto" }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-800 dark:text-blue-300">
                          {getStateMessage()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 overflow-hidden"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="text-sm text-red-700 dark:text-red-400">
                        {authError}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Google Sign In */}
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isProcessing}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600 relative"
                >
                  {authState === "google-signin" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                {/* Sign In / Sign Up Tabs */}
                <Tabs
                  defaultValue="signin"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  {/* Sign In Form */}
                  <TabsContent value="signin">
                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white relative"
                        disabled={isProcessing || !email || !password}
                      >
                        {authState === "email-signin" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        Sign In
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Sign Up Form */}
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white relative"
                        disabled={
                          isProcessing ||
                          !signupEmail ||
                          !signupPassword ||
                          !confirmPassword
                        }
                      >
                        {authState === "signup" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Secure authentication with Supabase</span>
                  </div>
                  <p className="text-xs">Your data is encrypted and secure</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400"
          >
            <p>
              By signing in, you agree to our{" "}
              <Link
                href="/terms"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
