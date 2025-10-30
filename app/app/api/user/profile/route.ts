import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isFile(value: unknown): value is File {
  return value instanceof File ||
        (typeof value === 'object' &&
          value !== null &&
          'name' in value &&
          'size' in value &&
          'type' in value);
}

interface Certification {
  type: string;
  url: string;
  name: string;
  uploadedAt: string;
}

interface FormData {
  [key: string]: unknown;
  email?: string;
  walletAddress?: string;
  publicKey?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  isVerified?: string | boolean;
  profileImage?: string | null;
  occupation?: string;
  tribe?: string;
  maritalStatus?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  pharmacyImages?: Array<{ url: string; name?: string }>;
}

interface ProfileData extends Omit<FormData, 'isVerified'> {
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  userType?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

async function uploadFile(
  file: File,
  folder: string,
  bucketName: string
): Promise<string | null> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload the file to the specified bucket
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadFile:", {
      error,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      bucketName,
    });
    throw error;
  }
}

async function parseFormData(
  request: Request
): Promise<FormData> {
  const formData = await request.formData();
  const data: FormData = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(
        `- ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`
      );
    } else {
      console.log(`- ${key}:`, value);
    }
  }

  // Convert FormData to a plain object
  for (const [key, value] of formData.entries()) {
    // Handle array fields (like insurance_providers, languages, etc.)
    if (key.endsWith("[]")) {
      const fieldName = key.replace("[]", "");
      if (!(data[fieldName] as unknown[] | undefined)) {
        data[fieldName] = [];
      }
      (data[fieldName] as unknown[]).push(value);
    }
    // Handle JSON string fields (like operatingHours, availability, certifications, etc.)
    else if (
      typeof value === "string" &&
      (value.startsWith("{") || value.startsWith("["))
    ) {
      try {
        data[key] = JSON.parse(value);

        // Special handling for certifications array
        if (key === "certifications" && Array.isArray(data[key])) {
          // Ensure each certification has the required fields
          data[key] = (data[key] as Certification[]).map((cert) => ({
            type: cert.type || "unknown",
            url: cert.url || "",
            name: cert.name || "Document",
            uploadedAt: cert.uploadedAt || new Date().toISOString(),
          }));
        }
      } catch (e) {
        console.error("Error parsing field:", key, e);
        data[key] = value;
      }
    }
    // Handle file uploads
    else if (value instanceof File) {
      data[key] = value;
    }
    // Handle boolean values
    else if (value === "true" || value === "false") {
      data[key] = value === "true";
    }
    // Handle number values
    else if (!isNaN(Number(value)) && value !== "") {
      data[key] = Number(value);
    }
    // Handle all other string values
    else {
      data[key] = value;
    }
  }

  // Process file uploads
  for (const [key, file] of Object.entries(data)) {
    if (!(file instanceof File)) {
      continue;
    }

    try {
      if (file.size === 0) {
        console.log(`Skipping empty file for ${key}`);
        continue;
      }

      // Determine the folder and bucket based on the field name
      let folder = "documents";
      let bucketName = "pharmacy-documents";

      if (key === "profileImage") {
        folder = "profile-images";
        bucketName = "profile_images";
        console.log(`Processing profile image upload (${file.name}, ${file.size} bytes)`);
      } else if (key === "pharmacyLicense") {
        folder = "licenses";
      } else if (key === "businessRegistration") {
        folder = "registrations";
      } else if (key.includes("profile")) {
        // Catch-all for other profile-related files
        folder = "profile-images";
        bucketName = "profile_images";
      }

      console.log(`Uploading ${key} to ${bucketName}/${folder}`);
      const url = await uploadFile(file, folder, bucketName);

      if (url) {
        console.log(`Upload successful for ${key}:`, url);
        // Map the file field to the correct URL field
        if (key === "pharmacyLicense") {
          data.licenseUrl = url;
        } else if (key === "businessRegistration") {
          data.registrationUrl = url;
        } else if (key === "profileImage" || key.includes("profile")) {
          // Handle profile image specifically to ensure it's set correctly
          data.profileImage = url;
          console.log(`Profile image URL set to: ${url}`);
          
          // Also update the profileImage field in the form data
          if (data.userType === 'patient' && data.walletAddress) {
            // Update patient_profiles table
            const { error: patientError } = await supabase
              .from('patient_profiles')
              .update({ profile_image: url })
              .eq('wallet_address', data.walletAddress);
              
            if (patientError) {
              console.error('Error updating patient profile image:', patientError);
            } else {
              console.log('Patient profile image updated successfully');
            }
          } else if (data.userType === 'doctor' && data.walletAddress) {
            // Update doctor_profiles table
            const { error: doctorError } = await supabase
              .from('doctor_profiles')
              .update({ profile_image: url })
              .eq('wallet_address', data.walletAddress);
              
            if (doctorError) {
              console.error('Error updating doctor profile image:', doctorError);
            } else {
              console.log('Doctor profile image updated successfully');
            }
          }
        } else {
          data[key] = url;
        }
      } else {
        console.error(`Upload failed for ${key}: No URL returned`);
      }
    } catch (error) {
      console.error(`Error processing file field ${key}:`, error);
    }
  }

  return data;
}

