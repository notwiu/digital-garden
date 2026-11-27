
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  ensureGoogleCalendar,
} from "@/lib/integrations/google/calendar";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  const allowedOrigin = new URL(
    process.env.GOOGLE_REDIRECT_URI!
  ).origin;

  if (origin !== allowedOrigin) {
    return NextResponse.json(
      { error: "Origem não autorizada." },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const calendarId = await ensureGoogleCalendar(user.id);

    return NextResponse.json({
      success: true,
      calendarId,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar o calendário." },
      { status: 500 }
    );
  }
}
