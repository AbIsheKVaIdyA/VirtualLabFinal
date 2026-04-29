"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenText,
  CheckSquare,
  Clock3,
  Code2,
  Disc3,
  Download,
  FileText,
  Headphones,
  Link2,
  ListMusic,
  NotebookPen,
  PlayCircle,
  Podcast,
  Save,
  Search,
  SkipBack,
  SkipForward,
  Video,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthNavControls } from "@/components/auth-nav-controls";
import { CommunityWorkspace } from "@/components/community/CommunityWorkspace";
import { cn } from "@/lib/utils";
import { withSpotifyEmbedResume } from "@/lib/spotify-embed";

const availableCourses = [
  {
    name: "Java Course",
    description: "Core Java concepts, object-oriented programming, and practice modules.",
  },
  {
    name: "Python Course",
    description: "Python basics, problem solving, and beginner-friendly coding exercises.",
  },
];

const courseCategories = [
  "Java",
  "Python",
  "Web Development",
  "Data Science",
  "Cybersecurity",
  "AI",
  "Cloud",
  "Career",
];

const videoTopicSections = [
  {
    title: "Mixed Recommendations",
    topic: "All",
    description: "A small mix across programming, AI, cloud, security, and data.",
    accent: "from-blue-600/25 to-white/[0.03]",
  },
  {
    title: "Python Courses",
    topic: "Python",
    description: "Beginner-friendly Python basics, projects, and full courses.",
    accent: "from-emerald-500/20 to-white/[0.03]",
  },
  {
    title: "Cybersecurity Courses",
    topic: "Cybersecurity",
    description: "Security fundamentals, ethical hacking, and cyber career basics.",
    accent: "from-red-500/20 to-white/[0.03]",
  },
  {
    title: "Web Development",
    topic: "Web Development",
    description: "HTML, CSS, JavaScript, React, and full-stack learning paths.",
    accent: "from-cyan-500/20 to-white/[0.03]",
  },
  {
    title: "AI And Data",
    topic: "AI",
    description: "Artificial intelligence, machine learning, and applied AI courses.",
    accent: "from-violet-500/20 to-white/[0.03]",
  },
  {
    title: "Cloud And Career",
    topic: "Cloud",
    description: "Cloud computing, DevOps foundations, and job-ready skills.",
    accent: "from-orange-500/20 to-white/[0.03]",
  },
];

type SpotifyPodcast = {
  id: string;
  title: string;
  publisher: string;
  description: string;
  episodeCount: number;
  imageUrl: string | null;
  spotifyUrl: string;
  embedUrl: string | null;
  category: string;
  kind?: "episode" | "playlist" | "show" | "track";
  topic?: string;
};

type SpotifyConnection = {
  connected: boolean;
  profile?: {
    id: string;
    name: string;
    email?: string;
    product?: string;
    imageUrl?: string | null;
  };
  message?: string;
};

type LearningVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  embedUrl: string;
  youtubeUrl: string;
  topic: string;
};

type SavedVideoNote = {
  videoId: string;
  videoTitle: string;
  noteTitle?: string;
  topic: string;
  content: string;
  updatedAt: string;
};

type NoteHistoryEntry = {
  id: string;
  content: string;
  createdAt: string;
};

type RecentLearningVideo = LearningVideo & {
  progressSeconds: number;
  updatedAt: string;
};

/** Saved listens for resume chips (similar to recently viewed videos). */
type SpotifyListenEntry = SpotifyPodcast & {
  progressSeconds: number;
  updatedAt: string;
};

type SectionId = "courses" | "videos" | "notes" | "spotify" | "community";

const SPOTIFY_LAST_AUDIO_KEY = "vl:last-spotify-audio";
const SPOTIFY_LISTEN_HISTORY_KEY = "vl:spotify-listen-history";
const MAX_SPOTIFY_LISTEN_HISTORY = 14;
const VIDEO_NOTE_KEY_PREFIX = "vl:video-note:";
const VIDEO_NOTE_INDEX_KEY = "vl:video-note-index";
const VIDEO_NOTE_HISTORY_KEY_PREFIX = "vl:video-note-history:";
const RECENT_VIDEO_KEY = "vl:recent-learning-videos";

function readSpotifyListenHistory(): SpotifyListenEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SPOTIFY_LISTEN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SpotifyListenEntry[];

    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.id && entry.embedUrl) : [];
  } catch {
    return [];
  }
}

function writeSpotifyListenHistory(entries: SpotifyListenEntry[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SPOTIFY_LISTEN_HISTORY_KEY, JSON.stringify(entries));
}

function mergeSpotifyListenHistory(
  previous: SpotifyListenEntry[],
  entry: SpotifyListenEntry
): SpotifyListenEntry[] {
  const rest = previous.filter((e) => e.id !== entry.id);

  return [entry, ...rest].slice(0, MAX_SPOTIFY_LISTEN_HISTORY);
}

const navSections: Array<{ id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "courses", label: "My Courses", icon: BookOpenText },
  { id: "videos", label: "Learning Videos", icon: Video },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "spotify", label: "Spotify Podcasts", icon: Podcast },
  { id: "community", label: "Community", icon: Disc3 },
];

/** Responsive slim embed — shares a full-width strip below the nav so pills are not squeezed. */
const SpotifyNavbarPlayer = memo(function SpotifyNavbarPlayer({
  title,
  embedUrl,
}: {
  title: string;
  embedUrl: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto h-[80px] min-h-[80px] w-full max-w-2xl min-w-0 overflow-hidden rounded-xl sm:rounded-2xl",
        "border border-white/[0.12] bg-[#070708]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.04]"
      )}
    >
      <iframe
        key={embedUrl}
        title={`Spotify: ${title}`}
        src={embedUrl}
        width="100%"
        height="80"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
});

