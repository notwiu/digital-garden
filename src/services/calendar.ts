
import { createClient } from "@/lib/supabase/client";
import { syncGoogleCalendarSafely } from "./google-calendar";

export const EVENT_CATEGORIES = {
  Pessoal: "#8B78B4",
  Universidade: "#647EAE",
  Trabalho: "#477B61",
  Projetos: "#E97836",
  Eventos: "#B99A57",
  Outros: "#92929B",
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  color: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  location: string;
  created_at: string;
  updated_at: string;
};

export type EventFields = Omit<
  CalendarEvent,
  "id" | "created_at" | "updated_at"
>;

async function context() {
  const db = createClient();

  const { data, error } = await db.auth.getUser();

  if (error || !data.user) {
    throw new Error("Sessão inválida.");
  }

  return { db, uid: data.user.id };
}

export async function listEvents(): Promise<CalendarEvent[]> {
  const { db, uid } = await context();

  const { data, error } = await db
    .from("calendar_events")
    .select("*")
    .eq("user_id", uid)
    .order("start_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as CalendarEvent[];
}

export async function saveEvent(
  fields: EventFields,
  id?: string
): Promise<CalendarEvent> {
  const { db, uid } = await context();

  const query = id
    ? db
      .from("calendar_events")
      .update(fields)
      .eq("id", id)
      .eq("user_id", uid)
    : db
      .from("calendar_events")
      .insert({ ...fields, user_id: uid });

  const { data, error } = await query
    .select("*")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();

  return data as CalendarEvent;
}

export async function updateEvent(
  id: string,
  fields: Partial<EventFields>
): Promise<CalendarEvent> {
  const { db, uid } = await context();

  const { data, error } = await db
    .from("calendar_events")
    .update(fields)
    .eq("id", id)
    .eq("user_id", uid)
    .select("*")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();

  return data as CalendarEvent;
}

export async function deleteEvent(id: string) {
  const { db, uid } = await context();

  const { error } = await db
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)
    .select("id")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();
}
