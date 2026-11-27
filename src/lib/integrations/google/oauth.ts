
import "server-only";

import { google } from "googleapis";
import { CodeChallengeMethod } from "google-auth-library";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.app.created",
];

export function createGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Credenciais do Google não configuradas."
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

export function generateGoogleAuthUrl(
  state: string,
  codeChallenge: string
) {
  const oauth = createGoogleOAuthClient();

  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });
}
