"use client";

import { Brain, Route } from "lucide-react";

import type { AudioAutomationDecision } from "@/services/audioAutomationEngine";
import type { StudyBehaviorSnapshot } from "@/services/studyBehaviorTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaylistSuggestionCard } from "@/components/audio/PlaylistSuggestionCard";

export function AudioRecommendationPanel({
  decision,
  behavior,
}: {
  decision: AudioAutomationDecision;
  behavior: StudyBehaviorSnapshot;
}) {
  return (
    <Card className="border-white/10 bg-[#0b0b0d] text-[#f6f1e8]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-5 text-blue-300" />
          Audio Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Route className="size-4 text-[#b11226]" />
            {decision.action.replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-xs text-[#d6d0c6]/65">{decision.reason}</p>
        </div>
        <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-100">
          These are the behavior-based suggestions. The podcast grid below is
          the live Spotify catalog filtered by the selected learning topic.
        </div>
        <div className="grid gap-3">
          {decision.recommendation.items.map((item) => (
            <PlaylistSuggestionCard key={item.spotifyId} item={item} />
          ))}
        </div>
        <div className="grid gap-2 text-xs text-[#d6d0c6]/65 sm:grid-cols-3">
          <span>Engagement {behavior.engagementScore}</span>
          <span>Focus {behavior.focusScore}</span>
          <span>Fatigue {behavior.fatigueScore}</span>
        </div>
      </CardContent>
    </Card>
  );
}
