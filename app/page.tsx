import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BrainCircuit,
  Clock3,
  Gamepad2,
  GraduationCap,
  Library,
  Layers3,
  Microscope,
  Newspaper,
  Radio,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { AuthNavControls } from "@/components/auth-nav-controls";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type LiveUpdate = {
  title: string;
  source: string;
  url: string;
};

const highlights = [
  {
    title: "Structured Learning Paths",
    description:
      "Organized courses for each semester and skill level so students know exactly what to learn next.",
    icon: BookOpenText,
  },
  {
    title: "Badges and Achievements",
    description:
      "Keep learners motivated with badges, milestones, and completion streaks across every course.",
    icon: BadgeCheck,
  },
  {
    title: "Community First",
    description:
      "Connect students and mentors through Discord-driven cohorts, discussion rooms, and peer help.",
    icon: Users,
  },
  {
    title: "Future-Ready Integrations",
    description:
      "Planned support for educational games, short reels, and external learning APIs in one hub.",
    icon: Gamepad2,
  },
];

const weeklyPlan = [
  { week: "Week 01", topic: "Foundations + Orientation", outcome: "Set learning goals and baseline skills" },
  { week: "Week 02", topic: "Guided Core Concepts", outcome: "Complete mentor-backed concept drills" },
  { week: "Week 03", topic: "Applied Lab Practice", outcome: "Build mini project with peer reviews" },
  { week: "Week 04", topic: "Assessment + Showcase", outcome: "Earn badge and publish portfolio proof" },
];

const learningPillars = [
  {
    title: "Curriculum Driven",
    description: "Semester-style structure with clear learning outcomes and mastery checkpoints.",
    icon: Library,
  },
  {
    title: "Lab First",
    description: "Hands-on exercises, simulations, and mini-projects in every module.",
    icon: Microscope,
  },
  {
    title: "Mentor Guided",
    description: "Office hours, cohort discussions, and guided feedback from instructors.",
    icon: Users,
  },
];

