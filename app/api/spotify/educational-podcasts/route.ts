import { NextRequest, NextResponse } from "next/server";

type SpotifyTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type SpotifyCookie = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

type SpotifyShow = {
  id: string;
  name: string;
  publisher: string;
  description: string;
  total_episodes: number;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{
    url: string;
  }>;
};

type SpotifySearchResponse = {
  shows?: {
    items?: Array<SpotifyShow | null>;
  };
};

const EDUCATIONAL_QUERIES: Record<string, string> = {
  All: "education technology university learning programming podcast",
  Python: "python programming education podcast",
  "Web Development": "web development javascript react education podcast",
  "Data Science": "data science machine learning education podcast",
  Cybersecurity: "cybersecurity ethical hacking education podcast",
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

  const data = (await refreshRes.json()) as SpotifyTokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function GET(request: NextRequest) {
  const categoryParam = request.nextUrl.searchParams.get("category") ?? "All";
  const category = EDUCATIONAL_QUERIES[categoryParam] ? categoryParam : "All";
  const tokens = parseSpotifyCookie(request);

  if (!tokens) {
    return NextResponse.json(
      {
        connected: false,
        source: "spotify",
        category,
        message: "Connect Spotify to load recommendations.",
        podcasts: [],
      },
      { status: 401 }
    );
  }

  const activeTokens =
    tokens.expiresAt <= Date.now() + 30_000 ? await refreshAccessToken(tokens) : tokens;

  if (!activeTokens) {
    return NextResponse.json(
      {
        connected: false,
        source: "spotify",
        category,
        message: "Spotify session expired. Reconnect Spotify.",
        podcasts: [],
      },
      { status: 401 }
    );
  }

  const withRefreshedCookie = <T extends Record<string, unknown>>(body: T) => {
    const response = NextResponse.json(body);
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
  };

  try {
    const searchParams = new URLSearchParams({
      q: EDUCATIONAL_QUERIES[category],
      type: "show",
      market: "US",
      limit: "12",
    });

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${activeTokens.accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!searchRes.ok) {
      return withRefreshedCookie({
        connected: true,
        source: "spotify",
        category,
        message: "Spotify search failed. Try reconnecting your account.",
        podcasts: [],
      });
    }

    const searchData = (await searchRes.json()) as SpotifySearchResponse;
    const podcasts =
      searchData.shows?.items
        ?.filter((show): show is SpotifyShow => Boolean(show))
        .map((show) => ({
          id: show.id,
          title: show.name,
          publisher: show.publisher,
          description: show.description,
          episodeCount: show.total_episodes,
          imageUrl: show.images?.[0]?.url ?? null,
          spotifyUrl: show.external_urls?.spotify ?? `https://open.spotify.com/show/${show.id}`,
          embedUrl: `https://open.spotify.com/embed/show/${show.id}?utm_source=generator&theme=0`,
          category,
        })) ?? [];

    return withRefreshedCookie({
      connected: true,
      source: "spotify",
      category,
      message: podcasts.length
        ? "Recommendations loaded from your connected Spotify account."
        : "No Spotify results matched this category yet. Try a different filter.",
      podcasts,
    });
  } catch {
    return withRefreshedCookie({
      connected: true,
      source: "spotify",
      category,
      message: "Spotify is temporarily unavailable.",
      podcasts: [],
    });
  }
}
