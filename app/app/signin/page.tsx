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
  KeyRound,
  Eye,
  EyeOff,
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  // True while waiting for the Google OAuth exchange to complete
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleAuthAndRedirect = async () => {
    const { isVerified } = await AuthService.checkEmailVerification();

    if (!isVerified) {
      setIsOAuthLoading(false);
      toast({
        title: "Email not verified",
        description:
          "Please check your email and click the verification link before signing in.",
        variant: "destructive",
      });
      return;
    }

    const { user: authUser } = await AuthService.getCurrentUser();

    if (!authUser?.user_type) {
      // No role set yet — send to account-type-selection
      router.push(
        `/account-type-selection?email=${encodeURIComponent(
          authUser?.email || ""
        )}`
      );
      return;
    }

    // Role is set — check if the role-specific profile row exists
    const { data: roleProfile } = await AuthService.checkRoleProfile(
      authUser.id,
      authUser.user_type
    );

    if (roleProfile) {
      // Profile complete → go to dashboard
      router.push(getDashboardRoute(authUser.user_type));
    } else {
      // Role set but onboarding not completed → send to onboarding
      router.push(
        `/onboarding/${authUser.user_type}?email=${encodeURIComponent(
          authUser.email
        )}`
      );
    }
  };

  // ── OAuth detection via sessionStorage (immune to URL cleanup) ────────────
  // We set 'epoch_oauth_pending' BEFORE redirecting to Google, so when we
  // return to /signin the flag still exists — even after Supabase clears
  // ?code= from the URL synchronously during client init.
  useEffect(() => {
    const OAUTH_KEY = "epoch_oauth_pending";
    const isOAuthCallback = sessionStorage.getItem(OAUTH_KEY) === "true";

    // Show loader immediately if we're returning from Google
    if (isOAuthCallback) {
      setIsOAuthLoading(true);
    }

    let unsubscribe: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let oauthTimeoutId: ReturnType<typeof setTimeout>;

    const init = async () => {
      const { supabase } = await import("@/lib/supabase");

      if (isOAuthCallback) {
        // Safety timeout — if the exchange hasn't completed in 12 seconds,
        // clear the flag and show an error so the user isn't stuck forever.
        oauthTimeoutId = setTimeout(() => {
          sessionStorage.removeItem(OAUTH_KEY);
          setIsOAuthLoading(false);
          setAuthError(
            "Google sign in timed out. Please try again."
          );
        }, 12000);

        // Set up listener BEFORE getSession() to avoid missing the SIGNED_IN event
        unsubscribe = supabase.auth.onAuthStateChange(async (event) => {
          if (event === "SIGNED_IN") {
            clearTimeout(oauthTimeoutId);
            sessionStorage.removeItem(OAUTH_KEY);
            await handleAuthAndRedirect();
          }
        }) as unknown as { data: { subscription: { unsubscribe: () => void } } };

        // getSession() triggers / awaits the PKCE code exchange.
        // If the session is already available, redirect right away.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          clearTimeout(oauthTimeoutId);
          sessionStorage.removeItem(OAUTH_KEY);
          await handleAuthAndRedirect();
        }
      } else {
        // Regular /signin visit — sign out any stale session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
          localStorage.removeItem("epoch_session_login_at");
        }

        // Listen for email sign-in
        unsubscribe = supabase.auth.onAuthStateChange(async (event) => {
          if (event === "SIGNED_IN") {
            const initiated = (window as typeof window & { __epochLoginInitiated?: boolean }).__epochLoginInitiated;
            if (initiated) {
              (window as typeof window & { __epochLoginInitiated?: boolean }).__epochLoginInitiated = false;
              await handleAuthAndRedirect();
            }
          }
        }) as unknown as { data: { subscription: { unsubscribe: () => void } } };
      }
    };

    init();

    return () => {
      clearTimeout(oauthTimeoutId);
      try {
        unsubscribe?.data.subscription.unsubscribe();
      } catch (e) {
        console.error("Failed to unsubscribe from auth state changes:", e);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const { error } = await AuthService.resetPassword(forgotEmail);
      if (error) throw new Error(error);
      setForgotSent(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    // Mark that the user explicitly initiated login on this page
    (window as typeof window & { __epochLoginInitiated?: boolean }).__epochLoginInitiated = true;

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

        if (!user?.user_type) {
          // No role set — go to account-type-selection
          toast({
            title: "Account setup required",
            description: "Please select your account type to continue.",
          });
          router.push(
            `/account-type-selection?email=${encodeURIComponent(email)}`
          );
          return;
        }

        // Role set — check if the role-specific profile row exists
        const { data: roleProfile } = await AuthService.checkRoleProfile(
          user.id,
          user.user_type
        );

        if (roleProfile) {
          // Profile complete → welcome back + redirect to dashboard
          const dashboardRoute = getDashboardRoute(user.user_type);
          if (user.user_type === "doctor") {
            toast({ title: "Welcome back Doctor!", description: "Redirecting to your dashboard..." });
          } else if (user.user_type === "pharmacy") {
            toast({ title: "Welcome back Pharmacy!", description: "Redirecting to your dashboard..." });
          } else if (user.user_type === "admin") {
            toast({ title: "Welcome back Admin!", description: "Redirecting to your dashboard..." });
          } else {
            toast({ title: "Welcome back!", description: "Redirecting to your dashboard..." });
          }
          router.push(dashboardRoute);
        } else {
          // Role set but onboarding not completed → send to onboarding
          toast({
            title: "Complete your profile",
            description: "Please finish setting up your account to continue.",
          });
          router.push(
            `/onboarding/${user.user_type}?email=${encodeURIComponent(email)}`
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
    // Persist OAuth intent across the Google redirect.
    // sessionStorage survives the round-trip but is cleared on tab close.
    sessionStorage.setItem("epoch_oauth_pending", "true");

    try {
      const { error } = await AuthService.signInWithGoogle();

      if (error) {
        // If we couldn't even start the OAuth flow, clear the flag
        sessionStorage.removeItem("epoch_oauth_pending");
        throw new Error(error);
      }
      // Page will redirect to Google — nothing more to do here
    } catch (error) {
      sessionStorage.removeItem("epoch_oauth_pending");
      const errorMessage = error instanceof Error
        ? `Google sign in failed: ${error.message}`
        : "Google sign in failed. Please try again.";
      setAuthError(errorMessage);
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: errorMessage,
      });
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

  if (isOAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-green-400 to-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-2xl"></div>
        </div>
        
        <div className="z-10 flex flex-col items-center bg-white/50 dark:bg-slate-800/50 p-8 rounded-2xl shadow-sm backdrop-blur-sm border border-slate-200 dark:border-slate-700">
          <Loader2 className="w-12 h-12 text-[#004DFF] animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Authenticating</h3>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-xs">
            Please wait while we complete your sign-in with Google.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
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
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
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
                alt="epochTeleHealth logo"
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
            <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
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
                    {showForgotPassword ? (
                      <div className="space-y-4">
                        {forgotSent ? (
                          <div className="text-center space-y-3 py-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-white">Check your inbox</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">We sent a password reset link to <strong>{forgotEmail}</strong></p>
                            <button
                              onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(""); }}
                              className="text-sm text-[#004DFF] hover:underline font-medium"
                            >
                              Back to Sign In
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-sm text-slate-600 dark:text-slate-400">Enter your email and we&apos;ll send you a reset link.</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="forgot-email">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                  id="forgot-email"
                                  type="email"
                                  placeholder="Enter your email"
                                  value={forgotEmail}
                                  onChange={(e) => setForgotEmail(e.target.value)}
                                  className="pl-10"
                                  required
                                />
                              </div>
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#004DFF] hover:bg-[#003bbd] text-white"
                              disabled={forgotLoading || !forgotEmail}
                            >
                              {forgotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                              Send Reset Link
                            </Button>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(false)}
                              className="w-full text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              Back to Sign In
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
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
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-[#004DFF] hover:underline font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#004DFF] hover:bg-[#003bbd] text-white"
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
                    )}
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
                            type={showSignupPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
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
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#004DFF] hover:bg-[#003bbd] text-white"
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
                  <p className="text-xs">
                    By signing in you agree to our{" "}
                    <Link href="/terms" className="text-[#004DFF] hover:underline font-medium">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-[#004DFF] hover:underline font-medium">Privacy Policy</Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
