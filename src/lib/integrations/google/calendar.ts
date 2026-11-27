
import "server-only";

import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";
import { createGoogleOAuthClient } from "./oauth";
import { decryptToken } from "./crypto";

export async function getGoogleCalendar(userId: string) {
  const db = createAdminClient();

  const { data: connection, error } = await db
    .from("google_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !connection) {
    throw new Error("Google Calendar não conectado.");
  }

  const oauth = createGoogleOAuthClient();

  oauth.setCredentials({
    refresh_token: decryptToken(
      connection.refresh_token_encrypted
    ),
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth,
  });

  return { calendar, connection, db };
}

export async function ensureGoogleCalendar(userId: string) {
  const { calendar, connection, db } =
    await getGoogleCalendar(userId);

  if (connection.google_calendar_id) {
    return connection.google_calendar_id as string;
  }

  const { data } = await calendar.calendars.insert({
    requestBody: {
      summary: "Digital Garden",
      description:
        "Compromissos, projetos e tarefas do Digital Garden.",
      timeZone: "America/Recife",
    },
  });

  if (!data.id) {
    throw new Error("Não foi possível criar o calendário.");
  }

  const { error } = await db
    .from("google_calendar_connections")
    .update({
      google_calendar_id: data.id,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;

  return data.id;
}