function DashboardContent() {
  const { user: clerkUser } = useUser();
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [spotifyCategory, setSpotifyCategory] = useState("All");
  const [spotifyPodcasts, setSpotifyPodcasts] = useState<SpotifyPodcast[]>([]);
  const [selectedSpotifyPodcast, setSelectedSpotifyPodcast] = useState<SpotifyPodcast | null>(
    null
  );
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyMessage, setSpotifyMessage] = useState<string | null>(null);
  const [spotifyConnection, setSpotifyConnection] = useState<SpotifyConnection | null>(null);
  const [audioDrawerItem, setAudioDrawerItem] = useState<SpotifyPodcast | null>(null);
  const [audioDrawerItems, setAudioDrawerItems] = useState<SpotifyPodcast[]>([]);
  const [audioDrawerLoading, setAudioDrawerLoading] = useState(false);
  const [lastSpotifyPodcast, setLastSpotifyPodcast] = useState<SpotifyPodcast | null>(null);
  /** Shows navbar mini-player only after user explicitly starts playback via selectSpotifyAudio (not mere connect / auto-selection). */
  const [spotifyNavbarActive, setSpotifyNavbarActive] = useState(false);
  const [recentSpotifyListens, setRecentSpotifyListens] = useState<SpotifyListenEntry[]>([]);
  /** Start offset (seconds) passed into Spotify embed URLs for resume-at-position. */
  const [spotifyIframeResumeSeconds, setSpotifyIframeResumeSeconds] = useState(0);
  const [videoTopic, setVideoTopic] = useState("All");
  const [learningVideos, setLearningVideos] = useState<LearningVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<LearningVideo | null>(null);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosMessage, setVideosMessage] = useState<string | null>(null);
  const [videoNote, setVideoNote] = useState("");
  const [noteStatus, setNoteStatus] = useState<string | null>(null);
  const [videoStudioOpen, setVideoStudioOpen] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [noteTitleDrafts, setNoteTitleDrafts] = useState<Record<string, string>>({});
  const [savedVideoNotes, setSavedVideoNotes] = useState<SavedVideoNote[]>([]);
  const [noteHistory, setNoteHistory] = useState<NoteHistoryEntry[]>([]);
  const [studyStartedAt, setStudyStartedAt] = useState<number | null>(null);
  const [videoStartSeconds, setVideoStartSeconds] = useState(0);
  const [recentLearningVideos, setRecentLearningVideos] = useState<RecentLearningVideo[]>([]);
  const [activeSection, setActiveSection] = useState<SectionId>("courses");
  const noteStorageKey = selectedVideo
    ? `${VIDEO_NOTE_KEY_PREFIX}${clerkUser?.id ?? "guest"}:${selectedVideo.id}`
    : null;
  const noteHistoryKey = selectedVideo
    ? `${VIDEO_NOTE_HISTORY_KEY_PREFIX}${clerkUser?.id ?? "guest"}:${selectedVideo.id}`
    : null;
  const filteredSavedVideoNotes = useMemo(() => {
    const query = noteSearch.trim().toLowerCase();
    if (!query) return savedVideoNotes;

    return savedVideoNotes.filter((note) =>
      `${note.noteTitle ?? ""} ${note.videoTitle} ${note.topic} ${note.content}`
        .toLowerCase()
        .includes(query)
    );
  }, [noteSearch, savedVideoNotes]);
  const spotifyRows = useMemo(
    () => {
      const topicsToShow = spotifyCategory === "All" ? courseCategories : [spotifyCategory];

      return topicsToShow
        .map((topic) => ({
          title: `${topic} Audio`,
          subtitle: "English episodes, playlists, and shows for this topic.",
          items: spotifyPodcasts.filter((item) => item.topic === topic),
        }))
        .filter((row) => row.items.length > 0);
    },
    [spotifyCategory, spotifyPodcasts]
  );
  const selectedAudioIndex = selectedSpotifyPodcast
    ? spotifyPodcasts.findIndex((item) => item.id === selectedSpotifyPodcast.id)
    : -1;
  const totalDrawerItems = audioDrawerItems.length || audioDrawerItem?.episodeCount || 0;
  const remainingDrawerItems = audioDrawerItems.length
    ? Math.max(
        0,
        audioDrawerItems.length -
          audioDrawerItems.findIndex((item) => item.id === selectedSpotifyPodcast?.id) -
          1
      )
    : totalDrawerItems;
  const selectSpotifyAudio = (
    item: SpotifyPodcast | null,
    options?: { offsetSeconds?: number }
  ) => {
    setSelectedSpotifyPodcast(item);
    if (!item) {
      setSpotifyNavbarActive(false);
      setSpotifyIframeResumeSeconds(0);
      return;
    }

    const history = readSpotifyListenHistory();

    let offsetSeconds = 0;
    if (typeof options?.offsetSeconds === "number") {
      offsetSeconds = Math.max(0, options.offsetSeconds);
    } else {
      offsetSeconds = Math.max(0, history.find((e) => e.id === item.id)?.progressSeconds ?? 0);
    }
    offsetSeconds = Math.min(offsetSeconds, 6 * 3600);

    setSpotifyIframeResumeSeconds(offsetSeconds);

    if (item.embedUrl) {
      setSpotifyNavbarActive(true);
    }

    setLastSpotifyPodcast(item);
    window.localStorage.setItem(SPOTIFY_LAST_AUDIO_KEY, JSON.stringify(item));

    const entry: SpotifyListenEntry = {
      ...item,
      progressSeconds: offsetSeconds,
      updatedAt: new Date().toISOString(),
    };
    const nextHistory = mergeSpotifyListenHistory(history, entry);

    writeSpotifyListenHistory(nextHistory);
    setRecentSpotifyListens(nextHistory);
  };
  const selectNextSpotifyItem = () => {
    if (!spotifyPodcasts.length) return;
    const nextIndex =
      selectedAudioIndex >= 0 ? (selectedAudioIndex + 1) % spotifyPodcasts.length : 0;
    selectSpotifyAudio(spotifyPodcasts[nextIndex]);
  };
  const selectPreviousSpotifyItem = () => {
    if (!spotifyPodcasts.length) return;
    const previousIndex =
      selectedAudioIndex > 0 ? selectedAudioIndex - 1 : spotifyPodcasts.length - 1;
    selectSpotifyAudio(spotifyPodcasts[previousIndex]);
  };
  const readRecentLearningVideos = () => {
    try {
      return JSON.parse(window.localStorage.getItem(RECENT_VIDEO_KEY) ?? "[]") as RecentLearningVideo[];
    } catch {
      window.localStorage.removeItem(RECENT_VIDEO_KEY);
      return [];
    }
  };
  const writeRecentLearningVideos = (videos: RecentLearningVideo[]) => {
    const nextVideos = videos.slice(0, 8);
    window.localStorage.setItem(RECENT_VIDEO_KEY, JSON.stringify(nextVideos));
    setRecentLearningVideos(nextVideos);
  };
  const formatVideoProgress = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };
  const getRecentProgress = (videoId: string) =>
    recentLearningVideos.find((video) => video.id === videoId)?.progressSeconds ?? 0;
  const openVideoStudyRoom = (video: LearningVideo, resume = true) => {
    const progressSeconds = resume ? getRecentProgress(video.id) : 0;
    setSelectedVideo(video);
    setVideoStartSeconds(progressSeconds);
    setStudyStartedAt(Date.now());
    setVideoStudioOpen(true);
    writeRecentLearningVideos([
      {
        ...video,
        progressSeconds,
        updatedAt: new Date().toISOString(),
      },
      ...readRecentLearningVideos().filter((recentVideo) => recentVideo.id !== video.id),
    ]);
  };
  const openAudioDetails = (item: SpotifyPodcast) => {
    setAudioDrawerItem(item);
    setAudioDrawerItems(item.kind === "episode" || item.kind === "track" ? [item] : []);

    if (item.kind === "episode" || item.kind === "track") {
      setAudioDrawerLoading(false);
      return;
    }

    const endpoint =
      item.kind === "playlist"
        ? `/api/spotify/playlist-items?playlistId=${encodeURIComponent(
            item.id.replace(/^playlist-/, "")
          )}`
        : `/api/spotify/show-episodes?showId=${encodeURIComponent(item.id.replace(/^show-/, ""))}`;

    setAudioDrawerLoading(true);

    fetch(endpoint, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data: { items?: SpotifyPodcast[]; episodes?: SpotifyPodcast[] }) =>
        setAudioDrawerItems(data.items ?? data.episodes ?? [])
      )
      .catch(() => setAudioDrawerItems([]))
      .finally(() => setAudioDrawerLoading(false));
  };
  const handleSpotifyCardClick = (item: SpotifyPodcast) => {
    openAudioDetails(item);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(SPOTIFY_LAST_AUDIO_KEY);
    if (!stored) return;

    try {
      setLastSpotifyPodcast(JSON.parse(stored) as SpotifyPodcast);
    } catch {
      window.localStorage.removeItem(SPOTIFY_LAST_AUDIO_KEY);
    }
  }, []);

  useEffect(() => {
    setRecentLearningVideos(readRecentLearningVideos());
  }, []);

  useEffect(() => {
    setRecentSpotifyListens(readSpotifyListenHistory());
  }, []);

  useEffect(() => {
    if (!spotifyNavbarActive || !selectedSpotifyPodcast?.id) return;

    const id = selectedSpotifyPodcast.id;
    const secondsPerTick = 15;
    const intervalId = window.setInterval(() => {
      setRecentSpotifyListens((prev) => {
        const ix = prev.findIndex((e) => e.id === id);
        if (ix < 0) return prev;

        const bumpedSeconds = Math.min(prev[ix].progressSeconds + secondsPerTick, 6 * 3600);
        const next = [...prev];
        next[ix] = {
          ...next[ix],
          progressSeconds: bumpedSeconds,
          updatedAt: new Date().toISOString(),
        };
        writeSpotifyListenHistory(next);

        return next;
      });
    }, secondsPerTick * 1000);

    return () => window.clearInterval(intervalId);
  }, [spotifyNavbarActive, selectedSpotifyPodcast?.id]);

  const readLocalNoteIndex = () => {
    try {
      return JSON.parse(window.localStorage.getItem(VIDEO_NOTE_INDEX_KEY) ?? "[]") as SavedVideoNote[];
    } catch {
      window.localStorage.removeItem(VIDEO_NOTE_INDEX_KEY);
      return [];
    }
  };

  const refreshLocalNoteIndex = () => {
    const notes = readLocalNoteIndex();
    setSavedVideoNotes(notes);
    setNoteTitleDrafts(
      Object.fromEntries(notes.map((note) => [note.videoId, note.noteTitle ?? note.videoTitle]))
    );
  };

  const saveLocalNote = (content: string) => {
    if (!selectedVideo || !noteStorageKey) return;

    const updatedAt = new Date().toISOString();
    window.localStorage.setItem(noteStorageKey, content);
    const nextIndex = [
      {
        videoId: selectedVideo.id,
        videoTitle: selectedVideo.title,
        noteTitle:
          readLocalNoteIndex().find((note) => note.videoId === selectedVideo.id)?.noteTitle ??
          selectedVideo.title,
        topic: selectedVideo.topic,
        content,
        updatedAt,
      },
      ...readLocalNoteIndex().filter((note) => note.videoId !== selectedVideo.id),
    ];

    window.localStorage.setItem(VIDEO_NOTE_INDEX_KEY, JSON.stringify(nextIndex));
    setSavedVideoNotes(nextIndex);
    setNoteTitleDrafts((current) => ({
      ...current,
      [selectedVideo.id]: nextIndex[0].noteTitle ?? selectedVideo.title,
    }));
  };

  const renameSavedNote = (videoId: string, nextTitle: string) => {
    const cleanTitle = nextTitle.trim();
    if (!cleanTitle) return;

    const nextIndex = readLocalNoteIndex().map((note) =>
      note.videoId === videoId
        ? { ...note, noteTitle: cleanTitle, updatedAt: new Date().toISOString() }
        : note
    );
    window.localStorage.setItem(VIDEO_NOTE_INDEX_KEY, JSON.stringify(nextIndex));
    setSavedVideoNotes(nextIndex);
    setNoteTitleDrafts((current) => ({ ...current, [videoId]: cleanTitle }));

    fetch("/api/video-notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, noteTitle: cleanTitle }),
    }).catch(() => undefined);
  };

  const deleteSavedNote = (note: SavedVideoNote) => {
    const nextIndex = readLocalNoteIndex().filter((item) => item.videoId !== note.videoId);
    window.localStorage.setItem(VIDEO_NOTE_INDEX_KEY, JSON.stringify(nextIndex));
    window.localStorage.removeItem(`${VIDEO_NOTE_KEY_PREFIX}${clerkUser?.id ?? "guest"}:${note.videoId}`);
    window.localStorage.removeItem(
      `${VIDEO_NOTE_HISTORY_KEY_PREFIX}${clerkUser?.id ?? "guest"}:${note.videoId}`
    );
    setSavedVideoNotes(nextIndex);
    setNoteTitleDrafts((current) => {
      const { [note.videoId]: _deleted, ...rest } = current;
      return rest;
    });

    if (selectedVideo?.id === note.videoId) {
      setVideoNote("");
      setNoteHistory([]);
      setNoteStatus("Note deleted.");
    }

    fetch(`/api/video-notes?videoId=${encodeURIComponent(note.videoId)}`, {
      method: "DELETE",
    }).catch(() => undefined);
  };

  const readLocalHistory = () => {
    if (!noteHistoryKey) return [];

    try {
      return JSON.parse(window.localStorage.getItem(noteHistoryKey) ?? "[]") as NoteHistoryEntry[];
    } catch {
      window.localStorage.removeItem(noteHistoryKey);
      return [];
    }
  };

  const writeLocalHistory = (history: NoteHistoryEntry[]) => {
    if (!noteHistoryKey) return;

    window.localStorage.setItem(noteHistoryKey, JSON.stringify(history.slice(0, 8)));
    setNoteHistory(history.slice(0, 8));
  };

  const formatStudyTimestamp = () => {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - (studyStartedAt ?? Date.now())) / 1000)
    );
    const minutes = Math.floor(elapsedSeconds / 60).toString();
    const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  };

  const insertIntoNote = (text: string) => {
    const textarea = noteTextareaRef.current;
    if (!textarea) {
      setVideoNote((current) => `${current}${current ? "\n" : ""}${text}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${videoNote.slice(0, start)}${text}${videoNote.slice(end)}`;
    setVideoNote(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const wrapSelectedNoteText = (before: string, after = "") => {
    const textarea = noteTextareaRef.current;
    if (!textarea) {
      insertIntoNote(before + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = videoNote.slice(start, end) || "important concept";
    const nextText = `${before}${selected}${after}`;
    const nextValue = `${videoNote.slice(0, start)}${nextText}${videoNote.slice(end)}`;
    setVideoNote(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const createNoteSnapshot = () => {
    if (!selectedVideo || !videoNote.trim()) return;

    const entry = {
      id: `${selectedVideo.id}-${Date.now()}`,
      content: videoNote,
      createdAt: new Date().toISOString(),
    };
    const history = [entry, ...readLocalHistory()];
    writeLocalHistory(history);
    saveLocalNote(videoNote);
    setNoteStatus("Snapshot saved.");

    fetch("/api/video-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId: selectedVideo.id,
        videoTitle: selectedVideo.title,
        noteTitle:
          readLocalNoteIndex().find((note) => note.videoId === selectedVideo.id)?.noteTitle ??
          selectedVideo.title,
        topic: selectedVideo.topic,
        content: videoNote,
        createSnapshot: true,
      }),
    }).catch(() => undefined);
  };

  const exportNoteMarkdown = () => {
    if (!selectedVideo) return;

    const noteTitle =
      readLocalNoteIndex().find((note) => note.videoId === selectedVideo.id)?.noteTitle ??
      selectedVideo.title;
    const markdown = `# ${noteTitle}\n\nVideo: ${selectedVideo.title}\nTopic: ${selectedVideo.topic}\nChannel: ${selectedVideo.channelTitle}\n\n${videoNote}`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedVideo.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportNotePdf = () => {
    if (!selectedVideo) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedVideo.title} notes</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 32px; line-height: 1.55; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <h1>${selectedVideo.title}</h1>
          <p>${selectedVideo.topic} · ${selectedVideo.channelTitle}</p>
          <pre>${videoNote.replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[char] ?? char)}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    if (activeSection !== "videos") return;

    const controller = new AbortController();
    const params = new URLSearchParams({ topic: videoTopic });

    setVideosLoading(true);
    fetch(`/api/youtube/courses?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { message?: string; videos?: LearningVideo[] }) => {
        const videos = data.videos ?? [];
        setLearningVideos(videos);
        setSelectedVideo((current) =>
          current && videos.some((video) => video.id === current.id)
            ? current
            : null
        );
        setVideosMessage(data.message ?? "YouTube course videos loaded.");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLearningVideos([]);
        setSelectedVideo(null);
        setVideosMessage("Could not load YouTube videos right now.");
      })
      .finally(() => setVideosLoading(false));

    return () => controller.abort();
  }, [activeSection, videoTopic]);

  useEffect(() => {
    if (!selectedVideo || !noteStorageKey) {
      setVideoNote("");
      setNoteStatus(null);
      setNoteHistory([]);
      return;
    }

    setStudyStartedAt(Date.now());
    const localNote = window.localStorage.getItem(noteStorageKey) ?? "";
    setVideoNote(localNote);
    setNoteHistory(readLocalHistory());
    setNoteStatus(localNote ? "Loaded saved note from this browser." : null);

    fetch(`/api/video-notes?videoId=${encodeURIComponent(selectedVideo.id)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data: { note?: string; history?: NoteHistoryEntry[]; persisted?: boolean }) => {
        if (data.history?.length) {
          writeLocalHistory(data.history);
        }

        if (!data.note) return;
        setVideoNote(data.note);
        saveLocalNote(data.note);
        setNoteStatus(data.persisted ? "Loaded saved note." : "Loaded local note.");
      })
      .catch(() => {
        if (localNote) setNoteStatus("Loaded local note.");
      });
  }, [noteHistoryKey, noteStorageKey, selectedVideo]);

  useEffect(() => {
    if (!videoStudioOpen || !selectedVideo || !studyStartedAt) return;

    const interval = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - studyStartedAt) / 1000);
      const progressSeconds = videoStartSeconds + elapsedSeconds;
      writeRecentLearningVideos([
        {
          ...selectedVideo,
          progressSeconds,
          updatedAt: new Date().toISOString(),
        },
        ...readRecentLearningVideos().filter((recentVideo) => recentVideo.id !== selectedVideo.id),
      ]);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [selectedVideo, studyStartedAt, videoStartSeconds, videoStudioOpen]);

  useEffect(() => {
    refreshLocalNoteIndex();

    fetch("/api/video-notes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { notes?: SavedVideoNote[] }) => {
        if (!data.notes?.length) return;

        const merged = [
          ...data.notes,
          ...readLocalNoteIndex().filter(
            (localNote) => !data.notes?.some((remoteNote) => remoteNote.videoId === localNote.videoId)
          ),
        ];
        window.localStorage.setItem(VIDEO_NOTE_INDEX_KEY, JSON.stringify(merged));
        setSavedVideoNotes(merged);
        setNoteTitleDrafts(
          Object.fromEntries(
            merged.map((note) => [note.videoId, note.noteTitle ?? note.videoTitle])
          )
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedVideo || !noteStorageKey) return;
    if (!videoStudioOpen) return;

    saveLocalNote(videoNote);
    setNoteStatus("Autosaving...");
    const timeout = window.setTimeout(() => {
      fetch("/api/video-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          videoTitle: selectedVideo.title,
          noteTitle:
            readLocalNoteIndex().find((note) => note.videoId === selectedVideo.id)?.noteTitle ??
            selectedVideo.title,
          topic: selectedVideo.topic,
          content: videoNote,
        }),
      })
        .then((res) => res.json())
        .then((data: { persisted?: boolean; saved?: boolean }) => {
          setNoteStatus(
            data.persisted && data.saved
              ? "Autosaved to your account."
              : "Autosaved in this browser."
          );
        })
        .catch(() => setNoteStatus("Autosaved in this browser."));
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [noteStorageKey, selectedVideo, videoNote, videoStudioOpen]);

  useEffect(() => {
    if (activeSection !== "spotify") return;

    queueMicrotask(() => setSpotifyConnection(null));
    fetch("/api/spotify/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: SpotifyConnection) => setSpotifyConnection(data))
      .catch(() =>
        setSpotifyConnection({
          connected: false,
          message: "Could not check Spotify connection.",
        })
      );
  }, [activeSection]);

  useEffect(() => {
    if (!spotifyConnection?.connected) {
      queueMicrotask(() => {
        setSpotifyPodcasts([]);
        setSpotifyMessage(null);
        setSpotifyLoading(false);
        setSpotifyNavbarActive(false);
      });
      return;
    }

    if (activeSection !== "spotify") return;

    const controller = new AbortController();
    const params = new URLSearchParams({ category: spotifyCategory });

    queueMicrotask(() => setSpotifyLoading(true));
    fetch(`/api/spotify/educational-podcasts?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then(
        (data: {
          message?: string;
          source?: "spotify";
          podcasts?: SpotifyPodcast[];
        }) => {
          const podcasts = data.podcasts ?? [];
          setSpotifyPodcasts(podcasts);
          setSelectedSpotifyPodcast((current) => {
            if (current && podcasts.some((podcast) => podcast.id === current.id)) {
              return current;
            }

            if (lastSpotifyPodcast && podcasts.some((podcast) => podcast.id === lastSpotifyPodcast.id)) {
              return lastSpotifyPodcast;
            }

            return podcasts[0] ?? null;
          });
          setSpotifyMessage(
            data.message ?? "Live Spotify results filtered for educational content."
          );
        }
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSpotifyPodcasts([]);
        setSpotifyMessage("Could not load Spotify podcasts right now.");
      })
      .finally(() => setSpotifyLoading(false));

    return () => controller.abort();
  }, [activeSection, spotifyCategory, spotifyConnection?.connected, lastSpotifyPodcast]);

  return (
    <div
      className={cn(
        "relative min-h-dvh overflow-x-hidden transition-colors duration-700",
        activeSection === "spotify" && "bg-[#050505] text-white"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 -z-10 transition-opacity duration-700",
          activeSection === "spotify"
            ? "bg-[radial-gradient(circle_at_18%_0%,rgba(139,0,0,0.34),transparent_30%),radial-gradient(circle_at_92%_8%,rgba(8,95,68,0.18),transparent_28%),linear-gradient(180deg,#0b0b0d_0%,#050506_48%,#000_100%)]"
            : "bg-[radial-gradient(circle_at_5%_0%,color-mix(in_oklab,var(--primary)_25%,transparent),transparent_45%),radial-gradient(circle_at_95%_0%,color-mix(in_oklab,var(--accent)_35%,transparent),transparent_40%)]"
        )}
      />

      <div className="mx-auto grid w-full max-w-[1600px] gap-4 overflow-x-hidden px-3 py-4 sm:gap-6 sm:px-4 sm:py-6 lg:gap-6 lg:px-8 lg:py-8">
        <aside
          className={cn(
            "sticky top-2 z-30 rounded-2xl border border-border/70 bg-card/75 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/65 sm:top-4 sm:px-4 sm:py-3.5",
            activeSection === "spotify" &&
              "border-white/10 bg-[#08080a]/85 text-white supports-[backdrop-filter]:bg-[#08080a]/75"
          )}
        >
          <div className="flex flex-col gap-3 sm:gap-3.5">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">UpSkillr</p>
                <p className="hidden text-[11px] text-muted-foreground sm:block">
                  Student workspace
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Home
                </Link>
                <AuthNavControls />
              </div>
            </div>

            <nav
              className={cn(
                "flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 pt-px [-webkit-overflow-scrolling:touch]",
                "[scrollbar-width:thin]",
                "[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.12] [&::-webkit-scrollbar-track]:bg-transparent",
                activeSection !== "spotify" &&
                  "[&::-webkit-scrollbar-thumb]:bg-foreground/[0.12]",
                "snap-x snap-mandatory"
              )}
            >
              {navSections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex shrink-0 snap-start items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                      active
                        ? activeSection === "spotify"
                          ? "bg-[#b11226] text-white shadow-lg shadow-[#b11226]/25"
                          : "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : cn(
                            "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                            activeSection === "spotify" && "text-[#cfc8bc] hover:bg-white/[0.08]"
                          )
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="whitespace-nowrap">{section.label}</span>
                  </button>
                );
              })}
            </nav>

            {spotifyNavbarActive && selectedSpotifyPodcast?.embedUrl ? (
              <div
                className={cn(
                  "flex flex-col gap-2.5 border-t pt-3 sm:gap-3",
                  activeSection === "spotify" ? "border-white/[0.08]" : "border-border/50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Podcast className="size-3.5 shrink-0 text-[#1bd760]" aria-hidden />
                    <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                      Now playing
                    </span>
                  </div>
                  {selectedSpotifyPodcast?.title && (
                    <span
                      title={selectedSpotifyPodcast.title}
                      className="hidden max-w-[45%] truncate text-xs font-medium text-foreground md:block lg:max-w-xs"
                    >
                      {selectedSpotifyPodcast.title}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={selectPreviousSpotifyItem}
                    className={cn(
                      "shrink-0 rounded-full border p-2 transition-colors active:scale-[0.97]",
                      activeSection === "spotify"
                        ? "border-white/12 bg-white/[0.06] hover:bg-white/12"
                        : "border-border/80 bg-background/70 hover:bg-muted/80",
                      spotifyPodcasts.length === 0 && "pointer-events-none opacity-40"
                    )}
                    aria-label="Previous Spotify item"
                  >
                    <SkipBack className="size-4" />
                  </button>

                  <div className="min-w-0 flex-1 px-px">
                    <SpotifyNavbarPlayer
                      title={selectedSpotifyPodcast.title}
                      embedUrl={withSpotifyEmbedResume(
                        selectedSpotifyPodcast.embedUrl!,
                        spotifyIframeResumeSeconds
                      )}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={selectNextSpotifyItem}
                    className={cn(
                      "shrink-0 rounded-full border p-2 transition-colors active:scale-[0.97]",
                      activeSection === "spotify"
                        ? "border-white/12 bg-white/[0.06] hover:bg-white/12"
                        : "border-border/80 bg-background/70 hover:bg-muted/80",
                      spotifyPodcasts.length === 0 && "pointer-events-none opacity-40"
                    )}
                    aria-label="Next Spotify item"
                  >
                    <SkipForward className="size-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0 space-y-4 overflow-x-hidden lg:space-y-6">
          <div
            className={cn(
              "min-w-0 space-y-4 overflow-x-hidden rounded-2xl border bg-card/60 p-3 animate-in fade-in duration-300 sm:p-4",
              activeSection === "spotify" &&
                "border-white/10 bg-[#050506]/80 shadow-2xl shadow-black/40"
            )}
          >
            {activeSection === "courses" && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>My Courses</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {availableCourses.map((course) => (
                    <div
                      key={course.name}
                      className="rounded-xl border bg-background/70 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-primary/15 p-2 text-primary">
                          <BookOpenText className="size-5" />
                        </span>
                        <p className="font-semibold">{course.name}</p>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {course.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeSection === "videos" && (
              <div className="-m-3 min-w-0 space-y-4 overflow-x-hidden rounded-[1.5rem] border border-white/10 bg-[#050506] p-3 text-[#f6f1e8] shadow-2xl shadow-black/60 sm:-m-4 sm:space-y-5 sm:rounded-[2rem] sm:p-4 md:p-6">
                {videoStudioOpen && selectedVideo ? (
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.22),transparent_34%),linear-gradient(135deg,#15161d_0%,#08080a_55%,#030304_100%)] p-4 shadow-2xl shadow-black/50 sm:p-5">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-2xl font-black tracking-tight sm:text-3xl">
                          {selectedVideo.title}
                        </h2>
                        <p className="mt-1 text-sm text-[#d6d0c6]/60">
                          {selectedVideo.channelTitle} · {selectedVideo.topic}
                        </p>
                        {videoStartSeconds > 0 && (
                          <p className="mt-2 text-xs font-semibold text-blue-200">
                            Resuming from {formatVideoProgress(videoStartSeconds)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoStudioOpen(false)}
                        className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-[#f6f1e8] transition-colors hover:bg-white/10"
                      >
                        Back to videos
                      </button>
                    </div>

                    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] xl:gap-8">
                      <Card className="min-w-0 border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                            <Video className="size-5 text-blue-300" />
                            Video
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="relative aspect-video min-h-[12.5rem] w-full overflow-hidden rounded-2xl bg-black shadow-inner ring-1 ring-white/10">
                            <iframe
                              title={`YouTube player for ${selectedVideo.title}`}
                              src={`${selectedVideo.embedUrl}?rel=0&modestbranding=1&start=${Math.floor(
                                videoStartSeconds
                              )}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              loading="lazy"
                              className="absolute inset-0 h-full w-full border-0"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                            <NotebookPen className="size-5 text-blue-300" />
                            Notes
                          </CardTitle>
                          <p className="line-clamp-2 text-sm text-[#d6d0c6]/60">
                            Write notes while the video plays beside this panel.
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => wrapSelectedNoteText("## ")}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#f6f1e8] hover:bg-white/10"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => insertIntoNote("\n- ")}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#f6f1e8] hover:bg-white/10"
                            >
                              Bullet
                            </button>
                            <button
                              type="button"
                              onClick={() => insertIntoNote("\n- [ ] ")}
                              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#f6f1e8] hover:bg-white/10"
                            >
                              <CheckSquare className="mr-1.5 size-3.5" />
                              Task
                            </button>
                            <button
                              type="button"
                              onClick={() => wrapSelectedNoteText("\n```\n", "\n```\n")}
                              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#f6f1e8] hover:bg-white/10"
                            >
                              <Code2 className="mr-1.5 size-3.5" />
                              Code
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                insertIntoNote(`\n[${formatStudyTimestamp()}] important concept - `)
                              }
                              className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-2 text-xs font-bold text-blue-100 hover:bg-blue-500/25"
                            >
                              <Clock3 className="mr-1.5 size-3.5" />
                              Timestamp
                            </button>
                          </div>
                          <textarea
                            ref={noteTextareaRef}
                            value={videoNote}
                            onChange={(event) => setVideoNote(event.target.value)}
                            placeholder="Write key concepts, timestamps, doubts, and practice tasks..."
                            className="min-h-[min(420px,calc(100dvh-14rem))] w-full resize-none rounded-2xl border border-white/10 bg-black/35 p-4 text-base leading-relaxed text-[#f6f1e8] outline-none transition-colors placeholder:text-[#d6d0c6]/35 focus:border-blue-400/60 sm:min-h-[360px] md:text-sm xl:min-h-[520px]"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-[#d6d0c6]/55">
                              {noteStatus ?? "Autosave is ready for this video."}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={createNoteSnapshot}
                                className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                              >
                                <Save className="mr-2 size-4" />
                                Save snapshot
                              </button>
                              <button
                                type="button"
                                onClick={exportNoteMarkdown}
                                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-[#f6f1e8] transition-colors hover:bg-white/10"
                              >
                                <Download className="mr-2 size-4" />
                                Markdown
                              </button>
                              <button
                                type="button"
                                onClick={exportNotePdf}
                                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-[#f6f1e8] transition-colors hover:bg-white/10"
                              >
                                <FileText className="mr-2 size-4" />
                                PDF
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                      <Card className="border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                            <NotebookPen className="size-5 text-blue-300" />
                            History
                          </CardTitle>
                          <p className="text-sm text-[#d6d0c6]/60">
                            Snapshots for this video.
                          </p>
                        </CardHeader>
                        <CardContent className="grid max-h-72 gap-2 overflow-y-auto">
                          {noteHistory.length ? (
                            noteHistory.map((entry) => (
                              <button
                                key={entry.id}
                                type="button"
                                onClick={() => {
                                  setVideoNote(entry.content);
                                  setNoteStatus("Restored note snapshot.");
                                }}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.07]"
                              >
                                <p className="text-xs font-bold text-blue-200">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </p>
                                <p className="mt-2 line-clamp-3 text-xs text-[#d6d0c6]/65">
                                  {entry.content}
                                </p>
                              </button>
                            ))
                          ) : (
                            <p className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-[#d6d0c6]/60">
                              Use Save snapshot to keep versions while autosave handles the latest note.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                  </section>
                ) : (
                  <>
                    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.28),transparent_34%),linear-gradient(135deg,#15161d_0%,#08080a_55%,#030304_100%)] p-4 shadow-2xl shadow-black/50 sm:p-6">
                      <div className="space-y-5">
                        <Badge className="w-fit border border-blue-400/30 bg-blue-500/15 text-blue-100 hover:bg-blue-500/15">
                          YouTube course finder
                        </Badge>
                        <div>
                          <h2 className="max-w-4xl text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
                            Pick a course, then open your study room.
                          </h2>
                          <p className="mt-3 max-w-2xl text-sm text-[#d6d0c6]/75 md:text-base">
                            The selected video opens in a focused layout with the player on the left and notes on the right.
                          </p>
                        </div>
                        <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                          {["All", ...courseCategories].map((topic) => (
                            <button
                              key={`video-${topic}`}
                              type="button"
                              onClick={() => {
                                setVideoTopic(topic);
                                setVideoStudioOpen(false);
                              }}
                              className={cn(
                                "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                                videoTopic === topic
                                  ? "border-blue-500 bg-blue-600 text-white"
                                  : "border-white/15 bg-black/40 text-[#d6d0c6] hover:border-blue-400/50 hover:bg-white/5"
                              )}
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                        {videosMessage && (
                          <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#d6d0c6]/70">
                            {videosMessage}
                          </p>
                        )}
                      </div>
                    </section>

                    {recentLearningVideos.length > 0 && (
                      <Card className="min-w-0 border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                            <Clock3 className="size-5 text-blue-300" />
                            Recently Viewed
                          </CardTitle>
                          <p className="text-sm text-[#d6d0c6]/60">
                            Resume a video with its saved notes and snapshots.
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {recentLearningVideos.slice(0, 4).map((video) => (
                              <div
                                key={video.id}
                                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                              >
                                <div
                                  className="h-32 bg-[#141416] bg-cover bg-center"
                                  style={
                                    video.thumbnailUrl
                                      ? { backgroundImage: `url(${video.thumbnailUrl})` }
                                      : undefined
                                  }
                                >
                                  <div className="flex h-full items-start justify-between bg-gradient-to-b from-black/10 to-black/80 p-3">
                                    <Badge className="bg-black/70 text-white hover:bg-black/70">
                                      {video.topic}
                                    </Badge>
                                    <span className="rounded-full bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                                      {formatVideoProgress(video.progressSeconds)}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-3 p-4">
                                  <div>
                                    <p className="line-clamp-2 text-sm font-bold text-[#f6f1e8]">
                                      {video.title}
                                    </p>
                                    <p className="mt-1 line-clamp-1 text-xs text-[#d6d0c6]/50">
                                      {video.channelTitle}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openVideoStudyRoom(video, true)}
                                      className="rounded-full bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                                    >
                                      Resume
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openVideoStudyRoom(video, false)}
                                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#f6f1e8] transition-colors hover:bg-white/10"
                                    >
                                      Start over
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <section className="space-y-3">
                      <div>
                        <h3 className="text-lg font-black text-[#f6f1e8]">
                          Pick a recommendation section
                        </h3>
                        <p className="text-sm text-[#d6d0c6]/60">
                          Each section loads only 3 YouTube videos to keep API usage low.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {videoTopicSections.map((section) => {
                          const active = videoTopic === section.topic;

                          return (
                            <button
                              key={section.topic}
                              type="button"
                              onClick={() => {
                                setVideoTopic(section.topic);
                                setVideoStudioOpen(false);
                              }}
                              className={cn(
                                "rounded-2xl border bg-gradient-to-br p-4 text-left transition-all hover:-translate-y-1 hover:border-blue-400/60",
                                section.accent,
                                active
                                  ? "border-blue-500 shadow-lg shadow-blue-500/20"
                                  : "border-white/10"
                              )}
                            >
                              <Badge className="border border-white/10 bg-black/35 text-white hover:bg-black/35">
                                3 videos
                              </Badge>
                              <p className="mt-3 font-bold text-[#f6f1e8]">
                                {section.title}
                              </p>
                              <p className="mt-2 text-sm leading-relaxed text-[#d6d0c6]/60">
                                {section.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <Card className="min-w-0 border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                          <Search className="size-5 text-blue-300" />
                          {videoTopic} Recommendations
                        </CardTitle>
                        <p className="text-sm text-[#d6d0c6]/60">
                          Showing only 3 videos for this section.
                        </p>
                      </CardHeader>
                      <CardContent>
                        {videosLoading ? (
                          <div className="grid gap-3 md:grid-cols-3">
                            {[1, 2, 3].map((item) => (
                              <div
                                key={item}
                                className="h-64 animate-pulse rounded-2xl bg-white/10"
                              />
                            ))}
                          </div>
                        ) : learningVideos.length ? (
                          <div className="grid gap-3 md:grid-cols-3">
                            {learningVideos.map((video) => (
                              <button
                                key={video.id}
                                type="button"
                                onClick={() => {
                                  openVideoStudyRoom(video, true);
                                }}
                                className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] text-left transition-all hover:-translate-y-1 hover:border-blue-500 hover:bg-[#171719]"
                              >
                                <div
                                  className="h-44 bg-[#141416] bg-cover bg-center"
                                  style={
                                    video.thumbnailUrl
                                      ? { backgroundImage: `url(${video.thumbnailUrl})` }
                                      : undefined
                                  }
                                >
                                  <div className="flex h-full items-start justify-between bg-gradient-to-b from-black/10 to-black/80 p-3">
                                    <Badge className="bg-black/70 text-white hover:bg-black/70">
                                      {video.topic}
                                    </Badge>
                                    <span className="rounded-full bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-transform group-hover:scale-105">
                                      {getRecentProgress(video.id) > 0 ? "Resume" : "Open"}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2 p-4">
                                  <p className="line-clamp-2 font-bold text-[#f6f1e8]">
                                    {video.title}
                                  </p>
                                  <p className="line-clamp-1 text-xs text-[#d6d0c6]/50">
                                    {video.channelTitle}
                                  </p>
                                  {getRecentProgress(video.id) > 0 && (
                                    <p className="text-xs font-semibold text-blue-200">
                                      Resume from {formatVideoProgress(getRecentProgress(video.id))}
                                    </p>
                                  )}
                                  <p className="line-clamp-3 text-xs leading-relaxed text-[#d6d0c6]/60">
                                    {video.description}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-[#d6d0c6]/70">
                            No videos loaded yet. Check that `YOUTUBE_API_KEY` is set, then try another topic.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {activeSection === "notes" && (
              <div className="-m-3 min-w-0 space-y-4 overflow-x-hidden rounded-[1.5rem] border border-white/10 bg-[#050506] p-3 text-[#f6f1e8] shadow-2xl shadow-black/60 sm:-m-4 sm:space-y-5 sm:rounded-[2rem] sm:p-4 md:p-6">
                <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.22),transparent_34%),linear-gradient(135deg,#15161d_0%,#08080a_55%,#030304_100%)] p-4 shadow-2xl shadow-black/50 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                        Your saved notes in one place.
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm text-[#d6d0c6]/75 md:text-base">
                        Search notes by content, topic, or the video they were created with.
                      </p>
                    </div>
                    <Badge className="border border-white/10 bg-white/[0.05] text-[#f6f1e8] hover:bg-white/[0.05]">
                      {savedVideoNotes.length} saved
                    </Badge>
                  </div>
                </section>

                <Card className="border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                      <Search className="size-5 text-blue-300" />
                      Search Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      value={noteSearch}
                      onChange={(event) => setNoteSearch(event.target.value)}
                      placeholder="Search note title, video, topic, or note content..."
                      className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-[#f6f1e8] outline-none placeholder:text-[#d6d0c6]/35 focus:border-blue-400/60"
                    />
                    {filteredSavedVideoNotes.length ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {filteredSavedVideoNotes.map((note) => {
                          const relatedVideo = recentLearningVideos.find(
                            (video) => video.id === note.videoId
                          );

                          return (
                            <div
                              key={note.videoId}
                              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <input
                                    value={
                                      noteTitleDrafts[note.videoId] ??
                                      note.noteTitle ??
                                      note.videoTitle
                                    }
                                    onChange={(event) =>
                                      setNoteTitleDrafts((current) => ({
                                        ...current,
                                        [note.videoId]: event.target.value,
                                      }))
                                    }
                                    onBlur={(event) =>
                                      renameSavedNote(note.videoId, event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.currentTarget.blur();
                                      }
                                    }}
                                    className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm font-bold text-[#f6f1e8] outline-none transition-colors placeholder:text-[#d6d0c6]/35 focus:border-blue-400/60"
                                    aria-label="Rename note"
                                  />
                                  <p className="mt-1 text-xs text-blue-200">
                                    Video: {note.videoTitle}
                                  </p>
                                  <p className="mt-1 text-xs text-blue-200">Topic: {note.topic}</p>
                                  <p className="mt-1 text-xs text-[#d6d0c6]/45">
                                    Updated {new Date(note.updatedAt).toLocaleString()}
                                  </p>
                                </div>
                                <NotebookPen className="size-5 shrink-0 text-blue-300" />
                              </div>
                              <p className="mt-4 line-clamp-5 whitespace-pre-wrap text-sm leading-relaxed text-[#d6d0c6]/70">
                                {note.content || "Empty note"}
                              </p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVideoNote(note.content);
                                    setNoteStatus(`Loaded note for ${note.videoTitle}.`);
                                  }}
                                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#f6f1e8] transition-colors hover:bg-white/10"
                                >
                                  Load note
                                </button>
                                {relatedVideo ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveSection("videos");
                                      openVideoStudyRoom(relatedVideo, true);
                                    }}
                                    className="rounded-full bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                                  >
                                    Open with video
                                  </button>
                                ) : (
                                  <span className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-bold text-[#d6d0c6]/45">
                                    Video not in recent list
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteSavedNote(note)}
                                  className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-100 transition-colors hover:bg-red-500/20"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-[#d6d0c6]/70">
                        No notes found yet. Open a learning video and start taking notes.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "spotify" && (
              <div className="-m-3 min-w-0 space-y-4 overflow-x-hidden rounded-[1.5rem] border border-white/10 bg-[#050506] p-3 text-[#f6f1e8] shadow-2xl shadow-black/60 sm:-m-4 sm:space-y-5 sm:rounded-[2rem] sm:p-4 md:p-6">
                {spotifyConnection === null ? (
                  <section className="grid min-h-[520px] place-items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(177,18,38,0.28),transparent_32%),linear-gradient(135deg,#171719_0%,#080809_52%,#050506_100%)] p-4 text-center shadow-2xl shadow-black/70 sm:min-h-[620px] sm:rounded-[1.75rem] sm:p-6">
                    <div className="mx-auto max-w-xl space-y-5">
                      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#b11226]/20 text-[#f6f1e8] ring-1 ring-[#b11226]/30 sm:size-20 sm:rounded-3xl">
                        <Podcast className="size-8 animate-pulse sm:size-10" />
                      </div>
                      <div>
                        <Badge className="border border-white/10 bg-white/[0.05] text-[#f6f1e8] hover:bg-white/[0.05]">
                          Checking Spotify
                        </Badge>
                        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                          Loading your audio workspace...
                        </h2>
                        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#d6d0c6]/70">
                          We are checking whether your Spotify account is connected.
                        </p>
                      </div>
                      <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-[#b11226]" />
                      </div>
                    </div>
                  </section>
                ) : !spotifyConnection.connected ? (
                  <section className="grid min-h-[520px] place-items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(177,18,38,0.35),transparent_32%),linear-gradient(135deg,#171719_0%,#080809_52%,#050506_100%)] p-4 text-center shadow-2xl shadow-black/70 sm:min-h-[620px] sm:rounded-[1.75rem] sm:p-6">
                    <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
                      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#b11226]/20 text-[#f6f1e8] ring-1 ring-[#b11226]/30 sm:size-20 sm:rounded-3xl">
                        <Podcast className="size-8 sm:size-10" />
                      </div>
                      <div>
                        <Badge className="border border-[#b11226]/40 bg-[#b11226]/15 text-[#f6f1e8] hover:bg-[#b11226]/15">
                          Spotify required
                        </Badge>
                        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
                          Connect Spotify to unlock your audio dashboard.
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#d6d0c6]/70 md:text-base">
                          We will show podcast recommendations, behavior-based
                          study audio, and the in-app player after your Spotify
                          account is connected.
                        </p>
                      </div>
                      {spotifyConnection?.message && (
                        <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#d6d0c6]/70">
                          {spotifyConnection.message}
                        </p>
                      )}
                      <Link
                        href="/api/auth/spotify/start"
                        className={cn(
                          buttonVariants({ size: "lg" }),
                          "bg-[#b11226] text-white hover:bg-[#8f0e1f]"
                        )}
                      >
                        <Link2 className="mr-2 size-4" />
                        Connect Spotify
                      </Link>
                    </div>
                  </section>
                ) : (
                  <>
                <section className="min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgba(177,18,38,0.22),transparent_32%),linear-gradient(135deg,#171719_0%,#080809_48%,#130305_100%)] p-4 shadow-2xl shadow-black/70 sm:rounded-[1.75rem] sm:p-6">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h2 className="max-w-4xl text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
                          Study audio for every session.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm text-[#d6d0c6]/75 md:text-base">
                          Pick a topic, choose an episode or playlist, and control playback from the navbar.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-xs font-semibold text-green-100">
                        Connected as {spotifyConnection.profile?.name ?? "Spotify user"}
                        {spotifyConnection.profile?.product
                          ? ` · ${spotifyConnection.profile.product}`
                          : ""}
                      </div>
                    </div>
                    <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                      {["All", ...courseCategories].map((category) => (
                        <button
                          key={`spotify-${category}`}
                          type="button"
                          onClick={() => setSpotifyCategory(category)}
                          className={cn(
                            "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                            spotifyCategory === category
                              ? "border-[#b11226] bg-[#b11226] text-white"
                              : "border-white/15 bg-black/40 text-[#d6d0c6] hover:border-[#b11226]/50 hover:bg-white/5"
                          )}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    {(selectedSpotifyPodcast || lastSpotifyPodcast) && (
                      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                        <div
                          className="size-14 shrink-0 rounded-xl bg-[#141416] bg-cover bg-center"
                          style={
                            (selectedSpotifyPodcast ?? lastSpotifyPodcast)?.imageUrl
                              ? {
                                  backgroundImage: `url(${
                                    (selectedSpotifyPodcast ?? lastSpotifyPodcast)?.imageUrl
                                  })`,
                                }
                              : undefined
                          }
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-bold text-[#f6f1e8]">
                            {selectedSpotifyPodcast?.title ?? lastSpotifyPodcast?.title}
                          </p>
                          <p className="line-clamp-1 text-xs text-[#d6d0c6]/55">
                            {selectedSpotifyPodcast ? "Playing in navbar" : "Ready to continue"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {recentSpotifyListens.length > 0 && (
                  <Card className="min-w-0 border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                        <Headphones className="size-5 text-[#1bd760]" />
                        Recently listened
                      </CardTitle>
                      <p className="text-sm text-[#d6d0c6]/60">
                        Resume where you left off. Progress is tracked in this browser while the
                        player is active (approximate).
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {recentSpotifyListens.slice(0, 8).map((entry) => (
                          <div
                            key={entry.id}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                          >
                            <div
                              className="h-28 bg-[#141416] bg-cover bg-center"
                              style={
                                entry.imageUrl
                                  ? { backgroundImage: `url(${entry.imageUrl})` }
                                  : undefined
                              }
                            >
                              <div className="flex h-full items-start justify-between bg-gradient-to-b from-black/10 to-black/80 p-3">
                                <Badge className="border border-white/10 bg-black/70 text-white hover:bg-black/70">
                                  {entry.kind ?? "audio"}
                                </Badge>
                                <span className="rounded-full bg-[#b11226]/90 px-2.5 py-1.5 text-[0.65rem] font-bold text-white tabular-nums">
                                  {formatVideoProgress(entry.progressSeconds)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-3 p-4">
                              <div>
                                <p className="line-clamp-2 text-sm font-bold text-[#f6f1e8]">
                                  {entry.title}
                                </p>
                                <p className="mt-1 line-clamp-1 text-xs text-[#d6d0c6]/55">
                                  {entry.publisher}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSection("spotify");
                                    selectSpotifyAudio(entry, {
                                      offsetSeconds: entry.progressSeconds,
                                    });
                                  }}
                                  className="rounded-full bg-[#b11226] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#8f0e1f]"
                                >
                                  Resume
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSection("spotify");
                                    selectSpotifyAudio(entry, { offsetSeconds: 0 });
                                  }}
                                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#f6f1e8] transition-colors hover:bg-white/10"
                                >
                                  Start over
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <section className="min-w-0 space-y-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0b0d] p-4 shadow-xl shadow-black/40 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">Browse Spotify Audio</h3>
                      <p className="text-sm text-[#d6d0c6]/60">
                        Scroll sideways and pick a card to open episodes, tracks, and play options.
                      </p>
                    </div>
                    <Badge className="border border-[#b11226]/40 bg-[#b11226]/15 text-[#f6f1e8] hover:bg-[#b11226]/15">
                      {spotifyCategory}
                    </Badge>
                  </div>
                  {spotifyMessage && (
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#d6d0c6]/65">
                      {spotifyMessage}
                    </p>
                  )}
                  {spotifyLoading ? (
                    <div className="flex max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch]">
                      {[1, 2, 3, 4].map((item) => (
                        <div
                          key={item}
                          className="h-64 min-h-48 min-w-[min(16rem,calc(100dvw-2.5rem))] max-w-[min(16rem,calc(100dvw-2.5rem))] shrink-0 animate-pulse snap-start rounded-2xl bg-white/10"
                        />
                      ))}
                    </div>
                  ) : spotifyRows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-[#d6d0c6]/70">
                      <p className="font-semibold text-[#f6f1e8]">
                        No playable Spotify audio loaded yet.
                      </p>
                      <p className="mt-2">
                        Try another topic filter. If this keeps happening,
                        reconnect Spotify.
                      </p>
                    </div>
                  ) : (
                    spotifyRows.map((row) => (
                      <div key={row.title} className="min-w-0 space-y-3">
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-[#f6f1e8]">
                            {row.title}
                          </h4>
                          <p className="text-xs text-[#d6d0c6]/55">{row.subtitle}</p>
                        </div>
                        <div className="flex max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch]">
                          {row.items.map((podcast) => {
                            const selected = selectedSpotifyPodcast?.id === podcast.id;
                            return (
                              <button
                                key={podcast.id}
                                type="button"
                                onClick={() => handleSpotifyCardClick(podcast)}
                                className={cn(
                                  "group shrink-0 snap-start overflow-hidden rounded-2xl border bg-[#111113] text-left transition-all hover:-translate-y-1 hover:bg-[#171719]",
                                  "min-h-48 min-w-[min(16rem,calc(100dvw-2.5rem))] max-w-[min(16rem,calc(100dvw-2.5rem))]",
                                  selected
                                    ? "border-[#b11226] shadow-lg shadow-[#b11226]/20"
                                    : "border-white/10"
                                )}
                              >
                                <div
                                  className="h-36 bg-[#141416] bg-cover bg-center"
                                  style={
                                    podcast.imageUrl
                                      ? { backgroundImage: `url(${podcast.imageUrl})` }
                                      : undefined
                                  }
                                >
                                  <div className="flex h-full items-start justify-between bg-gradient-to-b from-black/10 to-black/75 p-3">
                                    <Badge className="bg-black/70 text-white hover:bg-black/70">
                                      {podcast.kind ?? "audio"}
                                    </Badge>
                                    <span className="rounded-full bg-[#b11226] px-3 py-2 text-xs font-bold text-white opacity-90 transition-transform group-hover:scale-105">
                                      {podcast.kind === "episode" || podcast.kind === "track" ? (
                                        <PlayCircle className="size-4 fill-current" />
                                      ) : podcast.kind === "playlist" ? (
                                        "Tracks"
                                      ) : (
                                        "Episodes"
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2 p-4">
                                  <div>
                                    <p className="line-clamp-2 font-bold text-[#f6f1e8]">
                                      {podcast.title}
                                    </p>
                                    <p className="line-clamp-1 text-xs text-[#d6d0c6]/50">
                                      {podcast.publisher}
                                    </p>
                                  </div>
                                  <p className="line-clamp-3 text-xs leading-relaxed text-[#d6d0c6]/60">
                                    {podcast.description}
                                  </p>
                                  <Badge className="bg-blue-500/15 text-blue-200 hover:bg-blue-500/15">
                                    {podcast.kind === "episode" || podcast.kind === "track"
                                      ? `${podcast.episodeCount} min`
                                      : podcast.kind === "playlist"
                                        ? `${podcast.episodeCount} tracks`
                                        : `${podcast.episodeCount} episodes`}
                                  </Badge>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </section>
                  </>
                )}
              </div>
            )}

            {activeSection === "community" && (
              <div className="-mx-3 min-h-[min(560px,calc(100dvh-14rem))] min-w-0 overflow-hidden sm:-m-4 md:min-h-[620px] lg:min-h-0">
                <CommunityWorkspace className="h-full min-h-0 rounded-xl border border-white/10 bg-[#050506] p-3 sm:rounded-[1.75rem] sm:p-4 md:rounded-[2rem] md:p-5" />
              </div>
            )}

          </div>
        </main>
      </div>
      {audioDrawerItem && (
        <div className="fixed inset-0 z-50 grid max-h-[100dvh] place-items-center overflow-y-auto overscroll-none bg-black/75 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] backdrop-blur-md">
          <div className="max-h-[min(86vh,calc(100dvh-8rem))] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#08080a] text-[#f6f1e8] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="flex min-w-0 gap-4">
                <div
                  className="hidden size-20 shrink-0 rounded-2xl border border-white/10 bg-[#141416] bg-cover bg-center sm:block"
                  style={
                    audioDrawerItem.imageUrl
                      ? { backgroundImage: `url(${audioDrawerItem.imageUrl})` }
                      : undefined
                  }
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d6d0c6]/50">
                    {audioDrawerItem.kind === "playlist"
                      ? "Playlist tracks"
                      : audioDrawerItem.kind === "episode" || audioDrawerItem.kind === "track"
                        ? "Audio details"
                        : "Show episodes"}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-2xl font-black">
                    {audioDrawerItem.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-sm text-[#d6d0c6]/60">
                    {audioDrawerItem.publisher}
                  </p>
                  <p className="mt-2 text-xs text-[#d6d0c6]/55">
                    {totalDrawerItems
                      ? `${totalDrawerItems} total · ${remainingDrawerItems} left from current selection`
                      : "Open an item below to play it in UpSkillr."}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {lastSpotifyPodcast && !selectedSpotifyPodcast && (
                  <button
                    type="button"
                    onClick={() => selectSpotifyAudio(lastSpotifyPodcast)}
                    className="hidden rounded-full border border-[#b11226]/40 bg-[#b11226]/20 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#b11226]/30 sm:inline-flex"
                  >
                    Continue
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAudioDrawerItem(null)}
                  className="rounded-full border border-white/10 p-2 transition-colors hover:bg-white/10"
                  aria-label="Close audio details"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[min(62vh,calc(100dvh-12rem))] overflow-y-auto p-4 sm:p-5">
              {audioDrawerLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-20 animate-pulse rounded-2xl bg-white/10" />
                  ))}
                </div>
              ) : audioDrawerItems.length ? (
                <div className="space-y-3">
                  {audioDrawerItems.map((item, index) => {
                    const selected = selectedSpotifyPodcast?.id === item.id;
                    const leftAfterThis = Math.max(0, audioDrawerItems.length - index - 1);

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex w-full flex-col gap-3 rounded-2xl border bg-white/[0.03] p-3 text-left transition-colors sm:flex-row sm:items-center",
                          selected ? "border-[#b11226]" : "border-white/10"
                        )}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#b11226]/20 text-sm font-bold text-[#f6f1e8]">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-[#d6d0c6]/60">
                            {item.description}
                          </p>
                          <p className="mt-2 text-xs text-blue-200">
                            {item.episodeCount} min · {leftAfterThis} left after this
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            selectSpotifyAudio(item, { offsetSeconds: 0 });
                            setAudioDrawerItem(null);
                          }}
                          className="self-start rounded-full bg-[#b11226] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#8f0e1f] sm:self-center"
                        >
                          {selected ? "Playing" : "Play"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-[#d6d0c6]/65">
                  <ListMusic className="mx-auto mb-3 size-8 text-[#d6d0c6]/40" />
                  No playable items loaded here. Try another recommendation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
