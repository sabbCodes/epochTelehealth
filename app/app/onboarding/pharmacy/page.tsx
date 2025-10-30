"use client";

import type React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Pill,
  Building,
  // Mail,
  CheckCircle,
  Shield,
  Clock,
  AlertCircle,
  Wallet,
  Copy,
  Check,
  Camera,
  Upload,
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
import { Switch } from "@/components/ui/switch";
import { AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

export default function PharmacyOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  // const [pharmacyImages, setPharmacyImages] =  // State for image previews
  // const [imagePreview, setImagePreview] = useState<string | null>(null);
  // const [licensePreview, setLicensePreview] = useState<string | null>(null);
  // const [registrationPreview, setRegistrationPreview] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const email = searchParams?.get("email") || "";
  const walletAddress = searchParams?.get("wallet") || "";

  interface OperatingHoursDay {
    open: string;
    close: string;
    isOpen: boolean;
  }

  interface OperatingHours {
    monday: OperatingHoursDay;
    tuesday: OperatingHoursDay;
    wednesday: OperatingHoursDay;
    thursday: OperatingHoursDay;
    friday: OperatingHoursDay;
    saturday: OperatingHoursDay;
    sunday: OperatingHoursDay;
    [key: string]: OperatingHoursDay;
  }

  interface Services {
    prescription: boolean;
    otc: boolean;
    homeDelivery: boolean;
    consultation: boolean;
    vaccination: boolean;
    healthScreening: boolean;
    [key: string]: boolean;
  }

  interface PaymentMethods {
    crypto: boolean;
    creditCard: boolean;
    bankTransfer: boolean;
    mobileMoney: boolean;
    [key: string]: boolean;
  }

  interface PharmacyFormData {
    // Pharmacy Information
    pharmacyName: string;
    email: string;
    walletAddress: string;
    
    // Contact Information
    contactPersonFirstName: string;
    contactPersonLastName: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    licenseNumber: string;
    registrationNumber: string;
    yearEstablished: string;
    website: string;
    description: string;
    
    // Operational Details
    operatingHours: OperatingHours;
    deliveryRadius: string;
    deliveryFee: string;
    minimumOrderValue: string;
    acceptsInsurance: boolean;
    insuranceProviders: string[];
    
    // Services
    services: Services;
    
    // Payment Methods
    paymentMethods: PaymentMethods;
    
    // Files and URLs
    pharmacyImages: File[];
    pharmacyLicense: File | null;
    businessRegistration: File | null;
    profileImage: File | null;
    pharmacyLicenseName: string;
    businessRegistrationName: string;
    licenseUrl: string;
    registrationUrl: string;
  }

  const initialFormData: PharmacyFormData = {
    // Pharmacy Information
    pharmacyName: "",
    email: email,
    walletAddress: walletAddress,

    // Contact Information
    contactPersonFirstName: "",
    contactPersonLastName: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    licenseNumber: "",
    registrationNumber: "",
    yearEstablished: "",
    website: "",
    description: "",

    // Operational Details
    operatingHours: {
      monday: { open: "09:00", close: "18:00", isOpen: true },
      tuesday: { open: "09:00", close: "18:00", isOpen: true },
      wednesday: { open: "09:00", close: "18:00", isOpen: true },
      thursday: { open: "09:00", close: "18:00", isOpen: true },
      friday: { open: "09:00", close: "18:00", isOpen: true },
      saturday: { open: "09:00", close: "14:00", isOpen: true },
      sunday: { open: "00:00", close: "00:00", isOpen: false },
    },
    deliveryRadius: "5",
    deliveryFee: "2.50",
    minimumOrderValue: "10.00",
    acceptsInsurance: false,
    insuranceProviders: [],

    // Services
    services: {
      prescription: true,
      otc: true,
      homeDelivery: true,
      consultation: false,
      vaccination: false,
      healthScreening: false,
    },

    // Payment Methods
    paymentMethods: {
      crypto: true,
      creditCard: true,
      bankTransfer: false,
      mobileMoney: false,
    },

    // Files and URLs
    pharmacyImages: [],
    pharmacyLicense: null,
    businessRegistration: null,
    profileImage: null,
    pharmacyLicenseName: "",
    businessRegistrationName: "",
    licenseUrl: "",
    registrationUrl: "",
  };

  const [formData, setFormData] = useState<PharmacyFormData>(initialFormData);

  const totalSteps = 5;

  // const validateStep = () => {
  //   const newErrors: Record<string, string> = {};

  //   if (currentStep === 1) {
  //     if (!formData.pharmacyName.trim())
  //       newErrors.pharmacyName = "Pharmacy name is required";
  //     if (!formData.contactPersonFirstName.trim())
  //       newErrors.contactPersonFirstName = "Contact person's first name is required";
  //     if (!formData.contactPersonLastName.trim())
  //       newErrors.contactPersonLastName = "Contact person's last name is required";
  //     if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
  //     if (!formData.country) newErrors.country = "Country is required";
  //     if (!formData.city.trim()) newErrors.city = "City is required";
  //     if (!formData.address.trim()) newErrors.address = "Address is required";
  //   }

  //   if (currentStep === 2) {
  //     if (!formData.licenseNumber.trim())
  //       newErrors.licenseNumber = "License number is required";
  //     if (!formData.registrationNumber.trim())
  //       newErrors.registrationNumber = "Registration number is required";
  //     if (!formData.yearEstablished)
  //       newErrors.yearEstablished = "Year established is required";
  //   }

  //   if (currentStep === 3) {
  //     if (!formData.description.trim())
  //       newErrors.description = "Description is required";
  //     if (formData.description.trim().length < 30)
  //       newErrors.description = "Description must be at least 30 characters";
  //     // if (formData.servicesOffered.length === 0)
  //     //   newErrors.servicesOffered = "At least one service is required";
  //   }

  //   if (currentStep === 4) {
  //     if (!formData.profileImage)
  //       newErrors.profileImage = "Profile image is required";
  //   }

  //   if (currentStep === 5) {
  //     if (!agreedToPolicy)
  //       newErrors.policy = "You must agree to the terms and conditions";
  //   }

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const updateFormData = <K extends keyof PharmacyFormData>(
    field: K,
    value: PharmacyFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateNestedFormData = <K extends keyof PharmacyFormData, F extends keyof PharmacyFormData[K]>(
    parent: K,
    field: F,
    value: PharmacyFormData[K][F]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as object),
        [field]: value,
      },
    }));
  };

  const updateOperatingHours = (
    day: keyof OperatingHours,
    field: keyof OperatingHoursDay,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const handlePharmacyImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        pharmacyImages: 'Please upload an image file (JPEG, PNG, etc.)'
      }));
      return;
    }
    
    // Validate file size (5MB limit as per UI)
    if (file.size > 1 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        pharmacyImages: 'Image size should be less than 1MB'
      }));
      return;
    }
    
    // Update form data with the new profile image
    setFormData(prev => ({
      ...prev,
      profileImage: file,
      pharmacyImages: [file] // Keep this as array to match validation
    }));
    
    // Create preview URL for the image
    // const previewUrl = URL.createObjectURL(file);
    // setImagePreview(previewUrl);
    
    // Clear any previous errors
    setErrors(prev => ({
      ...prev,
      pharmacyImages: undefined,
      profileImage: undefined
    }));
    
    // Clear any previous errors
    if (errors.profileImage) {
      setErrors(prev => ({
        ...prev,
        profileImage: undefined
      }));
    }
  };

  // const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     // Validate file type
  //     if (!file.type.startsWith('image/')) {
  //       setErrors(prev => ({
  //         ...prev,
  //         profileImage: 'Please upload an image file (JPEG, PNG, etc.)'
  //       }));
  //       e.target.value = ''; // Clear the file input
  //       return;
  //     }
      
  //     try {
  //       // Validate file size (max 1MB)
  //       validateFileSize(file, 1);
        
  //       // Create preview URL
  //       // const previewUrl = URL.createObjectURL(file);
  //       // setImagePreview(previewUrl);
        
  //       // Update form data
  //       setFormData(prev => ({
  //         ...prev,
  //         profileImage: file
  //       }));
        
  //       // Clear any previous errors
  //       if (errors.profileImage) {
  //         setErrors(prev => ({
  //           ...prev,
  //           profileImage: undefined
  //         }));
  //       }
  //     } catch (error) {
  //       setErrors(prev => ({
  //         ...prev,
  //         profileImage: error instanceof Error ? error.message : 'Invalid file size'
  //       }));
  //       e.target.value = ''; // Clear the file input
  //     }
      

  //   }
  // };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'pharmacyLicense' | 'businessRegistration') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (allow PDF and images)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErrors({
          ...errors,
          [field]: 'Please upload a PDF or image file (JPEG, PNG, etc.)'
        });
        return;
      }
      
      // Validate file size (max 5MB for documents)
      if (file.size > 1 * 1024 * 1024) {
        setErrors({
          ...errors,
          [field]: 'File size must be less than 1MB'
        });
        return;
      }
      
      // Update form data with the file
      setFormData(prev => ({
        ...prev,
        [field]: file,
        [`${field}Name`]: file.name // Store the file name for display
      }));
      
      // Clear any previous errors for this field
      if (errors[field]) {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
      }
      
      // For images, create a preview
      // if (file.type.startsWith('image/')) {
      //   const previewUrl = URL.createObjectURL(file);
      //   if (field === 'pharmacyLicense') {
      //     setLicensePreview(previewUrl);
      //   } else {
      //     setRegistrationPreview(previewUrl);
      //   }
      // }
    }
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
    console.log('[nextStep] Current step:', currentStep);
    console.log('[nextStep] Form data:', formData);
    
    // Check for required fields in the current step
    let hasErrors = false;
    const currentStepErrors: Record<string, string> = {};
    
    // Only validate the current step's fields
    if (currentStep === 1) {
      console.log('[nextStep] Validating step 1 fields');
      if (!formData.pharmacyName?.trim()) {
        console.log('[nextStep] Missing pharmacy name');
        currentStepErrors.pharmacyName = "Pharmacy name is required";
        hasErrors = true;
      }
      if (!formData.contactPersonFirstName?.trim()) {
        console.log('[nextStep] Missing contact person first name');
        currentStepErrors.contactPersonFirstName = "Contact person's first name is required";
        hasErrors = true;
      }
      if (!formData.contactPersonLastName?.trim()) {
        console.log('[nextStep] Missing contact person last name');
        currentStepErrors.contactPersonLastName = "Contact person's last name is required";
        hasErrors = true;
      }
      if (!formData.phone?.trim()) {
        console.log('[nextStep] Missing phone');
        currentStepErrors.phone = "Phone number is required";
        hasErrors = true;
      }
      if (!formData.country) {
        console.log('[nextStep] Missing country');
        currentStepErrors.country = "Country is required";
        hasErrors = true;
      }
      if (!formData.city?.trim()) {
        console.log('[nextStep] Missing city');
        currentStepErrors.city = "City is required";
        hasErrors = true;
      }
      if (!formData.yearEstablished) {
        console.log('[nextStep] Missing year established');
        currentStepErrors.yearEstablished = "Year established is required";
        hasErrors = true;
      }
    } else if (currentStep === 2) {
      console.log('[nextStep] Validating step 2 fields');
      if (!formData.pharmacyImages || formData.pharmacyImages.length === 0) {
        console.log('[nextStep] No pharmacy images uploaded');
        currentStepErrors.pharmacyImages = "Please upload pharmacy shop image";
        hasErrors = true;
      }
    } else if (currentStep === 3) {
      console.log('[nextStep] Validating step 3 fields - License & Registration');
      if (!formData.address?.trim()) {
        console.log('[nextStep] Missing address');
        currentStepErrors.address = "Address is required";
        hasErrors = true;
      }
      if (!formData.licenseNumber?.trim()) {
        console.log('[nextStep] Missing license number');
        currentStepErrors.licenseNumber = "License number is required";
        hasErrors = true;
      }
      if (!formData.registrationNumber?.trim()) {
        console.log('[nextStep] Missing registration number');
        currentStepErrors.registrationNumber = "Business registration number is required";
        hasErrors = true;
      }
      if (!formData.description?.trim() || formData.description.trim().length < 30) {
        currentStepErrors.description = "Description must be at least 30 characters";
        hasErrors = true;
      }
    } else if (currentStep === 4) {
      if (!formData.profileImage) {
        currentStepErrors.profileImage = "Profile image is required";
        hasErrors = true;
      }
    }

    Object.keys(errors).forEach(key => {
      if (!(key in currentStepErrors)) {
        delete errors[key];
      }
    });
    
    if (hasErrors) {
      setErrors(currentStepErrors);
      
      // Scroll to the first error after a small delay to allow the DOM to update
      setTimeout(() => {
        const firstError = Object.keys(currentStepErrors)[0];
        console.log('[nextStep] First error element ID:', firstError);
        
        // Try to find the input element or its parent with error class
        let element: HTMLElement | null = document.getElementById(firstError);
        if (!element) {
          // If direct element not found, try to find by name or data-testid
          element = document.querySelector<HTMLElement>(`[name="${firstError}"], [data-testid="${firstError}"]`);
        }
        
        if (element) {
          console.log('[nextStep] Scrolling to error element');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Focus the first invalid field
          if ('focus' in element) {
            element.focus();
          } else {
            const firstChild = (element as HTMLElement).firstElementChild as HTMLElement | null;
            if (firstChild && 'focus' in firstChild) {
              firstChild.focus();
              }
            }
        } else {
          console.warn('[nextStep] Could not find error element for:', firstError);
          // If we can't find the specific element, at least scroll to the top of the form
          const form = document.querySelector('form');
          form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      return;
    }
    
    // If no errors, proceed to next step
    console.log('[nextStep] No validation errors, proceeding to next step');
    if (currentStep < totalSteps) {
      console.log('[nextStep] Current step before update:', currentStep);
      const nextStepValue = currentStep + 1;
      console.log('[nextStep] Setting step to:', nextStepValue);
      
      // Update state and clear errors
      setCurrentStep(nextStepValue);
      setErrors({});
      
      // Scroll to top of form when moving to next step
      setTimeout(() => {
        const form = document.querySelector('form');
        form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
      console.log('[nextStep] Step update scheduled');
    } else {
      console.log('[nextStep] Already at last step:', currentStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validate file size (1MB limit)
  const validateFileSize = (file: File, maxSizeMB: number = 1): boolean => {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      const errorMessage = `File size must be less than ${maxSizeMB}MB`;
      throw new Error(errorMessage);
    }
    return true;
  };

  // Prepare file for upload via API route
  const uploadFileToStorage = async (file: File, fileType: 'profile' | 'license' | 'registration' | 'other') => {
    try {
      if (!file) {
        throw new Error('No file provided for upload');
      }
      
      // Validate file size before upload (1MB limit)
      validateFileSize(file, 1);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to upload file');
      }
      
      if (!responseData || !responseData.url) {
        throw new Error('Invalid response from server: Missing URL');
      }
      
      return responseData.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error instanceof Error ? error : new Error('Failed to upload file');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
  if (e) {
    e.preventDefault();
  }
    // Final validation for all steps
    const allErrors: Record<string, string> = {};
    let hasErrors = false;
    
    // Validate all steps
    if (!formData.pharmacyName?.trim()) {
      allErrors.pharmacyName = "Pharmacy name is required";
      hasErrors = true;
    }
    if (!formData.phone?.trim()) {
      allErrors.phone = "Phone number is required";
      hasErrors = true;
    }
    if (!formData.country) {
      allErrors.country = "Country is required";
      hasErrors = true;
    }
    if (!formData.city?.trim()) {
      allErrors.city = "City is required";
      hasErrors = true;
    }
    if (!formData.address?.trim()) {
      allErrors.address = "Address is required";
      hasErrors = true;
    }
    if (!formData.licenseNumber?.trim()) {
      allErrors.licenseNumber = "License number is required";
      hasErrors = true;
    }
    if (!formData.registrationNumber?.trim()) {
      allErrors.registrationNumber = "Registration number is required";
      hasErrors = true;
    }
    if (!formData.yearEstablished) {
      allErrors.yearEstablished = "Year established is required";
      hasErrors = true;
    }
    if (!formData.description?.trim() || formData.description.trim().length < 30) {
      allErrors.description = "Description must be at least 30 characters";
      hasErrors = true;
    }
    if (!formData.profileImage) {
      allErrors.profileImage = "Profile image is required";
      hasErrors = true;
    }

    if (!agreedToPolicy) {
      allErrors.policy = 'You must agree to the terms and conditions to continue';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(allErrors);
      const firstError = Object.keys(allErrors)[0];
      const element = document.getElementById(firstError);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      const formFields = {
        email: formData.email,
        walletAddress: formData.walletAddress,
        userType: "pharmacy",
        firstName: formData.contactPersonFirstName,
        lastName: formData.contactPersonLastName,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        contactPersonFirstName: formData.contactPersonFirstName,
        contactPersonLastName: formData.contactPersonLastName,
        pharmacyName: formData.pharmacyName,
        licenseNumber: formData.licenseNumber,
        registrationNumber: formData.registrationNumber,
        yearEstablished: formData.yearEstablished,
        website: formData.website || '',
        description: formData.description,
        operatingHours: JSON.stringify(formData.operatingHours || {
          monday: { open: "09:00", close: "18:00", isOpen: true },
          tuesday: { open: "09:00", close: "18:00", isOpen: true },
          wednesday: { open: "09:00", close: "18:00", isOpen: true },
          thursday: { open: "09:00", close: "18:00", isOpen: true },
          friday: { open: "09:00", close: "18:00", isOpen: true },
          saturday: { open: "09:00", close: "14:00", isOpen: true },
          sunday: { open: "00:00", close: "00:00", isOpen: false },
        }),
        deliveryRadiusKm: formData.deliveryRadius || 5,
        deliveryFee: formData.deliveryFee || "2.50",
        minimumOrderValue: formData.minimumOrderValue || "10.00",
        acceptsInsurance: formData.acceptsInsurance || false,
        insuranceProviders: JSON.stringify(formData.insuranceProviders || []),
        services: JSON.stringify({
          prescription: true,
          otc: true,
          homeDelivery: true,
          consultation: false,
          vaccination: false,
        }),
        agreedToPolicy: agreedToPolicy,
        licenseUrl: formData.licenseUrl || '',
        registrationUrl: formData.registrationUrl || '',
        profileImage: formData.profileImage || '',
      };

      // First, upload all files and get their URLs
      try {
        // Upload profile image if exists
        if (formData.profileImage) {
          const profileImageUrl = await uploadFileToStorage(formData.profileImage, 'profile');
          if (profileImageUrl) {
            formFields.profileImage = profileImageUrl;
            setFormData(prev => ({
              ...prev,
              profileImageUrl: profileImageUrl
            }));
          }
        }

        // Upload pharmacy license if exists
        if (formData.pharmacyLicense) {
          try {
            const licenseUrl = await uploadFileToStorage(formData.pharmacyLicense, 'license');
            if (licenseUrl) {
              formFields.licenseUrl = licenseUrl;
              setFormData(prev => ({
                ...prev,
                licenseUrl: licenseUrl
              }));
            } else {
              throw new Error('Failed to upload license file');
            }
          } catch (error) {
            console.error('Error uploading license:', error);
            throw new Error('Failed to upload license file. Please try again.');
          }
        }

        // Upload business registration if exists
        if (formData.businessRegistration) {
          try {
            const registrationUrl = await uploadFileToStorage(formData.businessRegistration, 'registration');
            if (registrationUrl) {
              formFields.registrationUrl = registrationUrl;
              setFormData(prev => ({
                ...prev,
                registrationUrl: registrationUrl
              }));
            } else {
              throw new Error('Failed to upload registration file');
            }
          } catch (error) {
            console.error('Error uploading registration:', error);
            throw new Error('Failed to upload registration file. Please try again.');
          }
        }

        // First, add all form fields to FormData
        Object.entries(formFields).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Handle nested objects (like operatingHours) by stringifying them
            if (typeof value === 'object' && !(value instanceof File)) {
              formDataToSend.append(key, JSON.stringify(value));
            } else {
              formDataToSend.append(key, String(value));
            }
          }
        });

        // Explicitly append the file URLs to ensure they're included
        if (formData.licenseUrl) {
          formDataToSend.append('licenseUrl', formData.licenseUrl);
          console.log('Appended licenseUrl to form data:', formData.licenseUrl);
        }
        if (formData.registrationUrl) {
          formDataToSend.append('registrationUrl', formData.registrationUrl);
          console.log('Appended registrationUrl to form data:', formData.registrationUrl);
        }

        // Log the complete form data for debugging
        console.log('Form data being sent:', Object.fromEntries(formDataToSend.entries()));
      } catch (error) {
        console.error('Error uploading files:', error);
        throw new Error('Failed to upload one or more files. Please try again.');
      }

      // Log the data being sent for debugging
      console.log('Submitting pharmacy profile with data:', {
        ...formFields,
        profileImage: formData.profileImage ? 'File attached' : 'No file'
      });

      // Call Supabase API to create/update user profile
      const response = await fetch("/api/user/profile", {
        method: "POST",
        body: formDataToSend,
        // Don't set Content-Type header - let the browser set it with the correct boundary
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      if (!response.ok) {
        console.error('API Error:', responseData);
        throw new Error(responseData.error || responseData.message || "Failed to create profile");
      }

      // Show success message
      toast({
        title: "Profile Created Successfully!",
        description: "Your pharmacy profile has been created. You can now sign in to access your account.",
      });

      // Store email for dashboard access
      localStorage.setItem("userEmail", email);

      // Redirect to signin page after a short delay
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error: unknown) {
      console.error('Error in form submission:', error);
      let errorMessage = "Profile creation failed. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setErrors({
        submit: errorMessage,
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

  const insuranceProviders = [
    "National Health Insurance",
    "Blue Cross",
    "Aetna",
    "Cigna",
    "UnitedHealthcare",
    "Kaiser Permanente",
    "Humana",
    "Medicare",
    "Medicaid",
  ];

  const getFieldError = (field: string) => {
    return errors[field] ? (
      <p className="text-sm text-red-600 mt-1">{errors[field]}</p>
    ) : null;
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
            <Pill className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Pharmacy Registration
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

            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Pharmacy Information
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Let&apos;s start with your pharmacy&apos;s basic details
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

                  <div>
                    <Label htmlFor="pharmacyName">
                      Pharmacy Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pharmacyName"
                      value={formData.pharmacyName}
                      onChange={(e) =>
                        updateFormData("pharmacyName", e.target.value)
                      }
                      placeholder="Enter your pharmacy name"
                      className={errors.pharmacyName ? "border-red-500" : ""}
                    />
                    {getFieldError("pharmacyName")}
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
                      <Label htmlFor="contactPersonFirstName">
                        Contact Person First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactPersonFirstName"
                        value={formData.contactPersonFirstName}
                        onChange={(e) =>
                          updateFormData("contactPersonFirstName", e.target.value)
                        }
                        placeholder="Enter first name"
                        className={errors.contactPersonFirstName ? "border-red-500" : ""}
                      />
                      {getFieldError("contactPersonFirstName")}
                    </div>
                    <div>
                      <Label htmlFor="contactPersonLastName">
                        Contact Person Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactPersonLastName"
                        value={formData.contactPersonLastName}
                        onChange={(e) =>
                          updateFormData("contactPersonLastName", e.target.value)
                        }
                        placeholder="Enter last name"
                        className={errors.contactPersonLastName ? "border-red-500" : ""}
                      />
                      {getFieldError("contactPersonLastName")}
                    </div>
                    <div>
                      <Label htmlFor="phone">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          updateFormData("phone", e.target.value)
                        }
                        placeholder="+234 xxx xxx xxxx"
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {getFieldError("phone")}
                    </div>
                    <div>
                      <Label htmlFor="country">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) =>
                          updateFormData("country", value)
                        }
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

                  <div className="grid md:grid-cols-2 gap-4">
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
                        required
                      />
                      {getFieldError("city")}
                    </div>
                    <div>
                      <Label htmlFor="yearEstablished">
                        Year Established <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="yearEstablished"
                        type="number"
                        value={formData.yearEstablished}
                        onChange={(e) =>
                          updateFormData("yearEstablished", e.target.value)
                        }
                        placeholder="e.g., 2010"
                        className={
                          errors.yearEstablished ? "border-red-500" : ""
                        }
                        required
                      />
                      {getFieldError("yearEstablished")}
                    </div>
                  </div>



                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) =>
                        updateFormData("website", e.target.value)
                      }
                      placeholder="https://yourpharmacy.com"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Pharmacy Images */}
              {currentStep === 2 && (
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
                      Pharmacy Photo
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Add a clear photo of your pharmacy store to build trust with customers
                    </p>
                  </div>

                  <div className="space-y-4">
                    {formData.profileImage && (
                      <div className="flex justify-center mb-4">
                        <div className="relative w-full max-w-2xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.profileImage instanceof File ? URL.createObjectURL(formData.profileImage) : ''}
                            alt="Pharmacy Profile"
                            className="w-full h-auto max-h-96 object-contain rounded-lg border p-2 bg-transparent"
                            onLoad={(e) => {
                              if (formData.profileImage instanceof File) {
                                URL.revokeObjectURL(e.currentTarget.src);
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {errors.pharmacyImages && (
                      <p className="text-sm text-red-600 text-center mt-2">
                        {errors.pharmacyImages}
                      </p>
                    )}

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        Upload Pharmacy Profile Photo
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Add a professional photo of your pharmacy
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePharmacyImagesUpload}
                        className="hidden"
                        id="pharmacyImages"
                      />
                      <label htmlFor="pharmacyImages">
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
              )}

              {/* Step 3: Legal & Location */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Legal & Location
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Provide your licensing and location details
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="address">
                      Full Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                      placeholder="Enter your complete pharmacy address including street, building number, etc."
                      className={`min-h-[100px] mb-4 ${errors.address ? "border-red-500" : ""}`}
                      required
                    />
                    {getFieldError("address")}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNumber">
                        Pharmacy License Number{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={(e) =>
                          updateFormData("licenseNumber", e.target.value)
                        }
                        placeholder="Enter license number"
                        className={errors.licenseNumber ? "border-red-500" : ""}
                      />
                      {getFieldError("licenseNumber")}
                    </div>
                    <div>
                      <Label htmlFor="registrationNumber">
                        Business Registration Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={(e) =>
                          updateFormData("registrationNumber", e.target.value)
                        }
                        placeholder="Enter registration number"
                        className={errors.registrationNumber ? "border-red-500" : ""}
                        required
                      />
                      {getFieldError("registrationNumber")}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Pharmacy Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        updateFormData("description", e.target.value)
                      }
                      placeholder="Describe your pharmacy, specialties, and what makes you unique (minimum 30 characters)"
                      className={`min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
                      required
                    />
                    {getFieldError("description")}
                  </div>

                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        Pharmacy License
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Upload a clear photo or PDF file of your pharmacy license
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, "pharmacyLicense")}
                        className="hidden"
                        id="pharmacyLicense"
                      />
                      <label htmlFor="pharmacyLicense">
                        <Button variant="outline" asChild>
                          <span className="cursor-pointer">
                            {formData.pharmacyLicense
                              ? "File Selected"
                              : "Choose File"}
                          </span>
                        </Button>
                      </label>
                      {formData.pharmacyLicense && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {formData.pharmacyLicense.name}
                        </p>
                      )}
                    </div>

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        Business Registration
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Upload your business registration certificate
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleFileUpload(e, "businessRegistration")
                        }
                        className="hidden"
                        id="businessRegistration"
                      />
                      <label htmlFor="businessRegistration">
                        <Button variant="outline" asChild>
                          <span className="cursor-pointer">
                            {formData.businessRegistration
                              ? "File Selected"
                              : "Choose File"}
                          </span>
                        </Button>
                      </label>
                      {formData.businessRegistration && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {formData.businessRegistration.name}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Services & Operations */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Services & Operations
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Configure your services and operating hours
                    </p>
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      Services Offered
                    </Label>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {Object.entries(formData.services).map(
                        ([service, enabled]) => (
                          <div
                            key={service}
                            className="flex items-center space-x-2"
                          >
                            <Switch
                              id={service}
                              checked={enabled}
                              onCheckedChange={(checked) =>
                                updateNestedFormData(
                                  "services",
                                  service,
                                  checked
                                )
                              }
                            />
                            <Label htmlFor={service} className="capitalize">
                              {service.replace(/([A-Z])/g, " $1").trim()}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="deliveryRadius">
                        Delivery Radius (km)
                      </Label>
                      <Input
                        id="deliveryRadius"
                        type="number"
                        value={formData.deliveryRadius}
                        onChange={(e) =>
                          updateFormData("deliveryRadius", e.target.value)
                        }
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryFee">Delivery Fee (USDC)</Label>
                      <Input
                        id="deliveryFee"
                        type="number"
                        step="0.01"
                        value={formData.deliveryFee}
                        onChange={(e) =>
                          updateFormData("deliveryFee", e.target.value)
                        }
                        placeholder="2.50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minimumOrderValue">
                        Minimum Order (USDC)
                      </Label>
                      <Input
                        id="minimumOrderValue"
                        type="number"
                        step="0.01"
                        value={formData.minimumOrderValue}
                        onChange={(e) =>
                          updateFormData("minimumOrderValue", e.target.value)
                        }
                        placeholder="10.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      Operating Hours
                    </Label>
                    <div className="space-y-3 mt-3">
                      {Object.entries(formData.operatingHours).map(
                        ([day, hours]) => (
                          <div
                            key={day}
                            className="flex items-center space-x-4"
                          >
                            <div className="w-20">
                              <Switch
                                checked={hours.isOpen}
                                onCheckedChange={(checked) =>
                                  updateOperatingHours(day, "isOpen", checked)
                                }
                              />
                            </div>
                            <div className="w-24 capitalize font-medium">
                              {day}
                            </div>
                            {hours.isOpen ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) =>
                                    updateOperatingHours(
                                      day,
                                      "open",
                                      e.target.value
                                    )
                                  }
                                  className="w-32"
                                />
                                <span>to</span>
                                <Input
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) =>
                                    updateOperatingHours(
                                      day,
                                      "close",
                                      e.target.value
                                    )
                                  }
                                  className="w-32"
                                />
                              </div>
                            ) : (
                              <span className="text-gray-500">Closed</span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Switch
                        id="acceptsInsurance"
                        checked={formData.acceptsInsurance}
                        onCheckedChange={(checked) =>
                          updateFormData("acceptsInsurance", checked)
                        }
                      />
                      <Label
                        htmlFor="acceptsInsurance"
                        className="text-base font-medium"
                      >
                        Accept Insurance
                      </Label>
                    </div>
                    {formData.acceptsInsurance && (
                      <div className="grid grid-cols-2 gap-3">
                        {insuranceProviders.map((provider) => (
                          <div
                            key={provider}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={provider}
                              checked={formData.insuranceProviders.includes(
                                provider
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateFormData("insuranceProviders", [
                                    ...formData.insuranceProviders,
                                    provider,
                                  ]);
                                } else {
                                  updateFormData(
                                    "insuranceProviders",
                                    formData.insuranceProviders.filter(
                                      (p) => p !== provider
                                    )
                                  );
                                }
                              }}
                            />
                            <Label htmlFor={provider} className="text-sm">
                              {provider}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 5: Review & Submit */}
              {currentStep === 5 && (
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
                      Review & Submit
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Review your information before submitting
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {formData.pharmacyName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {formData.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {formData.address}
                        </p>
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
                            License:
                          </span>
                          <p className="font-medium">
                            {formData.licenseNumber}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">
                            Established:
                          </span>
                          <p className="font-medium">
                            {formData.yearEstablished || "Not specified"}
                          </p>
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

                      <div>
                        <h4 className="font-medium mb-2">Services</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(formData.services)
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            .filter(([_, enabled]) => enabled)
                            .map(([service]) => (
                              <span
                                key={service}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full capitalize"
                              >
                                {service.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            ))}
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
                        Document review within 24-48 hours
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Email verification link will be sent if approved
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Access to pharmacy dashboard
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Start receiving prescription orders
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
                      </a>
                      ,{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                      , and{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Pharmacy Guidelines
                      </a>
                    </Label>
                  </div>
                  {errors.policy && (
                    <p className="text-sm text-red-600 mt-1">{errors.policy}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center bg-transparent"
                type="button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === totalSteps ? (
                <form onSubmit={handleSubmit} className="m-0">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !agreedToPolicy}
                    className={`bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white flex items-center ${
                      !agreedToPolicy ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={!agreedToPolicy ? 'Please agree to the terms and conditions' : ''}
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
                </form>
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
