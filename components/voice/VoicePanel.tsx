"use client";

import { useState } from "react";

import type { Channel } from "@/lib/communication-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinVoiceButton } from "@/components/voice/JoinVoiceButton";

export function VoicePanel({ channel }: { channel: Channel }) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  return (
    <Card className="h-full rounded-2xl">
      <CardHeader>
        <CardTitle>Voice: {channel.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-background/70 p-4 text-sm text-muted-foreground">
          WebRTC scaffold is ready for future signaling. The next production step is a
          signaling endpoint for offers, answers, and ICE candidates.
        </div>
        <JoinVoiceButton
          joined={joined}
          muted={muted}
          deafened={deafened}
          onJoin={() => setJoined(true)}
          onLeave={() => setJoined(false)}
          onToggleMute={() => setMuted((value) => !value)}
          onToggleDeafen={() => setDeafened((value) => !value)}
        />
      </CardContent>
    </Card>
  );
}
