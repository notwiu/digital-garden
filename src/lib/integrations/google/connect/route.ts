
import { NextResponse } from "next/server";

import {
  randomBytes,
  createHash,
} from "node:crypto";

import { createClient } from "@/lib/supabase/server";

import {
  generateGoogleAuthUrl,
} from "@/lib/integrations/google/oauth";

export const runtime = "nodejs";

export async function GET() {
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

  const state = randomBytes(32).toString("hex");

  const verifier = randomBytes(32)
    .toString("base64url");

  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");

  const url = generateGoogleAuthUrl(
    state,
    challenge
  );

  const response = NextResponse.redirect(url);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/api/integrations/google",
  };

  response.cookies.set(
    "google_oauth_state",
    state,
    options
  );

  response.cookies.set(
    "google_oauth_user",
    user.id,
    options
  );

  response.cookies.set(
    "google_oauth_verifier",
    verifier,
    options
  );

  return response;
}
