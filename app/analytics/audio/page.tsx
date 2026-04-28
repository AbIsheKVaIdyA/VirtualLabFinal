import Link from "next/link";
import { Clock, Headphones, Moon, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { defaultStudyBehavior } from "@/services/studyBehaviorTracker";

const insightCards = [
  {
    title: "Focus session",
    value: `${defaultStudyBehavior.sessionDurationMinutes} min`,
    description: "Current tracked session duration",
    icon: Clock,
  },
  {
    title: "Best mode",
    value: "Focus",
    description: "Recommended for current learning behavior",
    icon: Target,
  },
  {
    title: "Audio style",
    value: "Instrumental",
    description: "Low-distraction audio is preferred while coding",
    icon: Headphones,
  },
  {
    title: "Time slot",
    value: defaultStudyBehavior.timeOfDay,
    description: "Used by automation rules",
    icon: Moon,
  },
];

export default function AudioAnalyticsPage() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/80 p-5">
          <div>
            <p className="text-sm text-muted-foreground">Learning Audio Intelligence</p>
            <h1 className="text-3xl font-semibold tracking-tight">Audio Analytics</h1>
          </div>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Back to Dashboard
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insightCards.map(({ title, value, description, icon: Icon }) => (
            <Card key={title} className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-4 text-primary" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold capitalize">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>What this page will show with database events</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <p>Focus hours per day from study session events.</p>
            <p>Most productive time slots from engagement and focus scores.</p>
            <p>Music types that improved engagement.</p>
            <p>Podcast completion and Focus Mode usage stats.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
