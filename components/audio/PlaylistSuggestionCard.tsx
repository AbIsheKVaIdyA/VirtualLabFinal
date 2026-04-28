import { Headphones } from "lucide-react";

import type { AudioRecommendationItem } from "@/services/aiPlaylistGenerator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function PlaylistSuggestionCard({ item }: { item: AudioRecommendationItem }) {
  return (
    <Card className="border-white/10 bg-white/[0.04] text-[#f6f1e8]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-xl bg-[#b11226]/20 p-3 text-[#f6f1e8]">
          <Headphones className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <p className="truncate text-xs text-[#d6d0c6]/55">{item.spotifyId}</p>
        </div>
        <Badge className="bg-blue-500/15 text-blue-200 hover:bg-blue-500/15">
          {item.category}
        </Badge>
      </CardContent>
    </Card>
  );
}
