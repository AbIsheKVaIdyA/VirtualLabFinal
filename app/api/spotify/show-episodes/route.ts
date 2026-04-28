import { NextRequest, NextResponse } from "next/server";

type SpotifyCookie = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

type SpotifyEpisode = {
  id: string;
  name: string;
  description: string;
  duration_ms?: number;
  external_urls?: {
    spotify?: string;
  };
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

export async function GET(request: NextRequest) {
  const showId = request.nextUrl.searchParams.get("showId");
  const tokens = parseSpotifyCookie(request);

  if (!tokens || !showId) {
    return NextResponse.json({ episodes: [] }, { status: 400 });
  }

  const params = new URLSearchParams({
    market: "US",
    limit: "20",
  });

  const res = await fetch(
    `https://api.spotify.com/v1/shows/${showId}/episodes?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ episodes: [] }, { status: res.status });
  }

  const data = (await res.json()) as { items?: Array<SpotifyEpisode | null> };
  const episodes =
    data.items
      ?.filter((episode): episode is SpotifyEpisode => Boolean(episode))
      .map((episode) => ({
        id: `episode-${episode.id}`,
        title: episode.name,
        publisher: "Spotify episode",
        description: episode.description,
        episodeCount: episode.duration_ms
          ? Math.max(1, Math.round(episode.duration_ms / 60000))
          : 1,
        imageUrl: episode.images?.[0]?.url ?? null,
        spotifyUrl:
          episode.external_urls?.spotify ?? `https://open.spotify.com/episode/${episode.id}`,
        embedUrl: `https://open.spotify.com/embed/episode/${episode.id}?utm_source=generator&theme=0`,
        category: "episode",
        kind: "episode",
      })) ?? [];

  return NextResponse.json({ episodes });
}
