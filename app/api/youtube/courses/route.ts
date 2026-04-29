import { NextRequest, NextResponse } from "next/server";

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

const TOPIC_QUERIES: Record<string, string> = {
  All: "best beginner full course programming Python Java web development artificial intelligence data science cloud cybersecurity",
  Java: "best Java programming full course beginners",
  Python: "best Python basics full course beginners",
  "Web Development": "best web development full course HTML CSS JavaScript React",
  "Data Science": "best data science full course Python machine learning beginners",
  Cybersecurity: "best cybersecurity full course ethical hacking beginners",
  AI: "best artificial intelligence machine learning full course beginners",
  Cloud: "best cloud computing AWS Azure full course beginners",
  Career: "best software engineering interview career course",
};

function getYouTubeApiKey() {
  return process.env.YOUTUBE_API_KEY ?? process.env.GOOGLE_YOUTUBE_API_KEY ?? null;
}

export async function GET(request: NextRequest) {
  const apiKey = getYouTubeApiKey();
  const topicParam = request.nextUrl.searchParams.get("topic") ?? "All";
  const topic = TOPIC_QUERIES[topicParam] ? topicParam : "All";

  if (!apiKey) {
    return NextResponse.json(
      {
        message: "Add YOUTUBE_API_KEY to load course videos.",
        videos: [],
      },
      { status: 200 }
    );
  }

  const searchParams = new URLSearchParams({
    part: "snippet",
    q: `${TOPIC_QUERIES[topic]} tutorial project lecture`,
    key: apiKey,
    maxResults: "3",
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "moderate",
    relevanceLanguage: "en",
    regionCode: "US",
    order: "relevance",
  });

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json({
        message: "YouTube videos could not be loaded right now.",
        videos: [],
      });
    }

    const data = (await response.json()) as YouTubeSearchResponse;
    const videos =
      data.items
        ?.filter((item) => Boolean(item.id?.videoId && item.snippet?.title))
        .map((item) => {
          const videoId = item.id?.videoId as string;
          const snippet = item.snippet;

          return {
            id: videoId,
            title: snippet?.title ?? "YouTube course",
            description: snippet?.description ?? "",
            channelTitle: snippet?.channelTitle ?? "YouTube",
            publishedAt: snippet?.publishedAt ?? null,
            thumbnailUrl:
              snippet?.thumbnails?.high?.url ??
              snippet?.thumbnails?.medium?.url ??
              snippet?.thumbnails?.default?.url ??
              null,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
            topic,
          };
        }) ?? [];

    return NextResponse.json({
      message: videos.length ? null : "No YouTube course videos matched this topic yet.",
      videos,
    });
  } catch {
    return NextResponse.json({
      message: "YouTube is temporarily unavailable.",
      videos: [],
    });
  }
}
