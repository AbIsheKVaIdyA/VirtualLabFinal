"use client";

import { BarChart3, Maximize2, Pause, Play } from "lucide-react";

import type { AudioRecommendation } from "@/services/aiPlaylistGenerator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function NowPlayingBar({
  recommendation,
  playing,
  onTogglePlay,
}: {
  recommendation: AudioRecommendation;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  const activeItem = recommendation.items[0];

  return (
    <div className="sticky bottom-3 z-20 rounded-2xl border border-white/10 bg-black/80 p-3 text-[#f6f1e8] shadow-2xl backdrop-blur sm:bottom-4 sm:bg-black/70">
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          size="icon"
          onClick={onTogglePlay}
          className="rounded-full bg-[#b11226] hover:bg-[#8f0e1f]"
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {activeItem?.title ?? "No audio selected"}
          </p>
          <p className="truncate text-xs text-[#d6d0c6]/65">{recommendation.reason}</p>
          <Progress value={playing ? 42 : 0} className="mt-2 h-1.5" />
        </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/analytics/audio" className="rounded-full border px-3 py-2 text-xs">
            <BarChart3 className="mr-1 inline size-3.5" />
            Insights
          </a>
          <Button variant="outline" size="icon" aria-label="Open expanded player placeholder">
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
