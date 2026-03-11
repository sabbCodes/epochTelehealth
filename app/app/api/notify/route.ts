import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NotifyBody {
  notifications: {
    user_id: string;
    title: string;
    body: string;
    type?: "info" | "warning" | "action";
    schedule_id?: string;
  }[];
}

export async function POST(request: Request) {
  try {
    const { notifications }: NotifyBody = await request.json();

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ error: "No notifications provided" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .insert(notifications.map((n) => ({ ...n, type: n.type ?? "info" })));

    if (error) {
      console.error("Failed to insert notifications:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in /api/notify:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
