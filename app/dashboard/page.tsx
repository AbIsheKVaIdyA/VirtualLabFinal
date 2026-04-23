"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  Compass,
  Disc3,
  Flame,
  GraduationCap,
  Home,
  Link2,
  Medal,
  MessageSquare,
  PlayCircle,
  Podcast,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AuthNavControls } from "@/components/auth-nav-controls";
import { cn } from "@/lib/utils";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  { ssr: false }
);

const currentCourses = [
  { name: "Cloud Security Fundamentals", progress: 68, badge: "In Progress" },
  { name: "Applied Data Structures", progress: 42, badge: "Keep Going" },
  { name: "Web API Engineering", progress: 87, badge: "Almost Done" },
];

const achievements = [
  "7-day learning streak",
  "First course completed",
  "Top 10% in weekly challenge",
];

const courseCategories = [
  "Python",
  "Web Development",
  "Data Science",
  "Cybersecurity",
];

const youtubeRecommendations = [
  {
    title: "Python Full Course for Beginners",
    creator: "Programming with Mosh",
    category: "Python",
    views: 25000000,
    rating: 4.9,
    duration: "12h 14m",
  },
  {
    title: "Python Tutorial - Full Course for Beginners",
    creator: "freeCodeCamp.org",
    category: "Python",
    views: 56000000,
    rating: 4.8,
    duration: "4h 26m",
  },
  {
    title: "100 Days of Python - Complete Roadmap",
    creator: "CodeWithHarry",
    category: "Python",
    views: 5200000,
    rating: 4.7,
    duration: "9h 50m",
  },
  {
    title: "React Course - Build Production Apps",
    creator: "Traversy Media",
    category: "Web Development",
    views: 3200000,
    rating: 4.7,
    duration: "7h 08m",
  },
  {
    title: "Data Science Career Roadmap + Projects",
    creator: "Krish Naik",
    category: "Data Science",
    views: 1800000,
    rating: 4.6,
    duration: "2h 40m",
  },
  {
    title: "Complete Ethical Hacking Bootcamp",
    creator: "NetworkChuck",
    category: "Cybersecurity",
    views: 4300000,
    rating: 4.8,
    duration: "6h 15m",
  },
];

const podcasts = [
  {
    title: "Talk Python To Me",
    category: "Python",
    platform: "Spotify",
    episodes: 450,
  },
  {
    title: "Syntax",
    category: "Web Development",
    platform: "Apple Podcasts",
    episodes: 700,
  },
  {
    title: "Data Skeptic",
    category: "Data Science",
    platform: "Spotify",
    episodes: 420,
  },
  {
    title: "Darknet Diaries",
    category: "Cybersecurity",
    platform: "Spotify",
    episodes: 160,
  },
];

const learningPaths = [
  { id: "python", label: "Python", accent: "from-emerald-500/20 to-emerald-500/5" },
  { id: "web", label: "Web Development", accent: "from-blue-500/20 to-blue-500/5" },
  { id: "data", label: "Data Science", accent: "from-violet-500/20 to-violet-500/5" },
  { id: "cyber", label: "Cybersecurity", accent: "from-rose-500/20 to-rose-500/5" },
];

type SectionId = "courses" | "discover" | "community" | "achievements" | "updates";

const navSections: Array<{ id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "courses", label: "My Courses", icon: BookOpenText },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "community", label: "Community", icon: Disc3 },
  { id: "achievements", label: "Achievements", icon: Medal },
  { id: "updates", label: "University Updates", icon: CalendarClock },
];

