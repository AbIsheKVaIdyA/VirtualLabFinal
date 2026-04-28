import { NextRequest, NextResponse } from "next/server";

const scopes = [
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming",
];

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const appUrl = request.nextUrl.origin;
  const redirectUri = `${appUrl}/api/auth/spotify/callback`;

  if (!clientId) {
    return NextResponse.redirect(new URL("/dashboard?spotify=missing_env", appUrl));
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes.join(" "),
    redirect_uri: redirectUri,
    state,
    show_dialog: "true",
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
  response.cookies.set("vl_spotify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
