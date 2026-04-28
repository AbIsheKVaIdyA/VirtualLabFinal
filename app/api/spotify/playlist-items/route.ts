import { NextRequest, NextResponse } from "next/server";

type SpotifyCookie = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

type SpotifyPlaylistTrack = {
  track?: {
    id?: string;
    name?: string;
    description?: string;
    duration_ms?: number;
    type?: "episode" | "track";
    external_urls?: {
      spotify?: string;
    };
    album?: {
      images?: Array<{ url: string }>;
    };
    images?: Array<{ url: string }>;
    artists?: Array<{ name?: string }>;
    show?: {
      name?: string;
      publisher?: string;
    };
  } | null;
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
  const playlistId = request.nextUrl.searchParams.get("playlistId");
  const tokens = parseSpotifyCookie(request);

  if (!tokens || !playlistId) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }

  const params = new URLSearchParams({
    market: "US",
    limit: "30",
  });

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ items: [] }, { status: res.status });
  }

  const data = (await res.json()) as { items?: SpotifyPlaylistTrack[] };
  const items =
    data.items
      ?.map((item) => item.track)
      .filter((track): track is NonNullable<SpotifyPlaylistTrack["track"]> =>
        Boolean(track?.id && track?.name)
      )
      .map((track) => {
        const kind = track.type === "episode" ? "episode" : "track";
        const imageUrl = track.images?.[0]?.url ?? track.album?.images?.[0]?.url ?? null;
        const publisher =
          track.show?.publisher ??
          track.show?.name ??
          track.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ??
          "Spotify";

        return {
          id: `${kind}-${track.id}`,
          title: track.name ?? "Spotify audio",
          publisher,
          description: track.description ?? publisher,
          episodeCount: track.duration_ms ? Math.max(1, Math.round(track.duration_ms / 60000)) : 1,
          imageUrl,
          spotifyUrl: track.external_urls?.spotify ?? `https://open.spotify.com/${kind}/${track.id}`,
          embedUrl: `https://open.spotify.com/embed/${kind}/${track.id}?utm_source=generator&theme=0`,
          category: kind,
          kind,
        };
      }) ?? [];

  return NextResponse.json({ items });
}