export async function POST(request: Request) {
  // Initialize Supabase client inside the function to ensure it's available in all scopes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  try {
    // Log database schema for debugging
    try {
      const { data: columns, error: schemaError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "pharmacy_profiles");

      if (!schemaError) {
        console.log("Pharmacy profiles table schema:", columns);
      } else {
        console.error("Error fetching pharmacy_profiles schema:", schemaError);
      }
    } catch (schemaError) {
      console.error("Error checking database schema:", schemaError);
    }

    // Parse the form data
    const formData = await parseFormData(request);
    const userType = formData.userType;

    if (!userType) {
      return NextResponse.json(
        { error: "User type is required" },
        { status: 400 }
      );
    }

    // Prepare base user data that's common across all user types
    const baseData = {
      email: formData.email,
      walletAddress: formData.walletAddress,
      publicKey: formData.publicKey,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      country: formData.country,
      city: formData.city,
      address: formData.address,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      isVerified: formData.isVerified === "true" || false,
      profileImage: formData.profileImage || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let profileData: ProfileData = { ...baseData };

    // Handle user type specific data
    switch (userType) {
      case "patient":
        profileData = {
          ...profileData,
          userType: "patient",
          occupation: formData.occupation,
          tribe: formData.tribe,
          maritalStatus: formData.maritalStatus,
          emergencyContact: formData.emergencyContact,
          emergencyContactPhone: formData.emergencyContactPhone,
          medicalHistory: formData.medicalHistory,
          allergies: formData.allergies,
          currentMedications: formData.currentMedications,
        };
        break;

      case "doctor":
        const availability = {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        };

        // Handle languages - ensure it's always an array
        let languages: string[] = [];
        if (formData.languages) {
          try {
            // Try to parse as JSON first (if it was stringified)
            if (typeof formData.languages === "string") {
              try {
                const parsed = JSON.parse(formData.languages);
                languages = Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                // If not valid JSON, treat as comma-separated string
                languages = formData.languages
                  .split(",")
                  .map((lang: string) => lang.trim());
              }
            } else if (Array.isArray(formData.languages)) {
              languages = formData.languages;
            }
          } catch (error) {
            console.error("Error processing languages:", error);
            // Ensure we always have a valid array
            languages = [];
          }
        }

        console.log("Processed languages:", languages);
        console.log("Profile image from form data:", {
          type: typeof formData.profileImage,
          isFile: isFile(formData.profileImage),
          value:
            isFile(formData.profileImage)
              ? `File: ${formData.profileImage.name} (${formData.profileImage.size} bytes)`
              : formData.profileImage,
        });

        profileData = {
          ...profileData,
          userType: "doctor",
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          yearsOfExperience: formData.yearsOfExperience,
          education: formData.education,
          hospitalAffiliation: formData.hospitalAffiliation,
          bio: formData.bio,
          consultationFee: formData.consultationFee,
          medicalLicense: formData.medicalLicense,
          medicalDegree: formData.medicalDegree,
          availability: availability,
          languages: languages,
          profileImage: formData.profileImage || profileData.profileImage,
        };

        console.log(
          "Final profile data before save:",
          JSON.stringify(profileData, null, 2)
        );
        break;

      case "pharmacy":
        console.log("Processing pharmacy profile data:", {
          formData: Object.keys(formData),
          licenseUrl: formData.licenseUrl,
          registrationUrl: formData.registrationUrl,
          profileImage: formData.profileImage,
        });

        // Parse operating hours from JSON string if it's a string
        let operatingHours = {};
        if (formData.operatingHours) {
          try {
            operatingHours =
              typeof formData.operatingHours === "string"
                ? JSON.parse(formData.operatingHours)
                : formData.operatingHours;
          } catch (e) {
            console.error("Error parsing operating hours:", e);
            operatingHours = {};
          }
        }

        // Parse insurance providers from JSON string if it's a string
        let insuranceProviders: string[] = [];
        if (formData.insuranceProviders) {
          try {
            insuranceProviders =
              typeof formData.insuranceProviders === "string"
                ? JSON.parse(formData.insuranceProviders)
                : Array.isArray(formData.insuranceProviders)
                ? formData.insuranceProviders
                : [];
          } catch (e) {
            console.error("Error parsing insurance providers:", e);
            insuranceProviders = [];
          }
        }

        // Ensure file URLs are properly handled
        const licenseUrl = formData.licenseUrl || null;
        const registrationUrl = formData.registrationUrl || null;
        const profileImage = formData.profileImage || null;

        console.log("Processed file URLs:", {
          licenseUrl,
          registrationUrl,
          profileImage,
        });

        profileData = {
          ...profileData,
          userType: "pharmacy",
          pharmacyName: formData.pharmacyName,
          contactPersonFirstName: formData.contactPersonFirstName,
          contactPersonLastName: formData.contactPersonLastName,
          licenseNumber: formData.licenseNumber,
          licenseUrl: licenseUrl,
          registrationNumber: formData.registrationNumber,
          registrationUrl: registrationUrl,
          yearEstablished: formData.yearEstablished,
          website: formData.website,
          description: formData.description,
          operatingHours: operatingHours,
          deliveryRadiusKm: formData.deliveryRadiusKm || 0,
          deliveryFee: formData.deliveryFee || "0",
          minimumOrderValue: formData.minimumOrderValue || "0",
          acceptsInsurance:
            formData.acceptsInsurance === "true" ||
            formData.acceptsInsurance === true,
          insuranceProviders: insuranceProviders,
          services: {
            prescription:
              formData.prescription === "true" ||
              formData.prescription === true,
            otc: formData.otc === "true" || formData.otc === true,
            homeDelivery:
              formData.homeDelivery === "true" ||
              formData.homeDelivery === true,
            consultation:
              formData.consultation === "true" ||
              formData.consultation === true,
            vaccination:
              formData.vaccination === "true" || formData.vaccination === true,
          },
          pharmacyImages: formData.pharmacyImages || [],
          profileImage: profileImage,
        };

        console.log("Final pharmacy profile data being saved:", {
          ...profileData,
          operatingHours: "[OPERATING_HOURS_OBJECT]",
          insuranceProviders: profileData.insuranceProviders,
          services: profileData.services,
          pharmacyImages: Array.isArray(profileData.pharmacyImages) ? profileData.pharmacyImages.length : 0,
        });
        break;

      case "admin":
        profileData = {
          ...profileData,
          userType: "admin",
          role: formData.role || "admin",
          department: formData.department,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid user type" },
          { status: 400 }
        );
    }

    // Start a transaction to ensure data consistency
    let userProfile;

    // First, create or update the user profile
    console.log("Upserting user profile with data:", {
      email: profileData.email,
      user_type: profileData.userType,
    });

    // First, try to find an existing user profile by email
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", profileData.email)
      .maybeSingle();

    let userData;
    let userError;

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          user_type: profileData.userType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single();
      userData = data;
      userError = error;
    } else {
      // Insert new user
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          email: profileData.email,
          user_type: profileData.userType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      userData = data;
      userError = error;
    }

    if (userError) {
      console.error("Error in user profile upsert:", userError);
      throw new Error(
        `Failed to create/update user profile: ${userError.message}`
      );
    }

    console.log("User profile upserted successfully:", userData);

    // Handle user type specific data upsert
    if (profileData.userType === "patient") {
      const { data: patientProfile, error: patientError } = await supabase
        .from("patient_profiles")
        .upsert({
          user_profile_id: userData.id,
          wallet_address: profileData.walletAddress, // Add wallet address to patient profile
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          country: profileData.country,
          city: profileData.city,
          address: profileData.address,
          date_of_birth: profileData.dateOfBirth,
          gender: profileData.gender,
          occupation: profileData.occupation,
          tribe: profileData.tribe,
          marital_status: profileData.maritalStatus,
          emergency_contact: profileData.emergencyContact,
          emergency_contact_phone: profileData.emergencyContactPhone,
          medical_history: profileData.medicalHistory,
          allergies: profileData.allergies,
          current_medications: profileData.currentMedications,
          profile_image: profileData.profileImage,
          updated_at: new Date().toISOString(),
          ...(!existingUser && { created_at: new Date().toISOString() }),
        })
        .eq("user_profile_id", userData.id)
        .select()
        .single();

      if (patientError) {
        console.error("Error in patient profile upsert:", patientError);
        throw new Error(
          `Failed to create/update patient profile: ${patientError.message}`
        );
      }

      console.log("Patient profile upserted successfully:", patientProfile);
    }
    // For doctor profiles, handle the doctor-specific data
    else if (profileData.userType === "doctor") {
      console.log("Upserting doctor profile with data:", {
        user_profile_id: userData.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        // ... other doctor fields
      });

      // First, check if a doctor profile already exists for this user
      const { data: existingDoctor } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_profile_id", userData.id)
        .maybeSingle();

      let doctorData;
      let doctorError;

      if (existingDoctor) {
        // Update existing doctor profile
        const { data, error } = await supabase
          .from("doctor_profiles")
          .update({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            country: profileData.country,
            city: profileData.city,
            date_of_birth: profileData.dateOfBirth,
            gender: profileData.gender,
            specialization: profileData.specialty,
            license_number: profileData.licenseNumber,
            years_of_experience: profileData.yearsOfExperience,
            education: profileData.education,
            languages: profileData.languages,
            consultation_fee: profileData.consultationFee,
            wallet_address: profileData.walletAddress,
            profile_image: profileData.profileImage,
            bio: profileData.bio,
            availability_schedule: profileData.availability,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingDoctor.id)
          .select()
          .single();
        doctorData = data;
        doctorError = error;
      } else {
        // Insert new doctor profile
        const { data, error } = await supabase
          .from("doctor_profiles")
          .insert({
            user_profile_id: userData.id,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            country: profileData.country,
            city: profileData.city,
            date_of_birth: profileData.dateOfBirth,
            gender: profileData.gender,
            specialization: profileData.specialty,
            license_number: profileData.licenseNumber,
            years_of_experience: profileData.yearsOfExperience,
            education: profileData.education,
            languages: profileData.languages,
            consultation_fee: profileData.consultationFee,
            wallet_address: profileData.walletAddress,
            profile_image: profileData.profileImage,
            bio: profileData.bio,
            availability_schedule: profileData.availability,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        doctorData = data;
        doctorError = error;
      }

      if (doctorError) {
        console.error("Error in doctor profile upsert:", doctorError);
        throw new Error(
          `Failed to create/update doctor profile: ${doctorError.message}`
        );
      }

      console.log("Doctor profile upserted successfully:", doctorData);

      // Combine user and doctor data for the response
      userProfile = {
        ...userData,
        ...doctorData,
        firstName: doctorData.first_name,
        lastName: doctorData.last_name,
        dateOfBirth: doctorData.date_of_birth,
        walletAddress: doctorData.wallet_address,
        profileImage: doctorData.profile_image,
        availability: doctorData.availability_schedule,
      };
    } else if (profileData.userType === "pharmacy") {
      // Handle pharmacy profiles
      console.log("Upserting pharmacy profile with data:", {
        user_profile_id: userData.id,
        pharmacy_name: profileData.pharmacyName,
        // ... other pharmacy fields
      });

      try {
        // Log incoming data for debugging
        console.log("Received pharmacy data:", {
          licenseUrl: profileData.licenseUrl,
          registrationUrl: profileData.registrationUrl,
          hasLicenseFile: !!profileData.pharmacyLicense,
          hasRegistrationFile: !!profileData.businessRegistration,
        });

        // First, check if a pharmacy profile already exists for this user
        const { data: existingPharmacy, error: findPharmacyError } =
          await supabase
            .from("pharmacy_profiles")
            .select("*")
            .eq("user_profile_id", userData.id)
            .maybeSingle();

        if (findPharmacyError) {
          console.error("Error finding pharmacy profile:", findPharmacyError);
          throw new Error(
            `Error checking for existing pharmacy profile: ${findPharmacyError.message}`
          );
        }

        interface PharmacyProfile {
          id: string;
          user_id: string;
          [key: string]: unknown;
        }

        let pharmacyData: PharmacyProfile | null = null;
        const operation = existingPharmacy ? "update" : "insert";

        console.log(
          `Performing ${operation} operation for pharmacy profile with user ID: ${userData.id}`
        );
        console.log("Existing pharmacy data:", existingPharmacy);

        const profileDataToUpsert = {
          ...(existingPharmacy ? {} : { user_profile_id: userData.id }),
          pharmacy_name: profileData.pharmacyName,
          contact_person_first_name: profileData.contactPersonFirstName,
          contact_person_last_name: profileData.contactPersonLastName,
          license_number: profileData.licenseNumber,
          registration_number: profileData.registrationNumber,
          year_established: profileData.yearEstablished,
          website: profileData.website || null,
          description: profileData.description,
          operating_hours: profileData.operatingHours,
          delivery_radius_km: profileData.deliveryRadiusKm,
          delivery_fee: profileData.deliveryFee,
          minimum_order_value: profileData.minimumOrderValue,
          accepts_insurance: profileData.acceptsInsurance || false,
          insurance_providers: profileData.insuranceProviders || [],
          services: profileData.services || {
            prescription: true,
            otc: true,
            homeDelivery: true,
            consultation: false,
            vaccination: false,
          },
          wallet_address: profileData.walletAddress,
          phone: profileData.phone,
          country: profileData.country,
          city: profileData.city,
          address: profileData.address || null,
          profile_image: profileData.profileImage || null,
          license_url: profileData.licenseUrl || null,
          registration_url: profileData.registrationUrl || null,
          is_verified: false,
          updated_at: new Date().toISOString(),
          ...(existingPharmacy ? {} : { created_at: new Date().toISOString() }),
        };

        // Log the data being used for upsert
        const logData = { ...profileDataToUpsert };
        // Don't log the entire operating hours object as it's large
        logData.operating_hours = logData.operating_hours
          ? "[OPERATING_HOURS_OBJECT]"
          : null;
        logData.insurance_providers = logData.insurance_providers || [];

        console.log("=== Pharmacy Profile Data for Upsert ===");
        console.log("License URL being set to:", logData.license_url);
        console.log("Registration URL being set to:", logData.registration_url);
        console.log("Full upsert data:", JSON.stringify(logData, null, 2));

        const { data, error } = existingPharmacy
          ? await supabase
              .from("pharmacy_profiles")
              .update(profileDataToUpsert)
              .eq("id", existingPharmacy.id)
              .select()
              .single()
          : await supabase
              .from("pharmacy_profiles")
              .insert(profileDataToUpsert)
              .select()
              .single();

        if (error) {
          console.error(`Error during pharmacy profile ${operation}:`, error);
          console.error("Error details:", {
            code: error.code,
            details: error.details,
            hint: error.hint,
            message: error.message,
          });
          throw new Error(
            `Failed to ${operation} pharmacy profile: ${error.message}`
          );
        }

        if (!data) {
          throw new Error(`No data returned after ${operation} operation`);
        }

        pharmacyData = data;
        console.log(
          `Pharmacy profile ${operation}d successfully:`,
          pharmacyData
        );

        // Combine user and pharmacy data for the response
        if (!pharmacyData) {
          throw new Error("Pharmacy data is not available");
        }

        userProfile = {
          ...userData,
          ...pharmacyData,
          pharmacyName: pharmacyData.pharmacy_name,
          contactPersonFirstName: pharmacyData.contact_person_first_name,
          contactPersonLastName: pharmacyData.contact_person_last_name,
          licenseNumber: pharmacyData.license_number,
          licenseUrl: pharmacyData.license_url,
          registrationNumber: pharmacyData.registration_number,
          registrationUrl: pharmacyData.registration_url,
          yearEstablished: pharmacyData.year_established,
          operatingHours: pharmacyData.operating_hours,
          deliveryRadiusKm: pharmacyData.delivery_radius_km,
          deliveryFee: pharmacyData.delivery_fee,
          minimumOrderValue: pharmacyData.minimum_order_value,
          acceptsInsurance: pharmacyData.accepts_insurance,
          insuranceProviders: pharmacyData.insurance_providers,
          services: pharmacyData.services,
          certifications: pharmacyData.certifications || [],
        };
      } catch (error) {
        console.error("Error in pharmacy profile processing:", error);
        throw error;
      }
    } else {
      userProfile = {
        ...userData,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dateOfBirth: profileData.dateOfBirth,
        walletAddress: profileData.walletAddress,
        profileImage: profileData.profileImage,
        availability: profileData.availability,
      };
    }

    return NextResponse.json(
      {
        success: true,
        data: userProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("===== ERROR IN PROFILE API ROUTE =====");
    console.error("Raw error object:", error);

    // Log Supabase error details if available
    if (error && typeof error === "object") {
      console.error("Error details:", {
        name: error,
      });
    }

    // Log the current database schema for debugging
    try {
      const { data: columns, error: schemaError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "users");

      if (!schemaError) {
        console.log("Current users table schema:", columns);
      } else {
        console.error("Error fetching schema:", schemaError);
      }
    } catch (schemaError) {
      console.error("Error while trying to fetch schema:", schemaError);
    }

    // Define error types for better type safety
    interface ErrorWithCode extends Error {
      code?: string;
      hint?: string;
    }

    interface ErrorObject {
      message?: string;
      [key: string]: unknown;
    }

    // Safely extract error information
    let errorMessage = "Unknown error occurred";
    const errorDetails: Record<string, unknown> = {};

    if (error) {
      if (error instanceof Error) {
        const typedError = error as ErrorWithCode;
        errorMessage = error.message || errorMessage;
        
        const details: Record<string, unknown> = {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        };
        
        if (typedError.code) details.code = typedError.code;
        if (typedError.hint) details.hint = typedError.hint;
        
        Object.assign(errorDetails, details);
      } else if (typeof error === "object") {
        const errorObj = error as ErrorObject;
        errorMessage = errorObj.message ? String(errorObj.message) : JSON.stringify(error);
        Object.assign(errorDetails, error);
      } else {
        errorMessage = String(error);
      }
    }

    // Log the full error for debugging
    console.error("API Error Details:", {
      message: errorMessage,
      ...errorDetails,
    });

    // Return a clean error response
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(Object.keys(errorDetails).length > 0 && { details: errorDetails }),
      },
      { status: 500 }
    );
  }
}
