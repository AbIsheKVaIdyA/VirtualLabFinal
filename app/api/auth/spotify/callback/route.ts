import { NextRequest, NextResponse } from "next/server";

type SpotifyTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI ?? `${appUrl}/api/auth/spotify/callback`;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("vl_spotify_oauth_state")?.value;
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?spotify=${encodeURIComponent(error)}`, appUrl)
    );
  }

  if (!clientId || !clientSecret || !code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL("/dashboard?spotify=connect_failed", appUrl));
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/dashboard?spotify=token_failed", appUrl));
  }

  const tokenData = (await tokenRes.json()) as SpotifyTokenResponse;
  const response = NextResponse.redirect(new URL("/dashboard?spotify=connected", appUrl));
  response.cookies.delete("vl_spotify_oauth_state");
  response.cookies.set(
    "vl_spotify_tokens",
    encodeURIComponent(
      JSON.stringify({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
      })
    ),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    }
  );

  return response;
}
