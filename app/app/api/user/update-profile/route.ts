import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const role = formData.get('role') as string;
    const id = formData.get('id') as string;

    if (!role || !id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const table = role === 'pharmacy' ? 'pharmacy_profiles' : 'doctor_profiles';
    const updates: Record<string, any> = {};

    // Parse common fields
    const bio = formData.get('bio');
    if (bio !== null) updates.bio = bio;
    
    const phone = formData.get('phone');
    if (phone !== null) updates.phone = phone;

    // Parse role-specific fields
    if (role === 'doctor') {
      const fee30Chat = formData.get('fee30Chat');
      if (fee30Chat !== null && fee30Chat !== '') updates.consultation_fee_30min_chat = parseFloat(fee30Chat as string);
      
      const fee30Video = formData.get('fee30Video');
      if (fee30Video !== null && fee30Video !== '') updates.consultation_fee_30min_video = parseFloat(fee30Video as string);

      const fee60Video = formData.get('fee60Video');
      if (fee60Video !== null && fee60Video !== '') updates.consultation_fee_60min_video = parseFloat(fee60Video as string);
      
      const medicalLicense = formData.get('medicalLicense');
      if (medicalLicense instanceof File && medicalLicense.size > 0) {
        const url = await uploadFile(medicalLicense, 'licenses', 'certification_images');
        if (url) updates.medical_license_url = url;
      }
    } else if (role === 'pharmacy') {
      const city = formData.get('city');
      if (city !== null) updates.city = city;

      const license = formData.get('pharmacyLicense');
      if (license instanceof File && license.size > 0) {
        const url = await uploadFile(license, 'pharmacy_licenses', 'certification_images');
        if (url) updates.license_url = url;
      }

      const registration = formData.get('businessRegistration');
      if (registration instanceof File && registration.size > 0) {
        const url = await uploadFile(registration, 'business_registrations', 'certification_images');
        if (url) updates.registration_url = url;
      }
    }

    // Automatically resubmit
    const finalUpdates = {
      ...updates,
      verification_status: 'pending',
      rejection_reason: null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(table)
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch all admins to notify them
    const { data: admins } = await supabase
      .from('admin_profiles')
      .select('user_profile_id');
      
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_profile_id,
        title: "Application Resubmitted",
        message: `A ${role} has updated their profile and resubmitted their application for review.`,
        type: "info",
        read: false
      }));
      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