async function getLiveUpdates(): Promise<LiveUpdate[]> {
  const fallback: LiveUpdate[] = [
    {
      title: "How universities are using AI tutors in 2026",
      source: "Virtual Lab Insights",
      url: "#",
    },
    {
      title: "Top student communities driving completion rates",
      source: "Community Research",
      url: "#",
    },
    {
      title: "Building project-first learning experiences",
      source: "Learning Design Notes",
      url: "#",
    },
  ];

  try {
    const response = await fetch(
      "https://dev.to/api/articles?tag=education&per_page=3",
      { next: { revalidate: 1800 } }
    );

    if (!response.ok) return fallback;
    const data = (await response.json()) as Array<{
      title: string;
      url: string;
      user?: { name?: string };
    }>;

    if (!Array.isArray(data) || data.length === 0) return fallback;

    return data.map((item) => ({
      title: item.title,
      source: item.user?.name ?? "DEV Community",
      url: item.url,
    }));
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const liveUpdates = await getLiveUpdates();

  return (
    <div className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary))_0%,transparent_38%),radial-gradient(circle_at_85%_10%,hsl(var(--accent))_0%,transparent_32%)] opacity-20" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-10 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">
              VL
            </span>
            <p className="font-semibold tracking-tight">Virtual Lab</p>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features">Features</a>
            <a href="#live-learning">Live Learning</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#waitlist">Waitlist</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className={buttonVariants()}>
              Open Demo
            </Link>
            <AuthNavControls />
          </div>
        </header>

        <section className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Badge className="gap-2 px-3 py-1 text-xs">
              <Sparkles className="size-3.5" />
              Academic-grade virtual learning environment
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Learn like a campus. Build like a lab. Grow with a community.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">
              Virtual Lab combines curriculum, practical lab sessions, and community
              mentorship so students gain real, measurable academic outcomes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Launch Student Dashboard
                <ArrowRight className="size-4" />
              </Link>
              <a href="#waitlist" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Join Early Access
              </a>
            </div>
            <div className="grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Learners</p>
                <p className="text-lg font-semibold">2,480+</p>
              </div>
              <div className="rounded-xl border bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="text-lg font-semibold">86%</p>
              </div>
              <div className="rounded-xl border bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Badges/week</p>
                <p className="text-lg font-semibold">1,294</p>
              </div>
              <div className="rounded-xl border bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Live cohorts</p>
                <p className="text-lg font-semibold">42</p>
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted/20">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="size-5 text-primary" />
                Learning Intelligence Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border bg-background/80 p-3">
                <p className="flex items-center justify-between">
                  <span>Recommended Track</span>
                  <Badge>Python Core</Badge>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Based on learner activity, completion, and discussion engagement.
                </p>
              </div>
              <div className="rounded-xl border bg-background/80 p-3">
                <p className="flex items-center justify-between">
                  <span>Community Momentum</span>
                  <span className="font-semibold">+18% this week</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  More learners joining Discord sessions and challenge rooms.
                </p>
              </div>
              <div className="rounded-xl border bg-background/80 p-3">
                <p className="flex items-center justify-between">
                  <span>Live sessions this week</span>
                  <span className="font-semibold">08 scheduled</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Workshops, coding sprints, and mentor office hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card className="rounded-xl border-primary/20 bg-gradient-to-br from-primary/10 to-card">
            <CardHeader>
              <CardTitle>Why It Feels Like Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {learningPillars.map(({ title, description, icon: Icon }) => (
                <div key={title} className="rounded-lg border bg-background/70 p-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 text-primary" />
                    {title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Sample 4-Week Learning Arc</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {weeklyPlan.map((item) => (
                <div key={item.week} className="rounded-lg border bg-background/70 p-3">
                  <p className="text-xs font-semibold text-primary">{item.week}</p>
                  <p className="mt-1 text-sm font-semibold">{item.topic}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.outcome}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="live-learning" className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="size-5 text-primary" />
                Live Learning Feed (education API)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {liveUpdates.map((update) => (
                <a
                  key={update.title}
                  href={update.url}
                  target={update.url === "#" ? undefined : "_blank"}
                  rel={update.url === "#" ? undefined : "noopener noreferrer"}
                  className="block rounded-xl border bg-background/70 p-3 transition-colors hover:bg-muted/40"
                >
                  <p className="line-clamp-2 text-sm font-semibold">{update.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Source: {update.source}
                  </p>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="size-5 text-primary" />
                What feels live here
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border p-3">
                <p className="font-semibold">Fresh learning feed</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Auto-refreshes with real educational articles.
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="font-semibold">Discovery-first layout</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  New students instantly see what to learn next.
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="font-semibold">Community-ready architecture</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Designed to sync events and updates from Discord.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="features" className="grid gap-4 md:grid-cols-2">
          {highlights.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="size-5 text-primary" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Academic Outcomes You Can Track</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Course Mastery</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Topic-level progress with module completion and assessments.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Practical Competency</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Lab scores and project checkpoints visible to students and mentors.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Community Participation</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Discord learning activity tied to cohorts and learning paths.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers3 className="size-4 text-primary" />
                Structured Paths
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Beginner to advanced tracks with checkpoints and prerequisite logic.
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-primary" />
                Goal-Based Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Students pick outcomes and the app recommends courses and resources.
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4 text-primary" />
                Campus Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Built for universities, cohorts, mentors, and measurable progress.
            </CardContent>
          </Card>
        </section>

        <section id="roadmap" className="rounded-xl border bg-card p-6">
          <h2 className="text-2xl font-semibold tracking-tight">Roadmap</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Build phase-by-phase with clear priorities and fast delivery.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phase 1: Foundation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Authentication, student dashboard, courses, tracking, and badges.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phase 2: Community</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Discord integration, cohort chats, mentor sessions, and events.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phase 3: Dynamic Content</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                CMS news page, educational reels, game modules, and analytics.
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="waitlist" className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Get early access updates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your email and we will notify you as new modules go live.
          </p>
          <Separator className="my-4" />
          <form className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="you@university.edu"
              className="sm:max-w-sm"
            />
            <Button type="submit">Join Waitlist</Button>
          </form>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">API modules you can turn on next</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use APIs that strengthen education outcomes, not decorative visuals.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Newspaper className="size-4 text-primary" />
                Content Feeds
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                DEV API, RSS2JSON, Ghost/WordPress APIs for fresh updates.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Radio className="size-4 text-primary" />
                Course Recommendation
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                YouTube Data API for top videos by topic, rating, and engagement.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Users className="size-4 text-primary" />
                Community Signals
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Discord API + webhooks for live member counts and event highlights.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-4 inline-flex items-center gap-2"
            )}
          >
            View Full Student Experience
            <ArrowUpRight className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
