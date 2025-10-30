import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Helper function to get bucket and folder based on file type
function getUploadConfig(fileType: string) {
  switch (fileType) {
    case 'profile':
      return { bucket: 'profile_images', folder: 'profiles' };
    case 'license':
      return { bucket: 'certification_images', folder: 'licenses' };
    case 'registration':
      return { bucket: 'certification_images', folder: 'registrations' };
    default:
      return { bucket: 'documents', folder: 'misc' };
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get upload configuration based on file type
    const { bucket, folder } = getUploadConfig(fileType);
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = await supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Failed to generate public URL');
    }

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export const requestBodyParsing = false;

