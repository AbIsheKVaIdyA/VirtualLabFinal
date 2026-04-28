"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpenText,
  Disc3,
  Link2,
  PlayCircle,
  Podcast,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioRecommendationPanel } from "@/components/audio/AudioRecommendationPanel";
import { FocusMode } from "@/components/audio/FocusMode";
import { NowPlayingBar } from "@/components/audio/NowPlayingBar";
import { AuthNavControls } from "@/components/auth-nav-controls";
import { CommunityWorkspace } from "@/components/community/CommunityWorkspace";
import { StudyInsightsPanel } from "@/components/dashboard/StudyInsightsPanel";
import { cn } from "@/lib/utils";
import { runAudioAutomationEngine } from "@/services/audioAutomationEngine";
import { defaultStudyBehavior } from "@/services/studyBehaviorTracker";

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
  "Python",
  "Web Development",
  "Data Science",
  "Cybersecurity",
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
  kind?: "episode" | "show";
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

type SectionId = "courses" | "spotify" | "community";

const navSections: Array<{ id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "courses", label: "My Courses", icon: BookOpenText },
  { id: "spotify", label: "Spotify Podcasts", icon: Podcast },
  { id: "community", label: "Community", icon: Disc3 },
];

function DashboardContent() {
  const [spotifyCategory, setSpotifyCategory] = useState("All");
  const [spotifyPodcasts, setSpotifyPodcasts] = useState<SpotifyPodcast[]>([]);
  const [selectedSpotifyPodcast, setSelectedSpotifyPodcast] = useState<SpotifyPodcast | null>(
    null
  );
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyMessage, setSpotifyMessage] = useState<string | null>(null);
  const [spotifyConnection, setSpotifyConnection] = useState<SpotifyConnection | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("courses");
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(true);
  const audioDecision = runAudioAutomationEngine(defaultStudyBehavior);

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
    if (activeSection !== "spotify" || !spotifyConnection?.connected) {
      queueMicrotask(() => {
        setSpotifyPodcasts([]);
        setSelectedSpotifyPodcast(null);
        setSpotifyMessage(null);
        setSpotifyLoading(false);
      });
      return;
    }

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
          setSelectedSpotifyPodcast((current) =>
            current && podcasts.some((podcast) => podcast.id === current.id)
              ? current
              : podcasts[0] ?? null
          );
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
  }, [activeSection, spotifyCategory, spotifyConnection?.connected]);

  return (
    <div
      className={cn(
        "relative min-h-screen transition-colors duration-700",
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

      <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-3 py-4 sm:px-4 sm:py-6 lg:gap-6 lg:px-8 lg:py-8">
        <aside
          className={cn(
            "sticky top-2 z-30 rounded-2xl border border-border/70 bg-card/75 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/65 sm:top-4",
            activeSection === "spotify" &&
              "border-white/10 bg-[#08080a]/85 text-white supports-[backdrop-filter]:bg-[#08080a]/75"
          )}
        >
          <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "rounded-xl bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground",
                  activeSection === "spotify" && "bg-[#b11226] text-white"
                )}
              >
                VL
              </span>
              <div>
                <p className="text-sm font-semibold">Virtual Lab</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Student Workspace</p>
              </div>
            </div>

            <nav className="flex max-w-full items-center gap-2 overflow-x-auto px-1 pb-1 lg:justify-center lg:pb-0">
            {navSections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                    active
                      ? activeSection === "spotify"
                        ? "bg-[#b11226] text-white shadow-lg shadow-[#b11226]/20"
                        : "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {section.label}
                </button>
              );
            })}
            </nav>

            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Home
              </Link>
              <AuthNavControls />
            </div>
          </div>
        </aside>

        <main className="space-y-4 lg:space-y-6">
          <div
            className={cn(
              "space-y-4 rounded-2xl border bg-card/60 p-3 animate-in fade-in duration-300 sm:p-4",
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

            {activeSection === "spotify" && (
              <div className="-m-3 space-y-4 rounded-[1.5rem] border border-white/10 bg-[#050506] p-3 text-[#f6f1e8] shadow-2xl shadow-black/60 sm:-m-4 sm:space-y-5 sm:rounded-[2rem] sm:p-4 md:p-6">
                <FocusMode
                  active={focusModeActive}
                  behavior={defaultStudyBehavior}
                  recommendation={audioDecision.recommendation}
                  onExit={() => setFocusModeActive(false)}
                />
                {!spotifyConnection?.connected ? (
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
                <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,#171719_0%,#080809_44%,#36080c_100%)] p-4 shadow-2xl shadow-black/70 sm:rounded-[1.75rem] sm:p-6">
                  <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:gap-6">
                    <div className="space-y-5">
                      <Badge className="w-fit border border-[#b11226]/40 bg-[#b11226]/15 text-[#f6f1e8] hover:bg-[#b11226]/15">
                        Curated audio library
                      </Badge>
                      <div>
                        <h2 className="max-w-4xl text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
                          Play study audio inside Virtual Lab.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm text-[#d6d0c6]/75 md:text-base">
                          Pick a topic and start a Spotify episode or show from
                          the embedded player without leaving your study flow.
                        </p>
                      </div>
                      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
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
                      <div className="grid gap-3 sm:flex sm:flex-wrap">
                        <Button
                          type="button"
                          onClick={() => setFocusModeActive(true)}
                          className="bg-[#b11226] text-white hover:bg-[#8f0e1f]"
                        >
                          Start Focus Mode
                        </Button>
                        {spotifyConnection?.connected ? (
                          <div className="rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-100">
                            Connected as {spotifyConnection.profile?.name ?? "Spotify user"}
                            {spotifyConnection.profile?.product
                              ? ` · ${spotifyConnection.profile.product}`
                              : ""}
                          </div>
                        ) : (
                          <Link
                            href="/api/auth/spotify/start"
                            className={cn(
                              buttonVariants({ variant: "outline" }),
                              "border-white/15 bg-white/5 text-[#f6f1e8] hover:bg-white/10"
                            )}
                          >
                            <Link2 className="mr-2 size-4" />
                            Connect Spotify
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/50 backdrop-blur sm:p-4">
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold">
                        <PlayCircle className="size-4 text-blue-300" />
                        Now selected
                      </p>
                      {selectedSpotifyPodcast ? (
                        <div className="space-y-4">
                          <div
                            className="aspect-[16/10] rounded-2xl bg-[#141416] bg-cover bg-center shadow-2xl shadow-black/50 ring-1 ring-white/10 sm:aspect-square"
                            style={
                              selectedSpotifyPodcast.imageUrl
                                ? {
                                    backgroundImage: `url(${selectedSpotifyPodcast.imageUrl})`,
                                  }
                                : undefined
                            }
                          />
                          <div>
                            <p className="line-clamp-1 text-xl font-black">
                              {selectedSpotifyPodcast.title}
                            </p>
                            <p className="line-clamp-1 text-sm text-[#d6d0c6]/60">
                              {selectedSpotifyPodcast.publisher}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded-2xl bg-white/5 text-white/50">
                          <Podcast className="size-12" />
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr] xl:gap-5">
                  <AudioRecommendationPanel
                    decision={audioDecision}
                    behavior={defaultStudyBehavior}
                  />
                  <StudyInsightsPanel behavior={defaultStudyBehavior} />
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_1fr] xl:gap-5">
                  <Card className="border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                        <Disc3 className="size-5 text-[#b11226]" />
                        Now Playing
                      </CardTitle>
                      <p className="text-sm text-[#d6d0c6]/60">
                        Use the embedded Spotify player below. Select any card
                        on the right to switch what plays here.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {selectedSpotifyPodcast?.embedUrl ? (
                        <iframe
                          title={`Spotify player for ${selectedSpotifyPodcast.title}`}
                          src={selectedSpotifyPodcast.embedUrl}
                          width="100%"
                          height="352"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          className="min-h-[220px] rounded-2xl border-0"
                        />
                      ) : (
                        <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center text-sm text-[#d6d0c6]/70">
                          <div>
                            <p className="font-semibold text-[#f6f1e8]">
                              Loading playable Spotify audio...
                            </p>
                            <p className="mt-2">
                              Choose a topic or wait for Spotify recommendations
                              to finish loading.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-[#0b0b0d] text-[#f6f1e8] shadow-xl shadow-black/40">
                    <CardHeader className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-[#f6f1e8]">
                          <Podcast className="size-5 text-blue-300" />
                          Playable Recommendations
                        </CardTitle>
                        <Badge className="border border-[#b11226]/40 bg-[#b11226]/15 text-[#f6f1e8] hover:bg-[#b11226]/15">
                          {spotifyCategory}
                        </Badge>
                      </div>
                      {spotifyMessage && (
                        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#d6d0c6]/65">
                          {spotifyMessage}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {spotifyLoading ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[1, 2, 3, 4, 5, 6].map((item) => (
                            <div
                              key={item}
                              className="h-44 animate-pulse rounded-2xl bg-white/10"
                            />
                          ))}
                        </div>
                      ) : spotifyPodcasts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-[#d6d0c6]/70">
                          <p className="font-semibold text-[#f6f1e8]">
                            No playable Spotify recommendations loaded yet.
                          </p>
                          <p className="mt-2">
                            Try another topic filter. If this keeps happening,
                            reconnect Spotify.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                          {spotifyPodcasts.map((podcast, index) => {
                            const selected = selectedSpotifyPodcast?.id === podcast.id;
                            return (
                              <button
                                key={podcast.id}
                                type="button"
                                onClick={() => setSelectedSpotifyPodcast(podcast)}
                                className={cn(
                                  "group overflow-hidden rounded-2xl border bg-[#111113] text-left transition-all hover:-translate-y-1 hover:bg-[#171719]",
                                  selected
                                    ? "border-[#b11226] shadow-lg shadow-[#b11226]/20"
                                    : "border-white/10"
                                )}
                              >
                                <div
                                  className="h-32 bg-[#141416] bg-cover bg-center sm:h-36"
                                  style={
                                    podcast.imageUrl
                                      ? { backgroundImage: `url(${podcast.imageUrl})` }
                                      : undefined
                                  }
                                >
                                  <div className="flex h-full items-start justify-between bg-gradient-to-b from-black/10 to-black/70 p-3">
                                    <Badge className="bg-black/70 text-white hover:bg-black/70">
                                      #{index + 1}
                                    </Badge>
                                    <span className="rounded-full bg-[#b11226] p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                      <PlayCircle className="size-4 fill-current" />
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2 p-4">
                                  <div>
                                    <p className="line-clamp-1 font-bold text-[#f6f1e8]">
                                      {podcast.title}
                                    </p>
                                    <p className="line-clamp-1 text-xs text-[#d6d0c6]/50">
                                      {podcast.publisher}
                                    </p>
                                  </div>
                                  <p className="line-clamp-3 text-xs leading-relaxed text-[#d6d0c6]/60">
                                    {podcast.description}
                                  </p>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <Badge className="bg-white/10 text-[#f6f1e8] hover:bg-white/10">
                                      {podcast.kind ?? "audio"}
                                    </Badge>
                                    <Badge className="bg-blue-500/15 text-blue-200 hover:bg-blue-500/15">
                                      {podcast.kind === "episode"
                                        ? `${podcast.episodeCount} min`
                                        : `${podcast.episodeCount} episodes`}
                                    </Badge>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
                <NowPlayingBar
                  recommendation={audioDecision.recommendation}
                  playing={audioPlaying}
                  onTogglePlay={() => setAudioPlaying((value) => !value)}
                />
                  </>
                )}
              </div>
            )}

            {activeSection === "community" && (
              <CommunityWorkspace className="-m-4 rounded-[2rem] border border-white/10 bg-[#050506] p-4 md:p-5" />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
