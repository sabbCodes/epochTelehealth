"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, User, ArrowLeft, ArrowRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

export default function AdminOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const email = searchParams.get("email") || "";
  const walletAddress = searchParams.get("walletAddress") || "";

  // Lazy initializer: read localStorage synchronously on first render
  const [formData, setFormData] = useState(() => {
    const defaults = {
      firstName: "",
      lastName: "",
      phone: "",
      role: "admin",
      department: "",
    };
    if (typeof window === "undefined") return defaults;
    try {
      const saved = localStorage.getItem("epoch_admin_onboarding");
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Profile image — kept in separate state (Files can't be serialised to localStorage)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGE_SIZE = 1024 * 1024; // 1 MB

  // Save state on every change (safe — state is already hydrated from localStorage above)
  useEffect(() => {
    localStorage.setItem("epoch_admin_onboarding", JSON.stringify(formData));
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Image must be under 1 MB. Selected file is ${(file.size / 1024 / 1024).toFixed(2)} MB.`,
      });
      e.target.value = "";
      return;
    }

    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfileImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    if (errors.profileImage) {
      setErrors((prev) => ({ ...prev, profileImage: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (formData.firstName.trim().length < 2)
      newErrors.firstName = "First name must be at least 2 characters";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (formData.lastName.trim().length < 2)
      newErrors.lastName = "Last name must be at least 2 characters";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (formData.phone.trim().length < 9)
      newErrors.phone = "Phone number must be at least 9 characters";
    if (!formData.department.trim())
      newErrors.department = "Department is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", email);
      formDataToSend.append("userType", "admin");
      formDataToSend.append("walletAddress", walletAddress);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("department", formData.department);
      if (profileImageFile) {
        formDataToSend.append("profileImage", profileImageFile, profileImageFile.name);
      }

      const response = await fetch("/api/user/profile", {
        method: "POST",
        // No Content-Type header — browser sets multipart/form-data with correct boundary
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Admin Profile Created!",
          description: "Your admin account has been set up successfully.",
        });

        // Clear saved form data
        localStorage.removeItem("epoch_admin_onboarding");

        // Store email for dashboard access
        localStorage.setItem("userEmail", email);

        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to create admin profile");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create admin profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-50"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
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
                src="/telehealthlogo.svg"
                alt="Epoch telehealth logo short"
                width={48}
                height={48}
                className="h-12 w-auto md:hidden"
              />
              <Image
                src="/telehealthlogowithtext.svg"
                alt="Epoch telehealth logo"
                width={200}
                height={50}
                className="h-12 w-auto hidden md:block"
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  <div className="w-16 h-16 bg-[#004DFF] rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  Admin Account Setup
                  {saveStatus === "saving" && <span className="text-xs text-blue-500 font-normal animate-pulse">Saving...</span>}
                  {saveStatus === "saved" && <span className="text-xs text-green-500 font-normal">Saved</span>}
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300">
                  Complete your admin profile to access the platform
                </p>
                {email && (
                  <p className="text-sm text-blue-600 mt-2">
                    Setting up account for: {email}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Profile Image Upload */}
                <div className="flex flex-col items-center py-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-[#004DFF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004DFF] focus:ring-offset-2"
                    >
                      {profileImagePreview ? (
                        <Image
                          src={profileImagePreview}
                          alt="Profile preview"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Camera className="w-7 h-7 mb-1" />
                          <span className="text-xs">Upload</span>
                        </div>
                      )}
                    </button>
                    {/* Camera badge */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-[#004DFF] rounded-full flex items-center justify-center shadow-md hover:bg-[#003bbd] transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-gray-400 mt-2">Profile photo · optional · max 1 MB</p>
                  {errors.profileImage && (
                    <p className="text-red-500 text-xs mt-1">{errors.profileImage}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter first name"
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter last name"
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\+?\d*$/.test(val)) {
                        handleInputChange("phone", val);
                      }
                    }}
                    placeholder="+234 xxx xxx xxxx"
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      handleInputChange("department", value)
                    }
                  >
                    <SelectTrigger
                      id="department"
                      className={errors.department ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="clinical">Clinical Services</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy Management</SelectItem>
                      <SelectItem value="patient_support">Patient Support</SelectItem>
                      <SelectItem value="finance">Finance & Billing</SelectItem>
                      <SelectItem value="compliance">Compliance & Legal</SelectItem>
                      <SelectItem value="it">IT & Engineering</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="marketing">Marketing & Growth</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.department}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-[#004DFF] hover:bg-[#003bbd] text-white"
                >
                  {isLoading ? (
                    "Creating Profile..."
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
