"use client";

import type React from "react";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  User,
  CheckCircle,
  Heart,
  Users,
  AlertCircle,
  Wallet,
  Copy,
  Check,
  Upload,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function PatientOnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const email = searchParams.get("email") || "";
  const walletAddress = searchParams.get("wallet") || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: email,
    walletAddress: walletAddress,
    phone: "",
    country: "",
    city: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    tribe: "",
    maritalStatus: "",
    address: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
    profileImage: null as File | null,
  });

  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const totalSteps = 4;

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      if (formData.firstName.trim().length < 2)
        newErrors.firstName = "First name must be at least 2 characters";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      if (formData.lastName.trim().length < 2)
        newErrors.lastName = "Last name must be at least 2 characters";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (formData.phone.trim().length < 9)
        newErrors.phone = "Phone number must be at least 9 characters";
      if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone.trim()))
        newErrors.phone = "Please enter a valid phone number";
      if (!formData.country) newErrors.country = "Country is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (formData.city.trim().length < 2)
        newErrors.city = "City must be at least 2 characters";
      if (!formData.dateOfBirth)
        newErrors.dateOfBirth = "Date of birth is required";
      // Check if user is at least 13 years old
      if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        if (age < 13) {
          newErrors.dateOfBirth =
            "You must be at least 13 years old to register";
        }
      }
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.occupation.trim())
        newErrors.occupation = "Occupation is required";
      if (formData.occupation.trim().length < 2)
        newErrors.occupation = "Occupation must be at least 2 characters";
      if (!formData.tribe.trim()) newErrors.tribe = "Tribe is required";
      if (formData.tribe.trim().length < 2)
        newErrors.tribe = "Tribe must be at least 2 characters";
      if (!formData.maritalStatus)
        newErrors.maritalStatus = "Marital status is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (formData.address.trim().length < 10)
        newErrors.address = "Address must be at least 10 characters";
    }

    if (currentStep === 3) {
      if (!formData.emergencyContact.trim())
        newErrors.emergencyContact = "Emergency contact name is required";
      if (formData.emergencyContact.trim().length < 2)
        newErrors.emergencyContact =
          "Emergency contact name must be at least 2 characters";
      if (!formData.emergencyContactPhone.trim())
        newErrors.emergencyContactPhone = "Emergency contact phone is required";
      if (formData.emergencyContactPhone.trim().length < 9)
        newErrors.emergencyContactPhone =
          "Emergency contact phone must be at least 9 characters";
      if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.emergencyContactPhone.trim()))
        newErrors.emergencyContactPhone = "Please enter a valid phone number";
      if (formData.emergencyContactPhone.trim() === formData.phone.trim())
        newErrors.emergencyContactPhone =
          "Emergency contact phone cannot be the same as your personal phone";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: string, value: string | File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or GIF image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 1MB.',
        variant: 'destructive',
      });
      return;
    }

    // Update form data with the new file
    updateFormData("profileImage", file);

    // Create a preview of the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to process the image. Please try again.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } catch (err) {
      console.error(`Failed to copy wallet address: ${err}`);
    }
  };

  const nextStep = () => {
    if (validateStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!agreedToPolicy) {
      setErrors({
        submit: "Please agree to the terms and conditions to continue.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();

      // Add all form fields to FormData
      const formFields = {
        email: formData.email,
        walletAddress: formData.walletAddress,
        userType: "patient",
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        occupation: formData.occupation,
        tribe: formData.tribe,
        maritalStatus: formData.maritalStatus,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyContactPhone: formData.emergencyContactPhone,
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        currentMedications: formData.currentMedications,
      };

      // Add non-array fields to FormData
      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add profile image if it exists
      if (formData.profileImage) {
        console.log('Processing profile image for upload:', {
          type: typeof formData.profileImage,
          isFile: formData.profileImage instanceof File,
          name: formData.profileImage.name,
          size: formData.profileImage.size
        });
        formDataToSend.append('profileImage', formData.profileImage);
      }

      console.log("Submitting patient profile...");

      // Call Supabase API to create/update user profile with FormData
      const response = await fetch("/api/user/profile", {
        method: "POST",
        body: formDataToSend,
        // Don't set Content-Type header - let the browser set it with the correct boundary
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || "Failed to create profile";
        console.error('Server error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Show success message
      toast({
        title: "Profile Created Successfully!",
        description:
          "Your patient profile has been created. You can now sign in to access your account.",
      });

      // Redirect to signin page after a short delay
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error: unknown) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Profile creation failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const countries = [
    "Nigeria",
    "Ghana",
    "Kenya",
    "South Africa",
    "Egypt",
    "Morocco",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
  ];

  const getFieldError = (field: string) => {
    return errors[field] ? (
      <p className="text-sm text-red-600 mt-1">{errors[field]}</p>
    ) : null;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Personal Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Let&apos;s start with your basic details
              </p>
            </div>

            {/* Wallet Information */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Your Wallet
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Wallet Address
                      </p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white truncate">
                        {walletAddress}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyWalletAddress}
                      className="ml-2 flex-shrink-0"
                    >
                      {copiedWallet ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  placeholder="Enter your first name"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {getFieldError("firstName")}
              </div>
              <div>
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  placeholder="Enter your last name"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {getFieldError("lastName")}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
                  <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50 dark:bg-gray-700"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="+234 xxx xxx xxxx"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {getFieldError("phone")}
              </div>
              <div>
                <Label htmlFor="dateOfBirth">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    updateFormData("dateOfBirth", e.target.value)
                  }
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                />
                {getFieldError("dateOfBirth")}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => updateFormData("country", value)}
                >
                  <SelectTrigger
                    className={errors.country ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFieldError("country")}
              </div>
              <div>
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateFormData("gender", value)}
                >
                  <SelectTrigger
                    className={errors.gender ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="prefer-not-to-say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
                {getFieldError("gender")}
              </div>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData("city", e.target.value)}
                placeholder="Enter your city"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="occupation">
                  Occupation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => updateFormData("occupation", e.target.value)}
                  placeholder="e.g., Engineer, Teacher, Student"
                  className={errors.occupation ? "border-red-500" : ""}
                />
                {getFieldError("occupation")}
              </div>
              <div>
                <Label htmlFor="tribe">
                  Tribe <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tribe"
                  value={formData.tribe}
                  onChange={(e) => updateFormData("tribe", e.target.value)}
                  placeholder="e.g., Yoruba, Igbo, Hausa"
                  className={errors.tribe ? "border-red-500" : ""}
                />
                {getFieldError("tribe")}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maritalStatus">
                  Marital Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.maritalStatus}
                  onValueChange={(value) =>
                    updateFormData("maritalStatus", value)
                  }
                >
                  <SelectTrigger
                    className={errors.maritalStatus ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
                {getFieldError("maritalStatus")}
              </div>
              <div>
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Enter your full address"
                  className={errors.address ? "border-red-500" : ""}
                />
                {getFieldError("address")}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Picture
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Add a profile picture to personalize your account
              </p>
            </div>

            <div className="space-y-4">
              {formData.profileImage && (
                <div className="flex justify-center mb-4">
                  <div className="relative w-full max-w-xs">
                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto overflow-hidden">
                      <Image
                        src={profileImage || "/placeholder.svg"}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        onLoad={(e) => {
                          if (formData.profileImage instanceof File) {
                            URL.revokeObjectURL(e.currentTarget.src);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {errors.profileImage && (
                <p className="text-sm text-red-600 text-center mt-2">
                  {errors.profileImage}
                </p>
              )}

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Upload Profile Photo
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Add a clear photo of yourself
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profileImage"
                />
                <label htmlFor="profileImage">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">Choose Photo</span>
                  </Button>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Supported formats: JPG, PNG (max 1MB)
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Medical Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Help us understand your health better
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="emergencyContact">
                  Emergency Contact Name <span className="text-red-500">*</span>
                </Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                  onChange={(e) =>
                    updateFormData("emergencyContact", e.target.value)
                  }
                  placeholder="Full name of emergency contact"
                  className={errors.emergencyContact ? "border-red-500" : ""}
                />
                {getFieldError("emergencyContact")}
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">
                  Emergency Contact Phone{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) =>
                    updateFormData("emergencyContactPhone", e.target.value)
                  }
                  placeholder="+234 xxx xxx xxxx"
                  className={
                    errors.emergencyContactPhone ? "border-red-500" : ""
                  }
                />
                {getFieldError("emergencyContactPhone")}
              </div>
            </div>

            <div>
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory}
                onChange={(e) =>
                  updateFormData("medicalHistory", e.target.value)
                }
                placeholder="Please describe any significant medical conditions, surgeries, or family history"
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => updateFormData("allergies", e.target.value)}
                placeholder="List any known allergies (medications, food, environmental)"
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                value={formData.currentMedications}
                onChange={(e) =>
                  updateFormData("currentMedications", e.target.value)
                }
                placeholder="List all medications you're currently taking"
                className="min-h-[80px]"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Almost Done!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Review your information and complete setup
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <Image
                        src={profileImage || "/placeholder.svg"}
                        alt="Profile"
                        width={16}
                        height={16}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {formData.firstName} {formData.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formData.email}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Country:
                    </span>
                    <p className="font-medium">{formData.country}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Phone:
                    </span>
                    <p className="font-medium">{formData.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Date of Birth:
                    </span>
                    <p className="font-medium">{formData.dateOfBirth}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Gender:
                    </span>
                    <p className="font-medium capitalize">{formData.gender}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Wallet Address
                      </p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white truncate">
                        {walletAddress}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyWalletAddress}
                      className="ml-2 flex-shrink-0"
                    >
                      {copiedWallet ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                What&apos;s Next?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Access to verified doctors worldwide
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Secure medical records on blockchain
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Medication delivery to your doorstep
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  24/7 healthcare support
                </li>
              </ul>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToPolicy}
                onCheckedChange={(checked) =>
                  setAgreedToPolicy(checked as boolean)
                }
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/telehealthlogowithtext.svg"
                alt="teleHealthSol"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Patient Registration
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-8">
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400">
                  {errors.submit}
                </span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !agreedToPolicy}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white flex items-center"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
