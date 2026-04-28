import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  CheckCircle2,
  Disc3,
  Gamepad2,
  GraduationCap,
  Headphones,
  Library,
  PlayCircle,
  Trophy,
  Users,
} from "lucide-react";

import { AuthNavControls } from "@/components/auth-nav-controls";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const productPillars = [
  {
    title: "Courses",
    description:
      "A focused course workspace for students to follow modules, track progress, and continue learning without jumping between tools.",
    icon: BookOpenText,
    cardClass: "border-blue-500/25 bg-gradient-to-br from-blue-950/35 to-card",
    iconClass: "text-blue-300",
  },
  {
    title: "Gamified Progress",
    description:
      "Badges, streaks, path progress, and course completion states give students simple feedback without turning the platform into a gimmick.",
    icon: Trophy,
    cardClass: "border-primary/30 bg-gradient-to-br from-primary/20 to-card",
    iconClass: "text-primary",
  },
  {
    title: "Learning Community",
    description:
      "A built-in community workspace with course channels, realtime chat, voice-ready rooms, and moderation scaffolding.",
    icon: Disc3,
    cardClass: "border-indigo-400/25 bg-gradient-to-br from-indigo-950/35 to-card",
    iconClass: "text-indigo-300",
  },
  {
    title: "Spotify Learning",
    description:
      "A dedicated podcast section for educational shows so students can listen while they review, commute, or work through labs.",
    icon: Headphones,
    cardClass: "border-teal-400/25 bg-gradient-to-br from-teal-950/30 to-card",
    iconClass: "text-teal-300",
  },
];

const studentFlow = [
  {
    step: "Start a course",
    detail: "Pick a course or learning path and see what is already in progress.",
  },
  {
    step: "Build momentum",
    detail: "Use progress bars, badges, and streaks as lightweight motivation.",
  },
  {
    step: "Join the right community",
    detail: "Course channels and study rooms keep every learning path organized in one place.",
  },
  {
    step: "Listen while learning",
    detail: "Spotify podcasts support background learning and topic discovery.",
  },
];

const dashboardPreview = [
  "Current course progress",
  "Built-in community channels",
  "Realtime learning updates",
  "Spotify podcast player",
];

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_34%,transparent),transparent_36%),radial-gradient(circle_at_85%_8%,color-mix(in_oklab,var(--accent)_28%,transparent),transparent_34%)]" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 sm:py-10 lg:gap-14 lg:px-10">
        <header className="grid gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">
              VL
            </span>
            <p className="font-semibold tracking-tight">Virtual Lab</p>
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
              Open Dashboard
            </Link>
            <AuthNavControls />
          </div>
        </header>

        <section className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Learn through courses, community, and focused study habits.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Virtual Lab is a student dashboard for structured courses,
                gamified progress, a built-in learning community, and educational
                podcasts in one simple experience.
              </p>
            </div>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 sm:w-auto")}
              >
                Launch Dashboard
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#learning"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
              >
                See How It Works
              </a>
            </div>
          </div>

          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted/20">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-5 text-primary" />
                Student Dashboard Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {dashboardPreview.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border bg-background/80 p-3"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="learning" className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {productPillars.map(({ title, description, icon: Icon, cardClass, iconClass }) => (
            <Card key={title} className={cn("rounded-xl", cardClass)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className={cn("size-5", iconClass)} />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-xl border-primary/20 bg-gradient-to-br from-primary/10 to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="size-5 text-primary" />
                How A Student Uses It
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentFlow.map((item, index) => (
                <div key={item.step} className="rounded-lg border bg-background/70 p-3">
                  <p className="text-xs font-semibold text-primary">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{item.step}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Card
              id="community"
              className="rounded-xl border-indigo-400/25 bg-gradient-to-br from-indigo-950/35 to-card"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-indigo-300" />
                  Built-In Learning Community
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Students get course channels, study rooms, realtime chat, and
                voice-ready spaces without depending on an external community app.
              </CardContent>
            </Card>

            <Card className="rounded-xl border-primary/30 bg-gradient-to-br from-primary/20 to-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BadgeCheck className="size-4 text-primary" />
                  Simple Achievement Loop
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Progress states and badges help students understand what they
                have completed and what should come next.
              </CardContent>
            </Card>

            <Card
              id="spotify"
              className="rounded-xl border-teal-400/25 bg-gradient-to-br from-teal-950/30 to-card"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PlayCircle className="size-4 text-teal-300" />
                  Listen While You Learn
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Spotify podcast discovery supports background learning with
                educational shows filtered by subject.
              </CardContent>
            </Card>

            <Card className="rounded-xl border-blue-500/25 bg-gradient-to-br from-blue-950/35 to-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gamepad2 className="size-4 text-blue-300" />
                  Motivation Without Noise
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gamification is used lightly: streaks, role unlocks, progress,
                and badges support learning instead of distracting from it.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready to continue in the dashboard?
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                The landing page stays realistic; the actual experience lives in
                the dashboard where courses, community, and Spotify are connected.
              </p>
            </div>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "w-full shrink-0 gap-2 sm:w-auto")}
            >
              Open Virtual Lab
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
