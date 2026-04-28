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

type SpotifyEpisode = {
  id: string;
  name: string;
  description: string;
  duration_ms?: number;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{
    url: string;
  }>;
  show?: {
    name?: string;
    publisher?: string;
    images?: Array<{
      url: string;
    }>;
  };
};

type SpotifyPlaylist = {
  id: string;
  name: string;
  description: string;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{
    url: string;
  }>;
  owner?: {
    display_name?: string;
  };
  tracks?: {
    total?: number;
  };
};

type SpotifySearchResponse = {
  shows?: {
    items?: Array<SpotifyShow | null>;
  };
  episodes?: {
    items?: Array<SpotifyEpisode | null>;
  };
  playlists?: {
    items?: Array<SpotifyPlaylist | null>;
  };
};

const EDUCATIONAL_QUERIES: Record<string, string> = {
  All: "US English education technology university learning programming podcast",
  Java: "US English Java programming software engineering podcast",
  Python: "US English python programming education podcast",
  "Web Development": "US English web development javascript react education podcast",
  "Data Science": "US English data science machine learning education podcast",
  Cybersecurity: "US English cybersecurity ethical hacking education podcast",
  AI: "US English artificial intelligence machine learning education podcast",
  Cloud: "US English cloud computing AWS Azure DevOps podcast",
  Career: "US English software engineering career interview podcast",
};

const FEATURED_TOPICS = [
  "Python",
  "Java",
  "Cybersecurity",
  "Web Development",
  "Data Science",
  "AI",
  "Cloud",
  "Career",
];

const NON_US_RESULT_TERMS = [
  "india",
  "hindi",
  "tamil",
  "telugu",
  "bollywood",
  "desi",
];

function isUSFocusedResult(input: {
  title: string;
  publisher: string;
  description: string;
}) {
  const searchable = `${input.title} ${input.publisher} ${input.description}`.toLowerCase();
  return !NON_US_RESULT_TERMS.some((term) => searchable.includes(term));
}

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
    const categoriesToSearch = category === "All" ? FEATURED_TOPICS : [category];
    const results = await Promise.all(
      categoriesToSearch.map(async (topic) => {
    const searchParams = new URLSearchParams({
          q: EDUCATIONAL_QUERIES[topic],
      type: "episode,playlist,show",
      market: "US",
          limit: category === "All" ? "4" : "8",
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
          return [];
    }

    const searchData = (await searchRes.json()) as SpotifySearchResponse;
    const episodes =
      searchData.episodes?.items
        ?.filter((episode): episode is SpotifyEpisode => Boolean(episode))
        .map((episode) => ({
          id: `episode-${episode.id}`,
          title: episode.name,
          publisher: episode.show?.name ?? episode.show?.publisher ?? "Spotify episode",
          description: episode.description,
          episodeCount: episode.duration_ms
            ? Math.max(1, Math.round(episode.duration_ms / 60000))
            : 1,
          imageUrl: episode.images?.[0]?.url ?? episode.show?.images?.[0]?.url ?? null,
          spotifyUrl:
            episode.external_urls?.spotify ?? `https://open.spotify.com/episode/${episode.id}`,
          embedUrl: `https://open.spotify.com/embed/episode/${episode.id}?utm_source=generator&theme=0`,
              category: `${topic} episode`,
          kind: "episode",
              topic,
        }))
        .filter(isUSFocusedResult) ?? [];

    const shows =
      searchData.shows?.items
        ?.filter((show): show is SpotifyShow => Boolean(show))
        .map((show) => ({
          id: `show-${show.id}`,
          title: show.name,
          publisher: show.publisher,
          description: show.description,
          episodeCount: show.total_episodes,
          imageUrl: show.images?.[0]?.url ?? null,
          spotifyUrl: show.external_urls?.spotify ?? `https://open.spotify.com/show/${show.id}`,
          embedUrl: `https://open.spotify.com/embed/show/${show.id}?utm_source=generator&theme=0`,
              category: `${topic} show`,
          kind: "show",
              topic,
        }))
        .filter(isUSFocusedResult) ?? [];
    const playlists =
      searchData.playlists?.items
        ?.filter((playlist): playlist is SpotifyPlaylist => Boolean(playlist))
        .map((playlist) => ({
          id: `playlist-${playlist.id}`,
          title: playlist.name,
          publisher: playlist.owner?.display_name ?? "Spotify playlist",
          description: playlist.description,
          episodeCount: playlist.tracks?.total ?? 0,
          imageUrl: playlist.images?.[0]?.url ?? null,
          spotifyUrl:
            playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}`,
          embedUrl: `https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0`,
              category: `${topic} playlist`,
          kind: "playlist",
              topic,
        }))
        .filter(isUSFocusedResult) ?? [];
        return [...episodes, ...playlists, ...shows];
      })
    );
    const podcasts = results.flat();

    return withRefreshedCookie({
      connected: true,
      source: "spotify",
      category,
      message: podcasts.length
        ? "Playable Spotify audio loaded for your study topic."
        : "No playable Spotify results matched this category yet. Try a different filter.",
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
