"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Stethoscope,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Shield,
  AlertCircle,
  Wallet,
  Copy,
  Check,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

export default function DoctorOnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const email = searchParams?.get("email") || "";
  const walletAddress = searchParams?.get("walletAddress") || "";

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const defaultFormData = {
    firstName: "",
    lastName: "",
    email: email,
    walletAddress: walletAddress,
    phone: "",
    country: "",
    city: "",
    gender: "",
    specialty: "",
    licenseNumber: "",
    yearsOfExperience: "",
    education: "",
    hospitalAffiliation: "",
    bio: "",
    consultationFee30minChat: "",
    consultationFee30minVideo: "",
    consultationFee60minVideo: "",
    isVerified: false,
    languages: [] as string[],
    availability: {
      monday: { isOpen: false, start: "09:00", end: "17:00" },
      tuesday: { isOpen: false, start: "09:00", end: "17:00" },
      wednesday: { isOpen: false, start: "09:00", end: "17:00" },
      thursday: { isOpen: false, start: "09:00", end: "17:00" },
      friday: { isOpen: false, start: "09:00", end: "17:00" },
      saturday: { isOpen: false, start: "09:00", end: "17:00" },
      sunday: { isOpen: false, start: "09:00", end: "17:00" },
    },
    profileImage: null as File | null,
    medicalLicense: null as File | null,
    medicalDegree: null as File | null,
  };

  // Lazy initializer: read localStorage synchronously on first render so
  // the save effect never sees blank state during mount.
  const [formData, setFormData] = useState(() => {
    if (typeof window === "undefined") return defaultFormData;
    try {
      const saved = localStorage.getItem("epoch_doctor_onboarding");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultFormData,
          ...parsed,
          profileImage: null as File | null,
          medicalLicense: null as File | null,
          medicalDegree: null as File | null,
          email: email || parsed.email || "",
          walletAddress: walletAddress || parsed.walletAddress || "",
        };
      }
    } catch {}
    return defaultFormData;
  });

  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window === "undefined") return 1;
    try {
      const saved = localStorage.getItem("epoch_doctor_onboarding");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.currentStep || 1;
      }
    } catch {}
    return 1;
  });

  const [agreedToPolicy, setAgreedToPolicy] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("epoch_doctor_onboarding");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.agreedToPolicy || false;
      }
    } catch {}
    return false;
  });

  // Save state on every change
  useEffect(() => {
    const { profileImage, medicalLicense, medicalDegree, ...dataToSave } = formData;
    localStorage.setItem("epoch_doctor_onboarding", JSON.stringify({ ...dataToSave, currentStep, agreedToPolicy }));
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, currentStep, agreedToPolicy]);

  // LEVEL 2 FIX: Auto-redirect if files are missing on step 5 (e.g. after refresh)
  useEffect(() => {
    if (currentStep === 5 && (!formData.profileImage || !formData.medicalLicense)) {
      setCurrentStep(4);
      toast({
        title: "Documents Required",
        description: "Please re-upload your professional documents to complete your registration.",
        variant: "destructive",
      });
    }
  }, [currentStep, formData.profileImage, formData.medicalLicense, toast]);

  const totalSteps = 5;

  const validateStep = () => {
    console.log('Validating step:', currentStep);
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      console.log('Validating step 1 fields');
      if (!formData.firstName.trim()) {
        console.log('First name is missing');
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        console.log('Last name is missing');
        newErrors.lastName = "Last name is required";
      }
      if (!formData.phone.trim()) {
        console.log('Phone number is missing');
        newErrors.phone = "Phone number is required";
      } else if (!/^\+?\d{7,15}$/.test(formData.phone)) {
        console.log('Phone number is invalid');
        newErrors.phone = "Please enter a valid phone number (e.g. +1234567890)";
      }
      if (!formData.gender) {
        console.log('Gender is missing');
        newErrors.gender = "Gender is required";
      }
      if (!formData.country) {
        console.log('Country is missing');
        newErrors.country = "Country is required";
      }
      if (!formData.city.trim()) {
        console.log('City is missing');
        newErrors.city = "City is required";
      }
    } else if (currentStep === 2) {
      console.log('Validating step 2 fields');
      console.log('formData.specialty:', formData.specialty);
      console.log('formData.licenseNumber:', formData.licenseNumber);
      console.log('formData.yearsOfExperience:', formData.yearsOfExperience);
      console.log('formData.education:', formData.education);
      console.log('formData.hospitalAffiliation:', formData.hospitalAffiliation);
      
      if (!formData.specialty) {
        console.log('Specialty is missing');
        newErrors.specialty = "Specialty is required";
      }
      if (!formData.licenseNumber?.trim()) {
        console.log('License number is missing');
        newErrors.licenseNumber = "License number is required";
      }
      if (!formData.yearsOfExperience) {
        console.log('Years of experience is missing');
        newErrors.yearsOfExperience = "Years of experience is required";
      }
      if (!formData.education?.trim()) {
        console.log('Education is missing');
        newErrors.education = "Education is required";
      }
    } else if (currentStep === 3) {
      console.log('Validating step 3 fields');
      if (!formData.bio?.trim()) {
        console.log('Bio is missing');
        newErrors.bio = "Professional bio is required";
      } else if (formData.bio.trim().length < 50) {
        console.log('Bio is too short');
        newErrors.bio = "Bio must be at least 50 characters";
      }
      if (!formData.consultationFee30minChat) {
        newErrors.consultationFee30minChat = "Required";
      }
      if (!formData.consultationFee30minVideo) {
        newErrors.consultationFee30minVideo = "Required";
      }
      if (!formData.consultationFee60minVideo) {
        newErrors.consultationFee60minVideo = "Required";
      }
      
      const hasOpenDay = (Object.values(formData.availability) as { isOpen: boolean; start: string; end: string }[]).some((day) => day.isOpen);
      if (!hasOpenDay) {
        newErrors.availability = "Set at least one available day";
      }
      if (formData.languages.length === 0) {
        console.log('No languages selected');
        newErrors.languages = "At least one language is required";
      }
    } else if (currentStep === 4) {
      console.log('Validating step 4 fields');
      if (!formData.profileImage) {
        console.log('Profile image is missing');
        newErrors.profileImage = "Profile image is required";
      }
      if (!formData.medicalLicense) {
        console.log('Medical license is missing');
        newErrors.medicalLicense = "Medical license document is required";
      }
    }

    if (currentStep === 5) {
      console.log('Validating step 5 fields');
      console.log('agreedToPolicy:', agreedToPolicy);
      
      // LEVEL 1 FIX: Strict backup check for files on the final step
      if (!formData.profileImage) {
        newErrors.profileImage = "Profile photo is required. Please go back and upload.";
      }
      if (!formData.medicalLicense) {
        newErrors.medicalLicense = "Medical license is required. Please go back and upload.";
      }
      
      if (!agreedToPolicy) {
        console.log('Policy agreement is missing');
        newErrors.policy = "You must agree to the terms and conditions";
      }
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Is form valid?', isValid);
    return isValid;
  };

  const updateFormData = (field: string, value: string | string[] | number | boolean | File | null) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: "" }));
    }
  };

  const updateAvailability = (day: string, field: string, value: boolean | string) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value,
        },
      },
    }));
    if (errors.availability) {
      setErrors((prev) => ({ ...prev, availability: "" }));
    }
  };

  const MAX_FILE_SIZE = 1024 * 1024;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    console.log('Selected file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      isFile: file instanceof File
    });

    // Validate file size (250KB max)
    if (file.size > MAX_FILE_SIZE) {
      const sizeInKB = (file.size / 1024).toFixed(2);
      const maxSizeInKB = (MAX_FILE_SIZE / 1024).toFixed(2);
      
      toast({
        title: "File too large",
        description: `The selected image (${sizeInKB}KB) exceeds the maximum allowed size of ${maxSizeInKB}KB.`,
        variant: "destructive",
      });
      
      // Reset the file input
      event.target.value = '';
      setProfileImage(null);
      updateFormData("profileImage", null);
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }
    
    // Create a new File object to ensure it's a proper File instance
    const newFile = new File([file], file.name, { type: file.type });
    
    // Update form data with the file
    updateFormData("profileImage", newFile);
    
    // Create preview URL for the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
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
    console.log('nextStep called, currentStep:', currentStep);
    
    // First validate the current step
    const isValid = validateStep();
    console.log('Validation result:', isValid);
    
    if (!isValid) {
      console.log('Validation failed, errors:', errors);
      return;
    }
    
    // Only proceed to next step if validation passes and we're not on the last step
    if (currentStep < totalSteps) {
      console.log('Proceeding to step:', currentStep + 1);
      setCurrentStep((prevStep: number) => {
        const nextStep = prevStep + 1;
        console.log('Updated step to:', nextStep);
        return nextStep;
      });
      setErrors({});
    } else {
      console.log('Already on the last step');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    // Final strict guard for files
    if (!formData.profileImage || !formData.medicalLicense) {
      toast({
        title: "Missing Documents",
        description: "Please ensure your profile photo and medical license are uploaded before submitting.",
        variant: "destructive",
      });
      setCurrentStep(4);
      return;
    }
    
    // Validate the final step
    if (!validateStep()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Create FormData to handle file uploads
      const formDataToSend = new FormData();
      
      // Add all form fields to FormData
      const formFields = {
        email: formData.email,
        walletAddress: formData.walletAddress,
        userType: "doctor",
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        gender: formData.gender,
        specialty: formData.specialty,
        licenseNumber: formData.licenseNumber,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
        isVerified: false,
        hospitalAffiliation: formData.hospitalAffiliation,
        consultationFee30minChat: parseFloat(formData.consultationFee30minChat) || 0,
        consultationFee30minVideo: parseFloat(formData.consultationFee30minVideo) || 0,
        consultationFee60minVideo: parseFloat(formData.consultationFee60minVideo) || 0,
        bio: formData.bio,
        availability: JSON.stringify(formData.availability),
      };

      // Add non-array fields to FormData
      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add languages as a JSON string to ensure proper array handling
      if (formData.languages && formData.languages.length > 0) {
        formDataToSend.append('languages', JSON.stringify(formData.languages));
      }

      // Add education as a JSON string to ensure proper array handling
      if (formData.education) {
        const educationArray = formData.education.split(',').map((e: string) => e.trim()).filter(Boolean);
        formDataToSend.append('education', JSON.stringify(educationArray));
      }
      
      // Add files to FormData if they exist
      if (formData.profileImage) {
        console.log('Processing profile image for upload:', {
          type: typeof formData.profileImage,
          isFile: formData.profileImage instanceof File,
          name: formData.profileImage instanceof File ? formData.profileImage.name : 'N/A',
          size: formData.profileImage instanceof File ? formData.profileImage.size : 'N/A'
        });

        try {
          // If profileImage is a File object, append it directly
          if (formData.profileImage instanceof File) {
            formDataToSend.append('profileImage', formData.profileImage, formData.profileImage.name);
            console.log('Appended file to FormData:', formData.profileImage.name);
          } 
          // If it's a string (data URL), convert it to a File
          else if (typeof formData.profileImage === 'string') {
            console.log('Converting data URL to file');
            const response = await fetch(formData.profileImage);
            const blob = await response.blob();
            const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
            formDataToSend.append('profileImage', file, file.name);
            console.log('Converted and appended data URL to file');
          }
        } catch (error) {
          console.error('Error processing profile image:', error);
        }
      } else {
        console.log('No profile image to upload');
      }
      if (formData.medicalLicense) {
        formDataToSend.append('medicalLicense', formData.medicalLicense);
      }
      if (formData.medicalDegree) {
        formDataToSend.append('medicalDegree', formData.medicalDegree);
      }

      console.log("Submitting doctor profile...");

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

      localStorage.removeItem("epoch_doctor_onboarding");

      // Show success message
      toast({
        title: "Profile Created Successfully!",
        description: "Your profile has been created. You can now sign in to access your account.",
        variant: "default",
      });

      // Store email for dashboard access
      localStorage.setItem("userEmail", email);

      // Clear any existing errors
      setErrors({});

      // Disable form inputs
      const form = e.target as HTMLFormElement;
      const inputs = form.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement | HTMLSelectElement>('input, button, textarea, select');
      inputs.forEach((input) => {
        input.disabled = true;
      });

      // Redirect to signin page after a short delay
      const redirectTimer = setTimeout(() => {
        router.push("/signin");
      }, 2000);

      // Cleanup function
      return () => clearTimeout(redirectTimer);
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      
      // LEVEL 1 FIX: Better guidance for "Failed to fetch"
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.toLowerCase().includes("fetch")) {
          errorMessage = "Network error: Failed to upload profile. Please check your internet connection or try using smaller image files (max 1MB).";
        }
      }
      
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
      
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Show toast notification
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
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
    "India",
    "Germany",
    "France",
    "Japan",
    "China",
    "Brazil",
    "Mexico",
    "United Arab Emirates",
    "Saudi Arabia",
    "Singapore",
    "New Zealand",
    "Ireland",
    "Italy",
    "Spain",
  ];

  const specialties = [
    "General Practice",
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Gynecology",
    "Psychiatry",
    "Orthopedics",
    "Neurology",
    "Oncology",
    "Endocrinology",
    "Gastroenterology",
    "Pulmonology",
    "Physiotherapy",
    "Dentistry",
    "Orthodontics",
    "Periodontics",
    "Endodontics",
    "Oral and Maxillofacial Surgery",
    "Prosthodontics",
    "Pediatric Dentistry",
    "Anesthesiology",
    "Emergency Medicine",
    "Family Medicine",
    "Internal Medicine",
    "Obstetrics and Gynecology",
    "Ophthalmology",
    "Pathology",
    "Radiology",
    "Surgery",
    "Urology",
  ];

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  const languages = [
    "English",
    "Hausa",
    "Yoruba",
    "Igbo",
    "Swahili",
    "French",
    "Arabic",
    "Spanish",
    "Portuguese",
    "Amharic",
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
              <div className="w-16 h-16 bg-[#004DFF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\+?\d*$/.test(val)) {
                      updateFormData("phone", val);
                    }
                  }}
                  placeholder="+234 xxx xxx xxxx"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {getFieldError("phone")}
              </div>
              <div>
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateFormData("gender", value)}
                >
                  <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFieldError("gender")}
              </div>
              <div>
                <Label htmlFor="country">
                  Country of residence<span className="text-red-500">*</span>
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
            </div>

            <div>
              <Label htmlFor="city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData("city", e.target.value)}
                placeholder="Enter your city"
                className={errors.city ? "border-red-500" : ""}
              />
              {getFieldError("city")}
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
              <div className="w-16 h-16 bg-[#004DFF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Professional Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Tell us about your medical expertise
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialty">
                  Medical Specialty <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.specialty}
                  onValueChange={(value) => updateFormData("specialty", value)}
                >
                  <SelectTrigger
                    className={errors.specialty ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFieldError("specialty")}
              </div>
              <div>
                <Label htmlFor="yearsOfExperience">
                  Years of Experience <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={(e) =>
                    updateFormData("yearsOfExperience", e.target.value)
                  }
                  placeholder="e.g., 10"
                  className={errors.yearsOfExperience ? "border-red-500" : ""}
                />
                {getFieldError("yearsOfExperience")}
              </div>
            </div>

            <div>
              <Label htmlFor="licenseNumber">
                Medical License Number/Mat No. (Med Students) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) =>
                  updateFormData("licenseNumber", e.target.value)
                }
                placeholder="Enter your medical license number or registration number(med students)"
                className={errors.licenseNumber ? "border-red-500" : ""}
              />
              {getFieldError("licenseNumber")}
            </div>

            <div>
              <Label htmlFor="education">
                Education & Qualifications{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="education"
                value={formData.education}
                onChange={(e) => updateFormData("education", e.target.value)}
                placeholder="List your medical degrees, residencies, etc. (Separate each entry with commas)"
                className={`min-h-[100px] ${errors.education ? "border-red-500" : ""}`}
              />
              <p className="text-xs text-gray-500 mt-1">Separate each entry with commas (e.g., MD from Harvard, Residency at Johns Hopkins)</p>
              {getFieldError("education")}
            </div>

            <div>
              <Label htmlFor="hospitalAffiliation">
                Hospital/Clinic Affiliation
              </Label>
              <Input
                id="hospitalAffiliation"
                value={formData.hospitalAffiliation}
                onChange={(e) =>
                  updateFormData("hospitalAffiliation", e.target.value)
                }
                placeholder="Enter your hospital or clinic affiliation"
              />
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
              <div className="w-16 h-16 bg-[#004DFF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Bio & Consultation
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Tell patients about yourself and your consultation fees
              </p>
            </div>

            <div>
              <Label htmlFor="bio">
                Professional Bio <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => updateFormData("bio", e.target.value)}
                placeholder="Write a brief description about yourself, your approach to medicine, and what patients can expect"
                className={`min-h-[120px] ${errors.bio ? "border-red-500" : ""}`}
              />
              {getFieldError("bio")}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="consultationFee30minChat">
                  30min Chat Fee (USDC) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="consultationFee30minChat"
                  type="number"
                  step="0.01"
                  value={formData.consultationFee30minChat}
                  onChange={(e) =>
                    updateFormData("consultationFee30minChat", e.target.value)
                  }
                  placeholder="e.g., 3.00"
                  className={errors.consultationFee30minChat ? "border-red-500" : ""}
                />
                {getFieldError("consultationFee30minChat")}
              </div>
              <div>
                <Label htmlFor="consultationFee30minVideo">
                  30min Video Fee (USDC) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="consultationFee30minVideo"
                  type="number"
                  step="0.01"
                  value={formData.consultationFee30minVideo}
                  onChange={(e) =>
                    updateFormData("consultationFee30minVideo", e.target.value)
                  }
                  placeholder="e.g., 5.00"
                  className={errors.consultationFee30minVideo ? "border-red-500" : ""}
                />
                {getFieldError("consultationFee30minVideo")}
              </div>
              <div>
                <Label htmlFor="consultationFee60minVideo">
                  1 Hour Video Fee (USDC) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="consultationFee60minVideo"
                  type="number"
                  step="0.01"
                  value={formData.consultationFee60minVideo}
                  onChange={(e) =>
                    updateFormData("consultationFee60minVideo", e.target.value)
                  }
                  placeholder="e.g., 8.00"
                  className={errors.consultationFee60minVideo ? "border-red-500" : ""}
                />
                {getFieldError("consultationFee60minVideo")}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <Label className="text-base font-medium">
                  Availability Schedule <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-3 mt-3">
                  {(Object.entries(formData.availability) as [string, { isOpen: boolean; start: string; end: string }][]).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-20">
                        <Checkbox
                          checked={hours.isOpen}
                          onCheckedChange={(checked) =>
                            updateAvailability(day, "isOpen", checked as boolean)
                          }
                        />
                      </div>
                      <div className="w-24 capitalize font-medium">{day}</div>
                      {hours.isOpen ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="time"
                            value={hours.start}
                            onChange={(e) => updateAvailability(day, "start", e.target.value)}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.end}
                            onChange={(e) => updateAvailability(day, "end", e.target.value)}
                            className="w-32"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-500">Closed</span>
                      )}
                    </div>
                  ))}
                  {getFieldError("availability")}
                </div>
              </div>
              <div>
                <Label htmlFor="languages">
                  Languages Spoken <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2 mt-3">
                  {languages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={language}
                        checked={formData.languages.includes(language)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData("languages", [
                              ...formData.languages,
                              language,
                            ]);
                          } else {
                            updateFormData(
                              "languages",
                              formData.languages.filter((l: string) => l !== language)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor={language} className="text-sm">
                        {language}
                      </Label>
                    </div>
                  ))}
                </div>
                {getFieldError("languages")}
              </div>
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
              <div className="w-16 h-16 bg-[#004DFF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Picture
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Add a professional photo for your medical profile
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
                  Add a professional photo of yourself
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

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mt-6">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Upload Medical License
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Upload a scanned copy or PDF of your medical license
                </p>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 1024 * 1024) { // 1MB limit
                        toast({
                          title: "File too large",
                          description: "The selected file exceeds the maximum allowed size of 1MB.",
                          variant: "destructive",
                        });
                        e.target.value = '';
                        return;
                      }
                      const newFile = new File([file], file.name, { type: file.type });
                      updateFormData("medicalLicense", newFile);
                    }
                  }}
                  className="hidden"
                  id="medicalLicense"
                />
                <label htmlFor="medicalLicense">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">
                      {formData.medicalLicense ? "File Selected" : "Choose File"}
                    </span>
                  </Button>
                </label>
                {formData.medicalLicense && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {formData.medicalLicense.name}
                  </p>
                )}
                {getFieldError("medicalLicense")}
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#004DFF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Terms & Agreement
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Review and accept our terms of service
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Review Your Information</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Full Name</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Dr. {formData.firstName} {formData.lastName}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Email</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formData.email}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Phone</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formData.phone}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Specialty</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formData.specialty}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">License Number</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formData.licenseNumber}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Consultation Fees</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="space-y-1 text-xs">
                          <div>30m Chat: ${formData.consultationFee30minChat}</div>
                          <div>30m Video: ${formData.consultationFee30minVideo}</div>
                          <div>1h Video: ${formData.consultationFee60minVideo}</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Documents</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            {formData.profileImage ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 mr-1" />
                            )}
                            <span className={formData.profileImage ? 'text-green-600' : 'text-red-600'}>Profile Photo</span>
                          </div>
                          <div className="flex items-center">
                            {formData.medicalLicense ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 mr-1" />
                            )}
                            <span className={formData.medicalLicense ? 'text-green-600' : 'text-red-600'}>Medical License</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">
                    Verification Process
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Your documents will be reviewed by our medical board within
                    24-48 hours. You&apos;ll receive an email notification once
                    verified.
                  </p>
                </div>
              </div>
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
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>
                ,{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link href="/guidelines" className="text-blue-600 hover:underline">
                  Medical Professional Guidelines
                </Link>
              </Label>
            </div>
            {errors.policy && (
              <p className="text-sm text-red-600 mt-1">{errors.policy}</p>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/telehealthlogo.svg"
                alt="Epoch telehealth logo short"
                width={40}
                height={40}
                className="h-8 w-auto md:hidden"
              />
              <Image
                src="/telehealthlogowithtext.svg"
                alt="Epoch telehealth logo"
                width={150}
                height={40}
                className="h-8 w-auto hidden md:block"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {saveStatus === "saving" && <span className="text-xs text-[#004DFF] ml-2 animate-pulse">Saving...</span>}
            {saveStatus === "saved" && <span className="text-xs text-emerald-500 ml-2">Saved ✓</span>}
            <Stethoscope className="w-5 h-5 text-[#004DFF]" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Doctor Registration
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <motion.div
              className="bg-[#004DFF] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <form onSubmit={handleSubmit}>
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
                  type="button"
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
                    type="submit"
                    disabled={isSubmitting || !agreedToPolicy}
                    className="bg-[#004DFF] hover:bg-[#003bbd] text-white flex items-center"
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
                    type="button"
                    onClick={nextStep}
                    className="bg-[#004DFF] hover:bg-[#003bbd] text-white flex items-center"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
