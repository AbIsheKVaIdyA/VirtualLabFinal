import { NextRequest, NextResponse } from "next/server";

type SpotifyCookie = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

type SpotifyProfile = {
  id: string;
  display_name?: string;
  email?: string;
  product?: string;
  images?: Array<{ url: string }>;
};

function parseSpotifyCookie(request: NextRequest) {
  const value = request.cookies.get("vl_spotify_tokens")?.value;
  if (!value) return null;

  try {
    return JSON.parse(decodeURIComponent(value)) as SpotifyCookie;
  } catch {
    return null;
  }
}

async function refreshAccessToken(tokens: SpotifyCookie) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret || !tokens.refreshToken) return null;

  const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }),
    cache: "no-store",
  });

  if (!refreshRes.ok) return null;

  const data = (await refreshRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function GET(request: NextRequest) {
  const tokens = parseSpotifyCookie(request);

  if (!tokens) {
    return NextResponse.json({ connected: false });
  }

  const activeTokens =
    tokens.expiresAt <= Date.now() + 30_000 ? await refreshAccessToken(tokens) : tokens;

  if (!activeTokens) {
    return NextResponse.json({ connected: false, message: "Spotify session expired." });
  }

  const profileRes = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${activeTokens.accessToken}`,
    },
    cache: "no-store",
  });

  if (!profileRes.ok) {
    return NextResponse.json({ connected: false, message: "Could not load Spotify profile." });
  }

  const profile = (await profileRes.json()) as SpotifyProfile;
  const response = NextResponse.json({
    connected: true,
    profile: {
      id: profile.id,
      name: profile.display_name ?? profile.id,
      email: profile.email,
      product: profile.product,
      imageUrl: profile.images?.[0]?.url ?? null,
    },
  });

  if (activeTokens.accessToken !== tokens.accessToken) {
    response.cookies.set("vl_spotify_tokens", encodeURIComponent(JSON.stringify(activeTokens)), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return response;
}
