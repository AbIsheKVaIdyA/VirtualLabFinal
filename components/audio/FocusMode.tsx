"use client";

import { Minimize2, TimerReset } from "lucide-react";

import type { AudioRecommendation } from "@/services/aiPlaylistGenerator";
import type { StudyBehaviorSnapshot } from "@/services/studyBehaviorTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function FocusMode({
  active,
  behavior,
  recommendation,
  onExit,
}: {
  active: boolean;
  behavior: StudyBehaviorSnapshot;
  recommendation: AudioRecommendation;
  onExit: () => void;
}) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-xl sm:p-6">
      <Card className="w-full max-w-2xl border-white/10 bg-[#08080a] text-[#f6f1e8] shadow-2xl">
        <CardContent className="space-y-5 p-5 sm:space-y-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#d6d0c6]/60">Focus Mode</p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {behavior.topicContext} study session
              </h2>
            </div>
            <Button variant="outline" size="icon" onClick={onExit} aria-label="Exit focus mode">
              <Minimize2 className="size-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-[#d6d0c6]/55">Current task</p>
              <p className="mt-1 font-semibold capitalize">{behavior.activity}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-[#d6d0c6]/55">Session</p>
              <p className="mt-1 font-semibold">{behavior.sessionDurationMinutes} min</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-[#d6d0c6]/55">Focus score</p>
              <p className="mt-1 font-semibold">{behavior.focusScore}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <TimerReset className="size-4 text-[#b11226]" />
              Now playing
            </p>
            <p className="mt-2 text-xl font-semibold">
              {recommendation.items[0]?.title ?? "Focus audio"}
            </p>
            <p className="mt-1 text-sm text-[#d6d0c6]/65">{recommendation.reason}</p>
          </div>

          <p className="text-sm text-[#d6d0c6]/65">
            Notifications are dimmed in this mode. Only the current task, timer,
            and recommended audio stay visible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
