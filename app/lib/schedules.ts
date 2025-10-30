import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

export interface Schedule {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  consultation_type: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export async function createSchedule(
  schedule: Omit<Schedule, "id" | "created_at" | "updated_at" | "status">
) {
  const { data, error } = await supabase
    .from("schedules")
    .insert([
      {
        ...schedule,
        id: uuidv4(),
        status: "scheduled",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
