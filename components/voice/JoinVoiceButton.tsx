"use client";

import { Mic, MicOff, PhoneOff, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function JoinVoiceButton({
  joined,
  muted,
  deafened,
  onJoin,
  onLeave,
  onToggleMute,
  onToggleDeafen,
}: {
  joined: boolean;
  muted: boolean;
  deafened: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
}) {
  if (!joined) {
    return (
      <Button onClick={onJoin} className="w-full gap-2">
        <Mic className="size-4" />
        Join Voice
      </Button>
    );
  }

  return (
    <div className="grid touch-manipulation grid-cols-3 gap-2 [&_button]:min-h-11">
      <Button variant="secondary" onClick={onToggleMute} aria-label="Toggle mute">
        {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </Button>
      <Button variant="secondary" onClick={onToggleDeafen} aria-label="Toggle deafen">
        <VolumeX className={deafened ? "size-4 text-primary" : "size-4"} />
      </Button>
      <Button variant="destructive" onClick={onLeave} aria-label="Leave voice">
        <PhoneOff className="size-4" />
      </Button>
    </div>
  );
}
