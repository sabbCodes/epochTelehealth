import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendVerificationStatusEmail } from "@/lib/email";

// Initialize with service role key to bypass RLS for admin actions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, profileId, role, action, reason } = body;

    if (!userId || !profileId || !role || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json({ error: "Reason is required for rejection" }, { status: 400 });
    }

    const table = role === 'pharmacy' ? 'pharmacy_profiles' : 'doctor_profiles';
    const isApproved = action === 'approve';

    // Update profile status
    const { data: profile, error: updateError } = await supabase
      .from(table)
      .update({
        is_verified: isApproved,
        verification_status: isApproved ? 'approved' : 'rejected',
        rejection_reason: isApproved ? null : reason,
      })
      .eq('id', profileId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile status:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Get user email
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!userError && userProfile?.email) {
      // Send email
      const name = role === 'pharmacy' ? profile.pharmacy_name : `Dr. ${profile.first_name} ${profile.last_name}`;
      await sendVerificationStatusEmail(
        userProfile.email,
        name || "User",
        isApproved ? 'approved' : 'rejected',
        role as 'doctor' | 'pharmacy',
        reason
      );
    }

    // Insert Notification
    const notifMessage = isApproved 
      ? `Congratulations! Your ${role} application has been approved.`
      : `Your ${role} application requires updates. Please check your settings.`;
      
    await supabase.from('notifications').insert({
      user_id: userId,
      title: `Application ${isApproved ? 'Approved' : 'Needs Updates'}`,
      message: notifMessage,
      type: isApproved ? 'success' : 'alert',
      read: false
    });

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
