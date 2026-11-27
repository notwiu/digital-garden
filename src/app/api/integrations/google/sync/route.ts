
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { syncGoogleEvents } from "@/lib/integrations/google/sync";

export async function POST(request: Request) {
  const allowedOrigin = new URL(
    process.env.GOOGLE_REDIRECT_URI!
  ).origin;

  if (request.headers.get("origin") !== allowedOrigin) {
    return NextResponse.json(
      { error: "Origem não autorizada." },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const db = createAdminClient();

    const { data: connection, error } = await db
      .from("google_calendar_connections")
      .select("google_calendar_id,sync_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (
      !connection?.google_calendar_id ||
      !connection.sync_enabled
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
      });
    }

    const result = await syncGoogleEvents(user.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível sincronizar com o Google Calendar.",
      },
      { status: 500 }
    );
  }
}
