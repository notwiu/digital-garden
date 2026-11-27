
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
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

  const db = createAdminClient();

  const { data, error } = await db
    .from("google_calendar_connections")
    .select(`
      google_calendar_id,
      sync_enabled,
      last_sync_at,
      created_at
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Erro ao consultar integração." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      connected: Boolean(data),
      calendarReady: Boolean(data?.google_calendar_id),
      syncEnabled: data?.sync_enabled ?? false,
      lastSync: data?.last_sync_at ?? null,
      connectedAt: data?.created_at ?? null,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
