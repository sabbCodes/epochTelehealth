import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const [
      { count: allUserCount },
      { count: doctorCount },
      { count: pharmacyCount },
      { data: pendingDoctors },
      { data: pendingPharmacies },
      { data: schedulesData },
      { data: doctorsData },
    ] = await Promise.all([
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("doctor_profiles").select("*", { count: "exact", head: true }),
      supabase.from("pharmacy_profiles").select("*", { count: "exact", head: true }),
      supabase.from("doctor_profiles").select("*").eq("is_verified", false).eq("verification_status", "pending"),
      supabase.from("pharmacy_profiles").select("*").eq("is_verified", false).eq("verification_status", "pending"),
      supabase.from("schedules").select("doctor_id, status").eq("status", "completed"),
      supabase.from("doctor_profiles").select("id, user_profile_id, consultation_fee"),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        allUserCount,
        doctorCount,
        pharmacyCount,
        pendingDoctors,
        pendingPharmacies,
        schedulesData,
        doctorsData
      }
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
