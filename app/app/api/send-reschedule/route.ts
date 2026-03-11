import { NextResponse } from "next/server";
import { sendRescheduleNotification } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientAuthId, patientName, doctorName, originalDate, originalTime, doctorMessage, recipientType } = body;

    // Fetch patient email bypassing RLS
    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from("user_profiles")
      .select("email")
      .eq("id", patientAuthId)
      .single();

    if (profileErr || !userProfile?.email) {
      console.error("Failed to fetch patient email:", profileErr);
      return NextResponse.json({ error: "Patient email not found" }, { status: 404 });
    }

    const to = userProfile.email;

    const result = await sendRescheduleNotification(to, {
      patientName,
      doctorName,
      originalDate,
      originalTime,
      doctorMessage,
      recipientType,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in /api/send-reschedule:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