function DashboardContent() {
  const [selectedCategory, setSelectedCategory] = useState("Python");
  const [sortBy, setSortBy] = useState<"views" | "rating">("views");
  const [activeSection, setActiveSection] = useState<SectionId>("courses");
  const searchParams = useSearchParams();
  const discordStatus = searchParams.get("discord");
  const discordUser = searchParams.get("username");
  const discordError = searchParams.get("reason");
  const [communitySummary, setCommunitySummary] = useState<{
    connected: boolean;
    user?: { displayName?: string };
    guild?: { name?: string; memberCount?: number | null; onlineCount?: number | null };
    inGeneralRole?: boolean | null;
    selectedPaths?: string[];
    primaryPath?: string | null;
    relevantChannels?: Array<{ id: string; name: string; url: string }>;
    channels?: Array<{ id: string; name: string; url: string }>;
    events?: Array<{ id: string; title: string; startsAt: string }>;
    mentorCount?: number | null;
    eventsCount?: number;
    welcomeMessage?: string;
    message?: string;
  } | null>(null);
  const [pathActionStatus, setPathActionStatus] = useState<string | null>(null);
  const [pathActionLoading, setPathActionLoading] = useState<string | null>(null);
  const [unlockPath, setUnlockPath] = useState<string | null>(null);

  const loadCommunitySummary = () => {
    fetch("/api/discord/community-summary", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setCommunitySummary(data))
      .catch(() => {
        setCommunitySummary({
          connected: false,
          message: "Could not fetch community summary yet.",
        });
      });
  };

  useEffect(() => {
    loadCommunitySummary();
  }, [discordStatus]);

  const topYoutube = useMemo(() => {
    const filtered = youtubeRecommendations.filter(
      (video) => video.category === selectedCategory
    );
    const sorted = [...filtered].sort((a, b) =>
      sortBy === "views" ? b.views - a.views : b.rating - a.rating
    );
    return sorted.slice(0, 3);
  }, [selectedCategory, sortBy]);

  const recommendedPodcasts = useMemo(
    () => podcasts.filter((podcast) => podcast.category === selectedCategory),
    [selectedCategory]
  );

  const assignPath = async (path: string) => {
    setPathActionStatus(null);
    setPathActionLoading(path);

    try {
      const res = await fetch("/api/discord/select-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };

      if (!res.ok || !data.ok) {
        setPathActionStatus(data.message ?? "Failed to assign selected path.");
      } else {
        setPathActionStatus(data.message ?? "Path assigned successfully.");
        setUnlockPath(path);
        window.setTimeout(() => setUnlockPath(null), 1400);
        loadCommunitySummary();
      }
    } catch {
      setPathActionStatus("Unexpected network error while assigning path.");
    } finally {
      setPathActionLoading(null);
    }
  };

  const setPrimaryPath = async (path: string) => {
    setPathActionStatus(null);
    setPathActionLoading(`primary-${path}`);
    try {
      const res = await fetch("/api/discord/primary-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      setPathActionStatus(data.message ?? "Primary path updated.");
      if (res.ok && data.ok) loadCommunitySummary();
    } catch {
      setPathActionStatus("Could not set primary path.");
    } finally {
      setPathActionLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_0%,color-mix(in_oklab,var(--primary)_25%,transparent),transparent_45%),radial-gradient(circle_at_95%_0%,color-mix(in_oklab,var(--accent)_35%,transparent),transparent_40%)]" />

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] lg:px-8 lg:py-8">
        <aside className="sticky top-4 h-[calc(100vh-2rem)] rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-xl bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
              VL
            </span>
            <div>
              <p className="text-sm font-semibold">Virtual Lab</p>
              <p className="text-xs text-muted-foreground">Student Workspace</p>
            </div>
          </div>

          <nav className="space-y-2">
            <div className="mb-2 flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <Home className="size-3.5" />
              Dashboard Sections
            </div>
            {navSections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>

          <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/15 to-accent/10 shadow-none">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Weekly Quest
              </p>
              <p className="text-sm font-semibold">
                Complete 2 modules to unlock the `Focused Learner` badge.
              </p>
              <Progress value={64} className="h-2" />
              <p className="text-xs text-muted-foreground">64% completed</p>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          {discordStatus && (
            <div
              className={cn(
                "rounded-xl border p-3 text-sm",
                discordStatus === "connected"
                  ? "border-emerald-300/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              )}
            >
              {discordStatus === "connected"
                ? `Discord connected${discordUser ? ` as ${discordUser}` : ""}.`
                : `Discord connection failed${discordError ? `: ${discordError}` : "."}`}
            </div>
          )}

          <header className="rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarFallback>AV</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back,</p>
                  <h1 className="text-2xl font-bold tracking-tight">Abhishek</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AuthNavControls />
                <ThemeToggle />
                <Link href="/" className={buttonVariants({ variant: "outline" })}>
                  Back to Home
                </Link>
                <Button className="gap-2">
                  Continue Learning
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, podcasts, mentors..."
                className="h-10 rounded-xl pl-9"
              />
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/15 to-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="size-4 text-primary" />
                  Courses Active
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-3xl font-semibold">12</p>
                <Badge variant="secondary">
                  {communitySummary?.selectedPaths?.length ?? 0} path roles
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-orange-300/30 bg-gradient-to-br from-orange-500/15 to-card dark:from-orange-500/25">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="size-4 text-orange-500" />
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-3xl font-semibold">18 days</p>
                <Badge variant="secondary">On fire</Badge>
              </CardContent>
            </Card>

            <Card className="border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-card dark:from-cyan-500/25">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-4 text-cyan-600 dark:text-cyan-400" />
                  Badges Earned
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-3xl font-semibold">24</p>
                <Badge variant="secondary">
                  {communitySummary?.inGeneralRole ? "General active" : "General pending"}
                </Badge>
              </CardContent>
            </Card>
          </section>

          <div className="space-y-4 rounded-2xl border bg-card/60 p-4 animate-in fade-in duration-300">
            {activeSection === "courses" && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Current Learning Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentCourses.map((course) => (
                    <div key={course.name} className="rounded-xl border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium">{course.name}</p>
                        <Badge variant="secondary">{course.badge}</Badge>
                      </div>
                      <Progress value={course.progress} className="h-2.5" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {course.progress}% complete
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeSection === "discover" && (
              <>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Explore Learning Tracks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {courseCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={cn(
                            "rounded-xl border px-4 py-2 text-sm transition-all",
                            selectedCategory === category
                              ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "border-border bg-background hover:bg-muted"
                          )}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="rounded-2xl">
                    <CardHeader className="space-y-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PlayCircle className="size-5 text-primary" />
                        Top YouTube Picks: {selectedCategory}
                      </CardTitle>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={cn(
                            "rounded-lg border px-3 py-1 text-xs",
                            sortBy === "views"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background"
                          )}
                          onClick={() => setSortBy("views")}
                        >
                          Sort by Views
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "rounded-lg border px-3 py-1 text-xs",
                            sortBy === "rating"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background"
                          )}
                          onClick={() => setSortBy("rating")}
                        >
                          Sort by Rating
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {topYoutube.map((video, index) => (
                        <div key={video.title} className="rounded-xl border p-3">
                          <p className="text-sm font-semibold">
                            #{index + 1} {video.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {video.creator}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <Badge variant="secondary">
                              {(video.views / 1000000).toFixed(1)}M views
                            </Badge>
                            <Badge variant="secondary">{video.rating} rating</Badge>
                            <Badge variant="secondary">{video.duration}</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Podcast className="size-5 text-primary" />
                        Educational Podcasts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recommendedPodcasts.map((item) => (
                        <div
                          key={item.title}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.episodes} episodes
                            </p>
                          </div>
                          <Badge>{item.platform}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeSection === "community" && (
              <>
                <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Disc3 className="size-5 text-primary" />
                    Discord Community Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border bg-background/80 p-4">
                    <p className="text-xs text-muted-foreground">Connection</p>
                    <p className="mt-1 text-sm font-semibold">
                      {communitySummary?.connected
                        ? `Connected${communitySummary.user?.displayName ? ` as ${communitySummary.user.displayName}` : ""}`
                        : "Not connected to Discord"}
                    </p>
                    {(communitySummary?.welcomeMessage || communitySummary?.message) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {communitySummary.welcomeMessage ?? communitySummary.message}
                      </p>
                    )}
                    {discordStatus === "connected" ? (
                      <Button className="mt-3 w-full gap-2" variant="secondary" disabled>
                        <CheckCircle2 className="size-4" />
                        Connected
                      </Button>
                    ) : (
                      <Link
                        href="/api/auth/discord/start"
                        className={cn(
                          buttonVariants({ variant: "default" }),
                          "mt-3 w-full gap-2"
                        )}
                      >
                        <Link2 className="size-4" />
                        Connect Discord
                      </Link>
                    )}
                  </div>

                  <div className="rounded-xl border bg-background/80 p-4">
                    <p className="text-xs text-muted-foreground">Role status</p>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-primary" />
                        <span>
                          General access:{" "}
                          <strong>
                            {communitySummary?.inGeneralRole ? "Active" : "Not assigned"}
                          </strong>
                        </span>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-2 text-xs">
                        Path roles:{" "}
                        {communitySummary?.selectedPaths?.length
                          ? communitySummary.selectedPaths.join(", ")
                          : "No path selected yet"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-background/80 p-4">
                    <p className="text-xs text-muted-foreground">Live stats</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">Members</p>
                        <p className="font-semibold">
                          {communitySummary?.guild?.memberCount ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">Online</p>
                        <p className="font-semibold">
                          {communitySummary?.guild?.onlineCount ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">Mentors</p>
                        <p className="font-semibold">
                          {communitySummary?.mentorCount ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">Events</p>
                        <p className="font-semibold">
                          {communitySummary?.eventsCount ?? "—"}
                        </p>
                      </div>
                    </div>
                    {communitySummary?.guild?.name && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Server: {communitySummary.guild.name}
                      </p>
                    )}
                  </div>
                </CardContent>
                </Card>

                <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/10 to-card">
                <CardHeader>
                  <CardTitle className="text-lg">Choose Your Learning Path</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You will always stay in the general community. Selecting a path adds
                    extra role access on top.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {learningPaths.map((path) => {
                      const active = communitySummary?.selectedPaths?.includes(path.id);
                      const isPrimary = communitySummary?.primaryPath === path.id;
                      return (
                        <div
                          key={path.id}
                          className={cn(
                            "rounded-xl border bg-gradient-to-br px-4 py-3 transition-all",
                            path.accent,
                            active
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/40",
                            pathActionLoading === path.id && "opacity-70"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => assignPath(path.id)}
                            disabled={pathActionLoading !== null}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">{path.label}</p>
                              {isPrimary && <Badge>Primary</Badge>}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {active ? "Role already assigned" : "Add role access"}
                            </p>
                          </button>
                          {active && (
                            <button
                              type="button"
                              onClick={() => void setPrimaryPath(path.id)}
                              className={cn(
                                "mt-2 rounded-md border px-2 py-1 text-xs",
                                isPrimary
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background"
                              )}
                            >
                              {isPrimary ? "Primary path" : "Make primary"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {unlockPath && (
                    <div className="animate-in fade-in zoom-in-95 rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <p className="flex items-center gap-2">
                        <Sparkles className="size-3.5" />
                        Path unlocked: {unlockPath.toUpperCase()} role added.
                      </p>
                    </div>
                  )}
                  {pathActionStatus && (
                    <p className="text-xs text-muted-foreground">{pathActionStatus}</p>
                  )}
                </CardContent>
                </Card>

                <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Path XP Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {learningPaths.map((path) => {
                    const selected = communitySummary?.selectedPaths?.includes(path.id);
                    const base = selected ? 35 : 0;
                    const bonusEvents = Math.min(25, (communitySummary?.eventsCount ?? 0) * 5);
                    const bonusCommunity = Math.min(
                      40,
                      Math.floor((communitySummary?.guild?.memberCount ?? 0) / 150)
                    );
                    const xp = Math.min(100, base + bonusEvents + bonusCommunity);
                    return (
                      <div key={`xp-${path.id}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{path.label}</span>
                          <span>{xp}%</span>
                        </div>
                        <Progress value={xp} className="h-2.5" />
                      </div>
                    );
                  })}
                </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="size-5 text-primary" />
                      Relevant Channels (General + Paths)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {communitySummary?.relevantChannels?.length ? (
                      communitySummary.relevantChannels.map((channel) => (
                        <div
                          key={channel.id}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <div>
                            <p className="text-sm font-semibold">{channel.name}</p>
                            <p className="text-xs text-muted-foreground">Live from Discord</p>
                          </div>
                          <a
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            Open
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No relevant channels available yet. Add general and path channel IDs in env.
                      </p>
                    )}
                  </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users2 className="size-5 text-primary" />
                      Upcoming Community Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {communitySummary?.events?.length ? (
                      communitySummary.events.map((event) => (
                        <div key={event.id} className="rounded-xl border p-3">
                          <p className="text-sm font-semibold">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.startsAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No scheduled Discord events right now.
                      </p>
                    )}
                  </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeSection === "achievements" && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="size-5 text-primary" />
                    Your Accomplishments
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  {achievements.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border bg-muted/40 px-4 py-3 text-sm font-medium"
                    >
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeSection === "updates" && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="size-5 text-primary" />
                    CMS Feed (Planned)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    This section is ready for your CMS integration to show
                    university notices, events, and announcements in real-time.
                  </p>
                  <p>
                    Next step: connect this tab to your selected CMS API and render
                    published posts.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
