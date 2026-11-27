
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  createGoogleOAuthClient,
} from "@/lib/integrations/google/oauth";

import {
  encryptToken,
} from "@/lib/integrations/google/crypto";


export async function GET(request: NextRequest) {
  const origin = new URL(
    process.env.GOOGLE_REDIRECT_URI!
  ).origin;

  function finish(status: string) {
    const response = NextResponse.redirect(
      new URL(`/?google=${status}`, origin)
    );

    for (const name of [
      "google_oauth_state",
      "google_oauth_user",
      "google_oauth_verifier",
    ]) {
      response.cookies.set(name, "", {
        path: "/api/integrations/google",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const savedState = request.cookies.get(
    "google_oauth_state"
  )?.value;

  const savedUser = request.cookies.get(
    "google_oauth_user"
  )?.value;

  const verifier = request.cookies.get(
    "google_oauth_verifier"
  )?.value;

  if (
    !code ||
    !state ||
    !savedState ||
    state !== savedState ||
    !verifier
  ) {
    return finish("invalid");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.id !== savedUser) {
    return finish("unauthorized");
  }

  try {
    const oauth = createGoogleOAuthClient();

    const { tokens } = await oauth.getToken({
      code,
      codeVerifier: verifier,
    });

    if (!tokens.refresh_token) {
      return finish("missing_token");
    }

    const db = createAdminClient();

    const { error } = await db
      .from("google_calendar_connections")
      .upsert(
        {
          user_id: user.id,

          access_token_encrypted: tokens.access_token
            ? encryptToken(tokens.access_token)
            : null,

          refresh_token_encrypted: encryptToken(
            tokens.refresh_token
          ),

          token_expiry: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,

          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      throw error;
    }

    return finish("connected");
  } catch {
    console.error("Falha na conexão OAuth do Google.");

    return finish("error");
  }
}
