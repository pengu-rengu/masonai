import { supabase } from "@/lib/supabase";

export interface ClassSection {
  title: string;
  startTime: string;
  endTime: string;
  days: string;
  building: string;
  room: string;
  instructor: string;
}

export interface Schedule {
  id: number;
  title: string;
  sections: ClassSection[];
}

function nowIso() {
  return new Date().toISOString();
}

export function formatTime(time: string) {
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

export async function fetchSchedules(): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("id, title, sections")
    .order("last_edited", { ascending: false });

  if (error) {
    alert("Failed to load schedules: " + error.message);
    return [];
  }

  return data as Schedule[];
}

export async function createSchedule(title: string): Promise<Schedule | null> {
  const { data, error } = await supabase
    .from("schedules")
    .insert({ title, sections: [], last_edited: nowIso() })
    .select("id, title, sections")
    .single();

  if (error || !data) {
    alert("Failed to create schedule: " + error?.message);
    return null;
  }

  return data as Schedule;
}

export async function updateScheduleSections(id: number, sections: ClassSection[]) {
  const { error } = await supabase
    .from("schedules")
    .update({ sections, last_edited: nowIso() })
    .eq("id", id);

  if (error) {
    alert("Failed to save schedule: " + error.message);
  }
}

export async function renameSchedule(id: number, title: string) {
  const { error } = await supabase
    .from("schedules")
    .update({ title, last_edited: nowIso() })
    .eq("id", id);

  if (error) {
    alert("Failed to rename schedule: " + error.message);
  }
}

export async function deleteSchedule(id: number) {
  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Failed to delete schedule: " + error.message);
  }
}
